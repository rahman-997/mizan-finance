"use client";

import { useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, ChevronRight, Eye, EyeOff,
  Lightbulb, PiggyBank, ReceiptText, ShieldCheck, WalletCards,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useFinance } from "@/features/finance/finance-provider";
import { categoryLabels, formatDate, formatMoney } from "@/features/finance/format";
import { useLocale } from "@/features/finance/locale-provider";
import {
  calculateSummary, currentMonthTransactions,
  monthlySeries, spendingByCategory,
} from "@/lib/finance-utils.mjs";
import "./dashboard-v16.css";

const categoryColors: Record<string, string> = {
  Housing: "#4264ed",
  Food: "#5bc6a9",
  Transport: "#f4a967",
  Health: "#d781c0",
  Learning: "#9a82e8",
  Leisure: "#e8c86b",
  Other: "#8998b6",
};

const bilingual = {
  ar: {
    overview: "مؤشرات مالية مباشرة من سجلاتك",
    balanceNote: "صافي الدخل والمصروفات المسجّلة",
    allTime: "عبر جميع الفترات",
    rateNote: "من دخل هذا الشهر",
    incomeNote: "إجمالي الدخل الشهري",
    expensesNote: "إجمالي الإنفاق الشهري",
    flowSubtitle: "قارن الدخل والمصروفات خلال الفترة المحددة",
    lastSix: "6 أشهر",
    lastTwelve: "12 شهراً",
    privacyShow: "إظهار المبالغ",
    privacyHide: "إخفاء المبالغ",
    privacyPlaceholder: "المبالغ مخفية لحماية خصوصيتك",
    distribution: "توزيع المصروفات",
    distributionSubtitle: "حسب فئات الشهر الحالي",
    noSpend: "لا يوجد إنفاق مسجل",
    other: "أخرى",
    thisMonth: "هذا الشهر",
    budgetsSubtitle: "استخدام حدود الإنفاق لهذا الشهر",
    budgetsEmpty: "لم تُضف ميزانيات بعد.",
    budgetOver: "تجاوز الحد",
    budgetTip: "يعتمد الإنفاق المعروض على المعاملات المسجّلة فقط.",
    recentSubtitle: "آخر الحركات المسجّلة في حسابك",
    noActivity: "لا توجد معاملات مسجّلة بعد.",
    percentOfIncome: "نسبة الادخار",
    trend: "تدفق الأموال",
  },
  en: {
    overview: "Live insights from your recorded activity",
    balanceNote: "Net income minus recorded expenses",
    allTime: "Across all activity",
    rateNote: "Of this month's income",
    incomeNote: "Total monthly income",
    expensesNote: "Total monthly expenses",
    flowSubtitle: "Compare income and expenses over time",
    lastSix: "6 months",
    lastTwelve: "12 months",
    privacyShow: "Reveal amounts",
    privacyHide: "Hide amounts",
    privacyPlaceholder: "Amounts are hidden for privacy",
    distribution: "Expense distribution",
    distributionSubtitle: "By category this month",
    noSpend: "No expenses recorded",
    other: "Other",
    thisMonth: "This month",
    budgetsSubtitle: "Progress toward this month's limits",
    budgetsEmpty: "No budgets have been set.",
    budgetOver: "Over budget",
    budgetTip: "Spending figures reflect recorded transactions only.",
    recentSubtitle: "Your latest recorded transactions",
    noActivity: "No transactions recorded yet.",
    percentOfIncome: "Savings rate",
    trend: "Money movement",
  },
} as const;

