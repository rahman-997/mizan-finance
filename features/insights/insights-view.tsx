"use client";

import { ArrowDownRight, ArrowUpRight, Lightbulb, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFinance } from "@/features/finance/finance-provider";
import { categoryLabels, formatMoney } from "@/features/finance/format";
import { useLocale } from "@/features/finance/locale-provider";
import { calculateSummary, currentMonthTransactions, monthlySeries, spendingByCategory } from "@/lib/finance-utils.mjs";

const colors = ["#5d5fef", "#ef8f2f", "#22a98a", "#dd5b74", "#3c8be8", "#9874dc"];

export function InsightsView() {
  const { transactions } = useFinance();
  const { language, t } = useLocale();
  const current = currentMonthTransactions(transactions);
  const summary = calculateSummary(current);
  const categories = spendingByCategory(current);
  const series = monthlySeries(transactions);
  const top = categories[0];
  const previous = series.at(-2) ?? { expenses: 0 };
  const change = previous.expenses ? ((summary.expenses - previous.expenses) / previous.expenses) * 100 : 0;
  const healthy = summary.balance >= 0;

  return (
    <div className="insights-page">
      <section className={healthy ? "insight-banner healthy" : "insight-banner warning"}>
        <span><Lightbulb /></span><div><p className="eyebrow">{t("monthlyRead")}</p><h2>{healthy ? t("healthy") : t("attention")}</h2><p>{healthy ? t("healthyText") : t("attentionText")}</p></div>
      </section>

      <section className="insight-stats" aria-label={t("keyInsights")}>
        <article className="surface-card"><p>{t("topSpendingCategory")}</p><strong>{top ? categoryLabels[top.category]?.[language] ?? top.category : "—"}</strong><span>{top ? formatMoney(top.amount, language) : t("noSpendingYet")}</span></article>
        <article className="surface-card"><p>{t("expenseChange")}</p><strong className={change > 0 ? "expense" : "income"}>{change > 0 ? <ArrowUpRight /> : <ArrowDownRight />}{Math.abs(Math.round(change))}%</strong><span>{t("comparedLastMonth")}</span></article>
        <article className="surface-card"><p>{t("netThisMonth")}</p><strong className={summary.balance >= 0 ? "income" : "expense"}>{formatMoney(summary.balance, language)}</strong><span>{t("incomeMinusExpenses")}</span></article>
      </section>

      <section className="insight-grid">
        <article className="surface-card chart-card">
          <div className="card-heading"><div><p className="eyebrow">{t("mix")}</p><h2>{t("categoryBreakdown")}</h2><span>{t("categoryBreakdownHint")}</span></div></div>
          {categories.length ? <div className="donut-layout"><div className="donut-chart" aria-label={t("pieChartAria")}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="amount" nameKey="category" innerRadius="58%" outerRadius="82%" paddingAngle={3}>{categories.map((item, index) => <Cell key={item.category} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(Number(value), language)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} /></PieChart></ResponsiveContainer><div><strong>{formatMoney(summary.expenses, language)}</strong><span>{t("totalSpent")}</span></div></div><div className="donut-legend">{categories.map((item, index) => <div key={item.category}><span><i style={{ background: colors[index % colors.length] }} />{categoryLabels[item.category]?.[language] ?? item.category}</span><strong>{formatMoney(item.amount, language)}</strong></div>)}</div></div> : <p className="chart-empty">{t("addExpenseHint")}</p>}
        </article>

        <article className="surface-card chart-card">
          <div className="card-heading"><div><p className="eyebrow">{t("momentum")}</p><h2>{t("trend")}</h2><span>{t("trendHint")}</span></div><TrendingUp /></div>
          <div className="bar-chart" aria-label={t("barChartAria")}><ResponsiveContainer width="100%" height="100%"><BarChart data={series} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-line)" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><Tooltip formatter={(value) => formatMoney(Number(value), language)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} /><Bar dataKey="income" fill="#5d5fef" radius={[6, 6, 0, 0]} /><Bar dataKey="expenses" fill="#ef8f2f" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </article>
      </section>
    </div>
  );
}
