"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { seedData } from "./seed-data";
import type { Budget, FinanceData, Transaction, TransactionDraft } from "./types";

const STORAGE_KEY = "mizan-finance-v1";

type FinanceContextValue = FinanceData & {
  isLoading: boolean;
  storageError: string | null;
  addTransaction: (draft: TransactionDraft) => void;
  updateTransaction: (id: string, draft: TransactionDraft) => void;
  deleteTransaction: (id: string) => void;
  updateBudget: (budget: Budget) => void;
  resetDemo: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const isFinanceData = (value: unknown): value is FinanceData => {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<FinanceData>;
  return Array.isArray(data.transactions) && Array.isArray(data.budgets);
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>(seedData);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      await Promise.resolve();
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (!isFinanceData(parsed)) throw new Error("Saved data has an unsupported format.");
          setData(parsed);
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
    if (isLoading || storageError) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      queueMicrotask(() => setStorageError("Changes cannot be saved on this device right now."));
    }
  }, [data, isLoading, storageError]);

  const addTransaction = useCallback((draft: TransactionDraft) => {
    const transaction: Transaction = {
      ...draft,
      id: globalThis.crypto?.randomUUID?.() ?? `tx-${Date.now()}`,
    };
    setData((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
    toast.success("Transaction added");
  }, []);

  const updateTransaction = useCallback((id: string, draft: TransactionDraft) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.map((item) => (item.id === id ? { ...draft, id } : item)),
    }));
    toast.success("Transaction updated");
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
    toast.success("Transaction deleted");
  }, []);

  const updateBudget = useCallback((budget: Budget) => {
    setData((current) => ({
      ...current,
      budgets: current.budgets.map((item) => (item.category === budget.category ? budget : item)),
    }));
    toast.success("Budget updated");
  }, []);

  const resetDemo = useCallback(() => {
    let storageAvailable = true;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      storageAvailable = false;
    }
    setData(seedData);
    setStorageError(storageAvailable ? null : "Demo data is restored for this session, but browser storage is unavailable.");
    setIsLoading(false);
    toast.success("Demo data restored");
  }, []);

  const value = useMemo(
    () => ({ ...data, isLoading, storageError, addTransaction, updateTransaction, deleteTransaction, updateBudget, resetDemo }),
    [data, isLoading, storageError, addTransaction, updateTransaction, deleteTransaction, updateBudget, resetDemo],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used inside FinanceProvider");
  return context;
}
