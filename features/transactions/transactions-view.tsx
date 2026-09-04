"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useFinance } from "@/features/finance/finance-provider";
import { categories, type Transaction } from "@/features/finance/types";
import { categoryLabels, formatDate, formatMoney } from "@/features/finance/format";
import { useLocale } from "@/features/finance/locale-provider";
import { filterTransactions } from "@/lib/finance-utils.mjs";
import { TransactionForm } from "./transaction-form";

export function TransactionsView({ onAdd }: { onAdd: () => void }) {
  const { transactions, updateTransaction, deleteTransaction } = useFinance();
  const { language, t } = useLocale();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = useMemo(
    () => filterTransactions(transactions, { query, type, category, sort }),
    [transactions, query, type, category, sort],
  );

  const clear = () => { setQuery(""); setType("all"); setCategory("all"); setSort("newest"); };

  return (
    <section aria-labelledby="transaction-list-title">
      <h2 id="transaction-list-title" className="sr-only">{t("transactions")}</h2>
      <div className="filter-bar">
        <div className="search-field">
          <Search aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} aria-label={t("search")} />
          {query && <button onClick={() => setQuery("")} aria-label={t("clearSearch")}><X /></button>}
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label={t("filterByType")}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("allTypes")}</SelectItem><SelectItem value="income">{t("incomeType")}</SelectItem><SelectItem value="expense">{t("expenseType")}</SelectItem></SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label={t("filterByCategory")}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">{t("allCategories")}</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{categoryLabels[item]?.[language] ?? item}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label={t("sortTransactions")}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="newest">{t("newest")}</SelectItem><SelectItem value="oldest">{t("oldest")}</SelectItem><SelectItem value="amount-high">{t("amountHigh")}</SelectItem><SelectItem value="amount-low">{t("amountLow")}</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="results-meta"><p>{t("showing")} <strong>{filtered.length}</strong> {t("results")}</p><Button variant="ghost" size="sm" onClick={clear}>{t("clearFilters")}</Button></div>

      {filtered.length === 0 ? (
        <Empty className="empty-state">
          <EmptyHeader><EmptyMedia variant="icon"><Search /></EmptyMedia><EmptyTitle>{t("noResults")}</EmptyTitle><EmptyDescription>{t("emptyHint")}</EmptyDescription></EmptyHeader>
          <div className="flex gap-2"><Button variant="outline" onClick={clear}>{t("clearFilters")}</Button><Button onClick={onAdd}><Plus />{t("addTransaction")}</Button></div>
        </Empty>
      ) : (
        <div className="transaction-list surface-card">
          <div className="transaction-row transaction-head" aria-hidden="true"><span>{t("transactionColumn")}</span><span>{t("categoryColumn")}</span><span>{t("dateColumn")}</span><span className="amount-cell">{t("amountColumn")}</span></div>
          {filtered.map((item) => (
            <button key={item.id} className="transaction-row" onClick={() => setSelected(item)}>
              <span className="transaction-main"><span className={`transaction-icon ${item.type}`} aria-hidden="true">{item.type === "income" ? <ArrowDown /> : <ArrowUp />}</span><span><strong>{item.title}</strong><small>{item.note || t("noNote")}</small></span></span>
              <span><Badge variant="secondary">{categoryLabels[item.category]?.[language] ?? item.category}</Badge></span>
              <span>{formatDate(item.date, language)}</span>
              <strong className={`amount-cell ${item.type}`}>{item.type === "expense" ? "−" : "+"}{formatMoney(item.amount, language)}</strong>
            </button>
          ))}
        </div>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          {selected && <>
            <SheetHeader className="border-b"><SheetTitle>{selected.title}</SheetTitle><SheetDescription>{formatDate(selected.date, language)} · {categoryLabels[selected.category]?.[language] ?? selected.category}</SheetDescription></SheetHeader>
            <div className="transaction-detail">
              <p className="detail-amount-label">{t("amountColumn")}</p>
              <p className={`detail-amount ${selected.type}`}>{selected.type === "expense" ? "−" : "+"}{formatMoney(selected.amount, language)}</p>
              <dl><div><dt>{t("typeLabel")}</dt><dd>{selected.type === "income" ? t("incomeType") : t("expenseType")}</dd></div><div><dt>{t("categoryColumn")}</dt><dd>{categoryLabels[selected.category]?.[language] ?? selected.category}</dd></div><div><dt>{t("noteLabel")}</dt><dd>{selected.note || t("noNote")}</dd></div></dl>
            </div>
            <SheetFooter>
              <Button onClick={() => { setEditing(selected); setSelected(null); }}><Pencil />{t("editTransaction")}</Button>
              <Button variant="outline" className="danger-button" onClick={() => { deleteTransaction(selected.id); setSelected(null); }}><Trash2 />{t("deleteAction")}</Button>
            </SheetFooter>
          </>}
        </SheetContent>
      </Sheet>

      <TransactionForm open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} transaction={editing} onSubmit={(draft) => { if (editing) updateTransaction(editing.id, draft); }} />
    </section>
  );
}
