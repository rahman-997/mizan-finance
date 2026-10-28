"use client";

import { useMemo, useState } from "react";
import { Calculator, RotateCcw, TrendingUp, TrendingDown, Info, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatMoney } from "@/features/finance/format";
import { localDate } from "@/lib/finance-backup.mjs";
import { actualMonth, planScenario } from "@/lib/finance-planner.mjs";

export function PlannerView() {
  const {transactions}=useFinance();
  const {language}=useLocale();
  const ar=language==="ar";
  const [incomeChange,setIncomeChange]=useState("0");
  const [expenseChange,setExpenseChange]=useState("0");
  const month=localDate().slice(0,7);
  const baseline=useMemo(()=>actualMonth(transactions,month),[transactions,month]);
  const inputValid=(s:string)=>s.trim()!==""&&Number.isFinite(Number(s))&&Math.abs(Number(s))<=1_000_000;
  let result:ReturnType<typeof planScenario>|null=null;
  if(inputValid(incomeChange)&&inputValid(expenseChange)){
    try {result=planScenario(baseline,{incomeChange:Number(incomeChange),expenseChange:Number(expenseChange)});}
    catch {result=null;}
  }
  const c=ar?{
    title:"جرّب خطتك للشهر",intro:"غيّر مبالغ افتراضية وشوف كيف ممكن يتغيّر صافي الشهر، بدون تعديل أي سجل.",
    income:"الدخل المسجّل",expenses:"المصروفات المسجّلة",baseline:"الصافي المسجّل",
    incomeChange:"تغيير الدخل الافتراضي (دولار)",expenseChange:"تغيير المصروف الافتراضي (دولار)",
    projectedIncome:"الدخل في السيناريو",projectedExpenses:"المصروفات في السيناريو",projectedNet:"الصافي الافتراضي",
    difference:"الفرق عن المسجّل",reset:"إعادة الضبط",invalid:"اكتب مبالغ صالحة. القيمة الناتجة لا يمكن أن تكون سالبة، والزيادة أو التخفيض ضمن مليون دولار.",
    hint:"استخدم علامة سالب لتجربة تخفيض. مثلاً −50 للمصروفات يعني مصروفات أقل بـ50 دولار.",
    disclaimer:"هذا مجرد حساب افتراضي مبني على المعاملات المسجّلة هذا الشهر. ما بيغيّر رصيدك أو ميزانياتك، وما بيضمن نتيجة مستقبلية.",
    month:"هذا الشهر",sample:"مثال: زيادة الدخل أو تخفيض مصروفاتك"
  }:{
    title:"What-if month planner",intro:"Try hypothetical changes to see how the month's net amount might change, without editing your records.",
    income:"Recorded income",expenses:"Recorded expenses",baseline:"Recorded net",
    incomeChange:"Hypothetical income change (USD)",expenseChange:"Hypothetical spending change (USD)",
    projectedIncome:"Scenario income",projectedExpenses:"Scenario spending",projectedNet:"Scenario net",
    difference:"Difference from recorded",reset:"Reset scenario",invalid:"Enter valid amounts. Resulting totals cannot be negative; adjustments must be within one million dollars.",
    hint:"Use a minus sign to test a reduction. For example, −50 in spending means 50 dollars less.",
    disclaimer:"This is a hypothetical calculation from this month's recorded transactions. It does not change your balance or budgets and is not a prediction.",
    month:"Current month",sample:"Try extra income or lower spending"
  };
  const money=(n:number)=>formatMoney(n,language);
  return <section className="mx-auto grid max-w-7xl gap-5" aria-label={c.title}>
    <div className="surface-card p-5 md:p-7">
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><Calculator className="h-4 w-4" aria-hidden="true"/>{c.month.toUpperCase()}</div>
      <h2 className="text-2xl font-bold">{c.title}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.intro}</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {[{label:c.income,value:baseline.income,icon:TrendingUp},{label:c.expenses,value:baseline.expenses,icon:TrendingDown},{label:c.baseline,value:baseline.net,icon:ArrowLeftRight}].map(({label,value,icon:Icon})=>
        <article key={label} className="surface-card min-w-0 p-5"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true"/>{label}</span><strong className="mt-3 block break-words text-xl tabular-nums" dir="ltr">{money(value)}</strong></article>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="surface-card grid content-start gap-5 p-5 md:p-7">
        <div><h3 className="font-semibold">{c.sample}</h3><p className="mt-1 text-sm text-muted-foreground">{c.hint}</p></div>
        <div className="grid gap-2"><Label htmlFor="planner-income">{c.incomeChange}</Label><Input id="planner-income" type="number" inputMode="decimal" step="0.01" value={incomeChange} onChange={e=>setIncomeChange(e.target.value)}/></div>
        <div className="grid gap-2"><Label htmlFor="planner-expenses">{c.expenseChange}</Label><Input id="planner-expenses" type="number" inputMode="decimal" step="0.01" value={expenseChange} onChange={e=>setExpenseChange(e.target.value)}/></div>
        {!result&&<p className="form-error" role="alert">{c.invalid}</p>}
        <Button className="justify-self-start" variant="outline" onClick={()=>{setIncomeChange("0");setExpenseChange("0");}}><RotateCcw className="h-4 w-4"/>{c.reset}</Button>
      </div>
      <div className="surface-card grid content-start gap-5 p-5 md:p-7">
        <h3 className="text-lg font-semibold">{ar?"نتيجة السيناريو":"Your scenario"}</h3>
        {result&&<div className="grid gap-4" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{c.projectedIncome}</span><strong className="tabular-nums" dir="ltr">{money(result.income)}</strong></div>
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{c.projectedExpenses}</span><strong className="tabular-nums" dir="ltr">{money(result.expenses)}</strong></div>
          <div className="border-t border-border pt-4"><p className="text-sm text-muted-foreground">{c.projectedNet}</p><strong className="mt-2 block break-words text-3xl tabular-nums" dir="ltr">{money(result.net)}</strong></div>
          <div className="rounded-xl bg-secondary p-4"><p className="text-sm text-muted-foreground">{c.difference}</p><strong className="mt-1 block text-lg tabular-nums" dir="ltr">{result.difference>0?"+":""}{money(result.difference)}</strong></div>
        </div>}
      </div>
    </div>
    <p className="rounded-xl border border-border bg-secondary/70 p-4 text-sm text-muted-foreground"><Info className="me-2 inline h-4 w-4"/>{c.disclaimer}</p>
  </section>;
}