export function DashboardView({ onAdd }: { onAdd: () => void }) {
  const { transactions, budgets } = useFinance();
  const { language, t } = useLocale();
  const c = bilingual[language];
  const [months, setMonths] = useState<6 | 12>(6);
  const [privateMode, setPrivateMode] = useState(false);

  const monthItems = currentMonthTransactions(transactions);
  const monthSummary = calculateSummary(monthItems);
  const totalSummary = calculateSummary(transactions);
  // Use Gregorian month names in the selected UI language. Keep the existing financial totals unchanged.
  const monthFormatter = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", { month: "short", calendar: "gregory" });
  const chartData = monthlySeries(transactions, months).map((point, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (months - 1 - index));
    return { ...point, month: monthFormatter.format(date) };
  });
  const spend = spendingByCategory(monthItems);
  const otherAmount = spend.slice(4).reduce((total, item) => total + item.amount, 0);
  const distribution = spend.slice(0, 4).concat(otherAmount > 0 ? [{ category: "Other", amount: otherAmount }] : []);
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const money = (amount: number) => privateMode ? "••••••" : formatMoney(amount, language);
  const savings = Math.round(monthSummary.savingsRate);
  const visibleRate = privateMode ? "••%" : String(savings) + "%";

  const statistics = [
    { label: t("income"), value: money(monthSummary.income), tone: "green", icon: ArrowDownLeft, note: c.incomeNote },
    { label: t("expenses"), value: money(monthSummary.expenses), tone: "red", icon: ArrowUpRight, note: c.expensesNote },
    { label: c.percentOfIncome, value: visibleRate, tone: "violet", icon: PiggyBank, note: c.rateNote },
  ];

  return (
    <div className="dashboard-stack v16-dashboard">
      <div className="v16-toolbar">
        <p className="v16-eyebrow"><span className="v16-dot" aria-hidden="true" />{c.overview}</p>
        <div className="v16-actions">
          <div className="v16-segment" role="group" aria-label={c.trend}>
            <button type="button" onClick={() => setMonths(6)} aria-pressed={months === 6}>{c.lastSix}</button>
            <button type="button" onClick={() => setMonths(12)} aria-pressed={months === 12}>{c.lastTwelve}</button>
          </div>
          <button
            type="button" className="v16-eye"
            onClick={() => setPrivateMode(value => !value)}
            aria-label={privateMode ? c.privacyShow : c.privacyHide}
            aria-pressed={privateMode}
            title={privateMode ? c.privacyShow : c.privacyHide}
          >
            {privateMode ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
          </button>
        </div>
      </div>

      <section className="v16-metrics" aria-label={t("financialSummary")}>
        <article className="v16-main-card">
          <div className="v16-main-top">
            <span className="v16-main-label">{t("totalBalance")}</span>
            <WalletCards aria-hidden="true" />
          </div>
          <strong className="v16-main-balance" dir="ltr">{money(totalSummary.balance)}</strong>
          <div className="v16-main-foot">
            <span><ShieldCheck size={13} aria-hidden="true" />{c.allTime}</span>
            <span>{c.balanceNote}</span>
          </div>
        </article>
        {statistics.map(({ label, value, tone, icon: Icon, note }) => (
          <article className="v16-stat-card" key={label}>
            <div className={"v16-stat-icon " + tone}><Icon aria-hidden="true" /></div>
            <span className="v16-stat-label">{label}</span>
            <strong className="v16-stat-value" dir="ltr">{value}</strong>
            <span className="v16-stat-foot">{note}</span>
          </article>
        ))}
      </section>

      <section className="v16-analysis-grid">
        <article className="v16-panel" aria-label={t("monthlyFlow")}>
          <div className="v16-panel-head">
            <div><h2>{t("monthlyFlow")}</h2><p>{c.flowSubtitle}</p></div>
            <div className="v16-chart-legend">
              <span><i style={{ background: "#4264ed" }} />{t("income")}</span>
              <span><i style={{ background: "#eea578" }} />{t("expenses")}</span>
            </div>
          </div>
          {privateMode ? <div className="v16-center-mask">{c.privacyPlaceholder}</div> : (
            <div className="v16-plot" role="img" aria-label={t("monthlyFlow")}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="v16Income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4264ed" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#4264ed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="v16Expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#eea578" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#eea578" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--grid-line)" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="month" interval={months === 12 ? 2 : 0} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }}
                    formatter={(value) => formatMoney(Number(value), language)}
                  />
                  <Area type="monotone" name={t("income")} dataKey="income" stroke="#4264ed" strokeWidth={2.8} fill="url(#v16Income)" />
                  <Area type="monotone" name={t("expenses")} dataKey="expenses" stroke="#eea578" strokeWidth={2.8} fill="url(#v16Expenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="v16-panel" aria-label={c.distribution}>
          <div className="v16-panel-head">
            <div><h2>{c.distribution}</h2><p>{c.distributionSubtitle}</p></div>
          </div>
          {privateMode ? <div className="v16-center-mask">{c.privacyPlaceholder}</div> : spend.length === 0 ? (
            <div className="v16-center-mask">{c.noSpend}</div>
          ) : (
            <div className="v16-spending-body">
              <div className="v16-ring">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="amount" nameKey="category" innerRadius={56} outerRadius={78} paddingAngle={2} stroke="none" isAnimationActive={false}>
                      {distribution.map((part) => (
                        <Cell key={part.category} fill={categoryColors[part.category] ?? categoryColors.Other} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="v16-ring-center">
                  <small>{c.thisMonth}</small>
                  <strong dir="ltr">{money(monthSummary.expenses)}</strong>
                </div>
              </div>
              <div className="v16-spend-list">
                {distribution.map((part) => (
                  <div className="v16-spend-item" key={part.category}>
                    <span className="v16-spend-item-label">
                      <i style={{ background: categoryColors[part.category] ?? categoryColors.Other }} />
                      {part.category === "Other" ? c.other : (categoryLabels[part.category]?.[language] ?? part.category)}
                    </span>
                    <strong dir="ltr">{Math.round(part.amount / monthSummary.expenses * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="v16-bottom-grid">
        <article className="v16-panel">
          <div className="v16-panel-head">
            <div><h2>{t("recentActivity")}</h2><p>{c.recentSubtitle}</p></div>
            <a className="v16-link" href="/transactions">{t("viewAll")}<ChevronRight aria-hidden="true" /></a>
          </div>
          {recent.length === 0 ? <div className="v16-budget-empty">{c.noActivity}</div> : (
            <div className="v16-list">
              {recent.map(item => (
                <div className="v16-row" key={item.id}>
                  <span className={"v16-row-icon " + item.type}>
                    {item.type === "income" ? <ArrowDownLeft aria-hidden="true" /> : <ReceiptText aria-hidden="true" />}
                  </span>
                  <span className="v16-row-copy">
                    <strong>{item.title}</strong>
                    <small>{categoryLabels[item.category]?.[language] ?? item.category} · {formatDate(item.date, language)}</small>
                  </span>
                  <strong className={"v16-row-amount " + item.type} dir="ltr">
                    {privateMode ? "••••••" : (item.type === "income" ? "+" : "−") + formatMoney(item.amount, language)}
                  </strong>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={onAdd} className="quick-add" style={{ marginTop: 12, width: "100%" }}>
            <span aria-hidden="true">+</span><strong>{t("addTransaction")}</strong><small>{t("keepPlanCurrent")}</small>
          </button>
        </article>

        <article className="v16-panel">
          <div className="v16-panel-head">
            <div><h2>{t("budgetPulse")}</h2><p>{c.budgetsSubtitle}</p></div>
            <a className="v16-link" href="/budgets">{t("viewAll")}<ChevronRight aria-hidden="true" /></a>
          </div>
          <div className="v16-budget-list">
            {budgets.length === 0 ? <div className="v16-budget-empty">{c.budgetsEmpty}</div> : (
              budgets.slice(0, 5).map(budget => {
                const spent = monthItems.filter(item => item.type === "expense" && item.category === budget.category)
                  .reduce((sum, item) => sum + item.amount, 0);
                const percent = budget.limit > 0 ? Math.round(spent / budget.limit * 100) : 0;
                return (
                  <div className="v16-budget-line" key={budget.category}>
                    <div className="v16-budget-line-top">
                      <span>{categoryLabels[budget.category]?.[language] ?? budget.category}</span>
                      <strong className={!privateMode && percent > 100 ? "v16-over" : ""} dir="ltr">
                        {privateMode ? "••••••" : formatMoney(spent, language) + " / " + formatMoney(budget.limit, language)}
                      </strong>
                    </div>
                    <div
                      className={"v16-track" + (!privateMode && percent > 100 ? " over" : "")}
                      role={privateMode ? "img" : "progressbar"}
                      aria-label={privateMode ? c.privacyPlaceholder : (categoryLabels[budget.category]?.[language] ?? budget.category)}
                      aria-valuemin={privateMode ? undefined : 0}
                      aria-valuemax={privateMode ? undefined : 100}
                      aria-valuenow={privateMode ? undefined : Math.min(Math.max(percent, 0), 100)}
                    >
                      <div style={{ width: (privateMode ? 0 : Math.min(Math.max(percent, 0), 100)) + "%" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="v16-budget-note"><Lightbulb aria-hidden="true" /><span>{c.budgetTip}</span></div>
        </article>
      </section>
    </div>
  );
}
