"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, FileBarChart2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatMoney } from "@/features/finance/format";
import { reportMonths, reportCsv } from "@/lib/monthly-report.mjs";
import { localDate } from "@/lib/finance-backup.mjs";

export function ReportsView() {
  const { transactions } = useFinance();
  const { language } = useLocale();
  const ar = language === "ar";
  const [range, setRange] = useState<6 | 12>(6);
  const rows = useMemo(() => reportMonths(transactions, range, localDate()), [transactions, range]);
  const income = rows.reduce((total, row) => total + row.income, 0);
  const expenses = rows.reduce((total, row) => total + row.expenses, 0);
  const net = income - expenses;
  const maximum = Math.max(1, ...rows.flatMap(row => [row.income, row.expenses]));
  const c = ar
    ? { heading: "ملخص الأشهر", subtitle: "بيانات فعلية من معاملاتك المسجلة، بدون توقعات.", income: "إجمالي الدخل", expenses: "إجمالي المصروفات", net: "الصافي", month: "الشهر", empty: "لا توجد معاملات مسجلة بهذه الفترة.", export: "تصدير CSV", chart: "مقارنة الدخل والمصروفات الشهرية", incomeLabel: "دخل", expenseLabel: "مصروف", table: "تفاصيل الأشهر", reminder: "التقرير يلخص ما سجّلته يدوياً ولا يشمل تحركات حسابات بنكية.", past: "آخر", months: "أشهر" }
    : { heading: "Your monthly story", subtitle: "Actual records from your transactions. No predictions.", income: "Total income", expenses: "Total expenses", net: "Net cash flow", month: "Month", empty: "No recorded activity in this period.", export: "Export CSV", chart: "Monthly income versus spending", incomeLabel: "Income", expenseLabel: "Spending", table: "Monthly details", reminder: "Reports summarize manually recorded entries, not bank account movements.", past: "Last", months: "months" };
  const labelMonth = (key: string) => new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { month: "short", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));
  const download = () => {
    const blob = new Blob([reportCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mizan-report-${range}-months.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="mx-auto grid max-w-7xl gap-5" aria-label={ar ? "التقارير المالية" : "Financial reports"}>
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
        <div className="space-y-2"><div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><FileBarChart2 className="h-4 w-4"/>{ar ? "التقرير المالي" : "YOUR REPORT"}</div><h2 className="text-2xl font-bold tracking-tight">{c.heading}</h2><p className="text-sm text-muted-foreground">{c.subtitle}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-secondary/70 p-1" aria-label={ar ? "الفترة" : "Reporting period"}>
            {([6,12] as const).map(n => <Button key={n} size="sm" variant={range===n ? "default" : "ghost"} aria-pressed={range===n} onClick={() => setRange(n)}>{n} {c.months}</Button>)}
          </div>
          <Button variant="outline" onClick={download}><Download className="h-4 w-4"/>{c.export}</Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[{label:c.income, amount:income, icon:ArrowUpRight},{label:c.expenses,amount:expenses,icon:ArrowDownRight},{label:c.net,amount:net,icon:Scale}].map(({label,amount,icon:Icon}) =>
          <div key={label} className="surface-card min-w-0 p-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4"/>{label}</div><strong className="mt-3 block break-words text-xl font-bold tabular-nums" dir="ltr">{formatMoney(amount,language)}</strong></div>)}
      </div>
      <div className="surface-card p-5 md:p-7">
        <h3 className="text-lg font-semibold">{c.chart}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{c.past} {range} {c.months}</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-indigo-500" aria-hidden="true"/>{c.incomeLabel}</span><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true"/>{c.expenseLabel}</span></div>
        {income === 0 && expenses === 0 && <p className="py-5 text-sm text-muted-foreground">{c.empty}</p>}
        <div className="mt-6 grid gap-4">
          {rows.map(row => <div key={row.key} className="grid min-w-0 gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
            <span className="text-sm font-medium">{labelMonth(row.key)}</span>
            <div className="grid min-w-0 gap-1.5" role="img" aria-label={`${labelMonth(row.key)}: ${c.incomeLabel} ${formatMoney(row.income,language)}, ${c.expenseLabel} ${formatMoney(row.expenses,language)}`}>
              <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-indigo-500" style={{width:`${row.income/maximum*100}%`}} /></div>
              <div className="h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-amber-500" style={{width:`${row.expenses/maximum*100}%`}} /></div>
            </div>
          </div>)}
        </div>
      </div>
      <div className="surface-card overflow-hidden p-5 md:p-7">
        <h3 className="mb-4 text-lg font-semibold">{c.table}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-start text-sm">
            <thead><tr className="border-b border-border text-muted-foreground">
              <th className="py-3 text-start font-semibold" scope="col">{c.month}</th>
              <th className="py-3 text-end font-semibold" scope="col">{c.incomeLabel}</th>
              <th className="py-3 text-end font-semibold" scope="col">{c.expenseLabel}</th>
              <th className="py-3 text-end font-semibold" scope="col">{c.net}</th>
            </tr></thead>
            <tbody>{[...rows].reverse().map(row=><tr key={row.key} className="border-b border-border/70 last:border-0">
              <th className="py-3 text-start font-medium" scope="row">{labelMonth(row.key)}</th>
              <td className="py-3 text-end tabular-nums">{formatMoney(row.income,language)}</td>
              <td className="py-3 text-end tabular-nums">{formatMoney(row.expenses,language)}</td>
              <td className="py-3 text-end font-medium tabular-nums">{formatMoney(row.net,language)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <p className="px-2 text-sm text-muted-foreground">{c.reminder}</p>
    </section>
  );
}
