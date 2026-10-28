"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { seedData } from "./seed-data";
import type { Budget, FinanceData, Transaction, TransactionDraft } from "./types";

import { parseBackup, materializeRecurring, appendTransaction, appendMonthlyExpense, localDate } from "@/lib/finance-backup.mjs";
import { createFinanceJournal } from "@/lib/finance-journal.mjs";

const STORAGE_KEY = "mizan-finance-v1";

// Older backups omit optional fields. Treat semantically identical saves as the
// same snapshot so opening another tab never produces a false write conflict.
function equivalentSnapshots(left: string | null, right: string | null) {
  if (left === right) return true;
  if (!left || !right) return false;
  try {
    return JSON.stringify(parseBackup(JSON.parse(left))) ===
      JSON.stringify(parseBackup(JSON.parse(right)));
  } catch {
    return false;
  }
}

type FinanceContextValue = FinanceData & {
  isLoading: boolean;
  storageError: string | null;
  storageConflict: boolean;
  reloadFromStorage: () => void;
  addTransaction: (draft: TransactionDraft) => void;
  updateTransaction: (id: string, draft: TransactionDraft) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (budget: Budget) => void;
  resetDemo: () => void;
  restoreBackup: (value: unknown) => void;
  addMonthlyExpense: (draft: TransactionDraft) => void;
  removeMonthlyExpense: (id: string) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>(seedData);
  // A synchronous journal ensures two updates in the same React render cannot discard one another.
  const journal = useRef(createFinanceJournal<FinanceData>(seedData));
  const persisted = useRef<string | null>(null);
  const [storageConflict, setStorageConflict] = useState(false);
  const commit = useCallback((change: (current: FinanceData) => FinanceData) => {
    const disk = window.localStorage.getItem(STORAGE_KEY);
    if (storageConflict || !equivalentSnapshots(disk, persisted.current)) {
      setStorageConflict(true);
      throw new Error("EXTERNAL_CHANGE");
    }
    persisted.current = disk;
    const next = journal.current.commit(change); // Limits fail synchronously, before a write.
    setData(next);
  }, [storageConflict]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        persisted.current = saved;
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          const next = materializeRecurring(parseBackup(parsed), localDate());
          journal.current.replace(next);
          setData(next);
        }
      } catch {
        setStorageError("We could not read your saved data. You can safely restore the demo data.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoading || storageError || storageConflict) return;
    try {
      const disk = window.localStorage.getItem(STORAGE_KEY);
      if (!equivalentSnapshots(disk, persisted.current)) {
        queueMicrotask(() => setStorageConflict(true));
        return;
      }
      persisted.current = disk;
      const saved = JSON.stringify(data);
      if (equivalentSnapshots(disk, saved)) return;
      window.localStorage.setItem(STORAGE_KEY, saved);
      persisted.current = saved;
    } catch {
      queueMicrotask(() => setStorageError("Changes cannot be saved on this device right now."));
    }
  }, [data, isLoading, storageError, storageConflict]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === STORAGE_KEY) {
        if (equivalentSnapshots(event.newValue, persisted.current)) {
          persisted.current = event.newValue;
        } else {
          setStorageConflict(true);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const reloadFromStorage = useCallback(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next = saved ? materializeRecurring(parseBackup(JSON.parse(saved)), localDate()) : seedData;
    persisted.current = saved;
    journal.current.replace(next);
    setData(next);
    setStorageConflict(false);
    setStorageError(null);
  }, []);

  const addTransaction = useCallback((draft: TransactionDraft) => {
    const transaction: Transaction = {
      ...draft,
      id: globalThis.crypto?.randomUUID?.() ?? `tx-${Date.now()}`,
    };
    commit((current) => appendTransaction(current, transaction));
    toast.success("Transaction added");
  }, [commit]);

  const updateTransaction = useCallback((id: string, draft: TransactionDraft) => {
    commit((current) => ({
      ...current,
      transactions: current.transactions.map((item) => (item.id === id ? { ...draft, id } : item)),
    }));
    toast.success("Transaction updated");
  }, [commit]);

  const deleteTransaction = useCallback((id: string) => {
    commit((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
    toast.success("Transaction deleted");
  }, [commit]);

  const updateBudget = useCallback((budget: Budget) => {
    commit((current) => ({
      ...current,
      budgets: current.budgets.map((item) => (item.category === budget.category ? budget : item)),
    }));
    toast.success("Budget updated");
  }, [commit]);

  const resetDemo = useCallback(() => {
    let storageAvailable = true;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      storageAvailable = false;
    }
    persisted.current = null;
    journal.current.replace(seedData);
    setData(seedData);
    setStorageConflict(false);
    setStorageError(storageAvailable ? null : "Demo data is restored for this session, but browser storage is unavailable.");
    setIsLoading(false);
    toast.success("Demo data restored");
  }, []);

  const restoreBackup = useCallback((value: unknown) => {
    // Restores are writes too. A stale tab must not silently replace changes
    // already committed by another tab, even if the backup is valid.
    const disk = window.localStorage.getItem(STORAGE_KEY);
    if (storageConflict || !equivalentSnapshots(disk, persisted.current)) {
      setStorageConflict(true);
      throw new Error("EXTERNAL_CHANGE");
    }
    const restored = materializeRecurring(parseBackup(value), localDate());
    // Persist before replacing the current view. Failure leaves the current data intact.
    const serialized = JSON.stringify(restored);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    persisted.current = serialized;
    journal.current.replace(restored);
    setStorageConflict(false);
    setData(restored); setStorageError(null); setIsLoading(false);
  }, [storageConflict]);
  const addMonthlyExpense = useCallback((draft: TransactionDraft) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `rule-${Date.now()}`;
    commit((current) => appendMonthlyExpense(current, {
      id, day: Number(draft.date.slice(8)), nextDate: draft.date, draft: { ...draft, type: "expense" },
    }, localDate()));
  }, [commit]);
  const removeMonthlyExpense = useCallback((id: string) => {
    commit((current) => ({ ...current, recurring: (current.recurring || []).filter((r) => r.id !== id) }));
  }, [commit]);

  const value = useMemo(
    () => ({ ...data, isLoading, storageError, storageConflict, reloadFromStorage, addTransaction, updateTransaction, deleteTransaction, updateBudget, resetDemo, restoreBackup, addMonthlyExpense, removeMonthlyExpense }),
    [data, isLoading, storageError, storageConflict, reloadFromStorage, addTransaction, updateTransaction, deleteTransaction, updateBudget, resetDemo, restoreBackup, addMonthlyExpense, removeMonthlyExpense],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used inside FinanceProvider");
  return context;
}
