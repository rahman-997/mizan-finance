"use client";

import { ArrowDown, ArrowUp, ChevronRight, CircleDollarSign, PiggyBank, Plus, ReceiptText, Sparkles } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/features/finance/finance-provider";
import { categoryLabels, formatDate, formatMoney } from "@/features/finance/format";
import { useLocale } from "@/features/finance/locale-provider";
import { calculateSummary, currentMonthTransactions, monthlySeries } from "@/lib/finance-utils.mjs";

const palette: Record<string, string> = {
  Housing: "#5d5fef",
  Food: "#ef8f2f",
  Transport: "#22a98a",
  Health: "#dd5b74",
  Learning: "#3c8be8",
  Leisure: "#9874dc",
};

export function DashboardView({ onAdd }: { onAdd: () => void }) {
  const { transactions, budgets } = useFinance();
  const { language, t } = useLocale();
  const monthItems = currentMonthTransactions(transactions);
  const monthSummary = calculateSummary(monthItems);
  const totalSummary = calculateSummary(transactions);
  const series = monthlySeries(transactions);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const metrics = [
    { label: t("totalBalance"), value: totalSummary.balance, icon: CircleDollarSign, tone: "indigo", meta: t("acrossAllActivity") },
    { label: t("income"), value: monthSummary.income, icon: ArrowDown, tone: "green", meta: t("thisMonth") },
    { label: t("expenses"), value: monthSummary.expenses, icon: ArrowUp, tone: "orange", meta: t("thisMonth") },
    { label: t("savingsRate"), value: monthSummary.savingsRate, icon: PiggyBank, tone: "purple", meta: t("thisMonth"), percent: true },
  ];

  return (
    <div className="dashboard-stack">
      <section className="metric-grid" aria-label={t("financialSummary")}>
        {metrics.map(({ label, value, icon: Icon, tone, meta, percent }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon ${tone}`}><Icon aria-hidden="true" /></div>
            <div><p>{label}</p><strong>{percent ? `${Math.round(value)}%` : formatMoney(value, language)}</strong><small>{meta}</small></div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="surface-card chart-card">
          <div className="card-heading"><div><p className="eyebrow">{t("cashFlowEyebrow")}</p><h2>{t("monthlyFlow")}</h2><span>{t("monthlyFlowHint")}</span></div><div className="chart-legend"><span><i className="income-dot" />{t("income")}</span><span><i className="expense-dot" />{t("expenses")}</span></div></div>
          <div className="chart-wrap" aria-label={t("monthlyFlow")}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5d5fef" stopOpacity={0.28}/><stop offset="100%" stopColor="#5d5fef" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef8f2f" stopOpacity={0.2}/><stop offset="100%" stopColor="#ef8f2f" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-line)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)" }} formatter={(value) => formatMoney(Number(value), language)} />
                <Area type="monotone" dataKey="income" stroke="#5d5fef" strokeWidth={3} fill="url(#incomeFill)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef8f2f" strokeWidth={3} fill="url(#expenseFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card budget-card">
          <div className="card-heading"><div><p className="eyebrow">{t("limitsEyebrow")}</p><h2>{t("budgetPulse")}</h2><span>{t("budgetPulseHint")}</span></div><a href="/budgets" className="text-link">{t("viewAll")}<ChevronRight /></a></div>
          <div className="budget-list">
            {budgets.slice(0, 4).map((budget) => {
              const spent = monthItems.filter((item) => item.type === "expense" && item.category === budget.category).reduce((sum, item) => sum + item.amount, 0);
              const percent = Math.min((spent / budget.limit) * 100, 100);
              return <div className="budget-item" key={budget.category}><div><span><i style={{ background: palette[budget.category] }} />{categoryLabels[budget.category]?.[language] ?? budget.category}</span><strong>{formatMoney(spent, language)} <small>/ {formatMoney(budget.limit, language)}</small></strong></div><Progress value={percent} className={spent > budget.limit ? "over" : ""} /></div>;
            })}
          </div>
        </article>
      </section>

      <section className="surface-card recent-card">
        <div className="card-heading"><div><p className="eyebrow">{t("ledgerEyebrow")}</p><h2>{t("recentActivity")}</h2><span>{t("recentActivityHint")}</span></div><a href="/transactions" className="text-link">{t("viewAll")}<ChevronRight /></a></div>
        <div className="recent-grid">
          {recent.map((item) => <div className="recent-item" key={item.id}><span className={`transaction-icon ${item.type}`}>{item.type === "income" ? <ArrowDown /> : <ReceiptText />}</span><span className="recent-copy"><strong>{item.title}</strong><small>{categoryLabels[item.category]?.[language] ?? item.category} · {formatDate(item.date, language)}</small></span><strong className={item.type}>{item.type === "expense" ? "−" : "+"}{formatMoney(item.amount, language)}</strong></div>)}
          <button className="quick-add" onClick={onAdd}><span><Plus /></span><strong>{t("addTransaction")}</strong><small>{t("keepPlanCurrent")}</small></button>
        </div>
        <div className="coach-note"><Sparkles aria-hidden="true" /><p><strong>{monthSummary.savingsRate >= 20 ? t("strongBuffer") : t("adjustmentHint")}</strong><span>{monthSummary.savingsRate >= 20 ? `${t("keptIncomePrefix")} ${Math.round(monthSummary.savingsRate)}${t("keptIncomeSuffix")}` : t("reviewTopCategory")}</span></p></div>
      </section>
    </div>
  );
}
