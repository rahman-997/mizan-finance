"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/features/finance/finance-provider";
import { categoryLabels, formatMoney } from "@/features/finance/format";
import { useLocale } from "@/features/finance/locale-provider";
import { currentMonthTransactions } from "@/lib/finance-utils.mjs";
import type { Budget } from "@/features/finance/types";

const tones: Record<string, string> = { Housing: "indigo", Food: "orange", Transport: "green", Health: "rose", Learning: "blue", Leisure: "purple" };

export function BudgetsView() {
  const { transactions, budgets, updateBudget } = useFinance();
  const { language, t } = useLocale();
  const monthExpenses = currentMonthTransactions(transactions).filter((item) => item.type === "expense");
  const [editing, setEditing] = useState<Budget | null>(null);
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  const totalSpent = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalLimit = budgets.reduce((sum, item) => sum + item.limit, 0);
  const remaining = totalLimit - totalSpent;
  const usedPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const rows = budgets.map((budget) => ({
    ...budget,
    spent: monthExpenses.filter((item) => item.category === budget.category).reduce((sum, item) => sum + item.amount, 0),
  }));

  const openEditor = (budget: Budget) => { setEditing(budget); setLimit(String(budget.limit)); setError(""); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(limit);
    if (!Number.isFinite(value) || value <= 0) { setError(t("budgetPositive")); return; }
    if (value > 1_000_000) { setError(t("budgetTooLarge")); return; }
    if (editing) updateBudget({ category: editing.category, limit: value });
    setEditing(null);
  };

  return (
    <div className="budget-page">
      <section className="budget-hero surface-card" aria-label={t("monthlyBudgetSummary")}>
        <div className="budget-orbit"><Target aria-hidden="true" /><span>{usedPercent}%</span><small>{t("used")}</small></div>
        <div><p className="eyebrow">{t("yourLimit")}</p><h2>{formatMoney(totalLimit, language)}</h2><p>{remaining >= 0 ? `${formatMoney(remaining, language)} ${t("availableRestMonth")}` : `${formatMoney(Math.abs(remaining), language)} ${t("abovePlan")}`}</p></div>
        <dl><div><dt>{t("spent")}</dt><dd>{formatMoney(totalSpent, language)}</dd></div><div><dt>{t("remaining")}</dt><dd className={remaining < 0 ? "expense" : "income"}>{formatMoney(remaining, language)}</dd></div></dl>
      </section>

      <section aria-labelledby="budget-list-title">
        <div className="section-heading"><div><p className="eyebrow">{t("categoryPlans")}</p><h2 id="budget-list-title">{t("monthlyBudgets")}</h2><span>{t("budgetIntro")}</span></div></div>
        <div className="budget-tile-grid">
          {rows.map((budget) => {
            const percent = budget.limit > 0 ? Math.round((budget.spent / budget.limit) * 100) : 0;
            const remainingValue = budget.limit - budget.spent;
            return (
              <article className="budget-tile surface-card" key={budget.category}>
                <div className="budget-tile-head"><span className={`category-icon ${tones[budget.category]}`}><Target /></span><div><h3>{categoryLabels[budget.category]?.[language] ?? budget.category}</h3><p>{formatMoney(budget.limit, language)} {t("monthlyLimit")}</p></div><Button variant="ghost" size="icon" onClick={() => openEditor(budget)} aria-label={`${t("editBudget")} ${budget.category}`}><Pencil /></Button></div>
                <div className="budget-numbers"><strong>{formatMoney(budget.spent, language)}</strong><span>{Math.max(percent, 0)}%</span></div>
                <Progress value={Math.min(percent, 100)} className={percent > 100 ? "over" : ""} />
                <div className={remainingValue < 0 ? "budget-status over" : "budget-status"}>{remainingValue < 0 ? <AlertTriangle /> : <CheckCircle2 />}<span>{remainingValue < 0 ? `${formatMoney(Math.abs(remainingValue), language)} ${t("overBudget")}` : `${formatMoney(remainingValue, language)} ${t("remaining")}`}</span></div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("editBudget")}</DialogTitle><DialogDescription>{t("updateMonthlyLimit")} {editing ? categoryLabels[editing.category]?.[language] ?? editing.category : t("thisCategory")}.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <div className="grid gap-2"><Label htmlFor="budget-limit">{t("monthlyLimitUsd")}</Label><Input id="budget-limit" type="number" min="1" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} aria-invalid={Boolean(error)} />{error && <p className="form-error" role="alert">{error}</p>}</div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>{t("cancel")}</Button><Button type="submit">{t("saveBudget")}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
