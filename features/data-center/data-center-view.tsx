"use client";

import { useMemo } from "react";
import { Database, HardDrive, LockKeyhole, ShieldAlert, FileJson, CloudOff, Info } from "lucide-react";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { ExportDataButton } from "@/features/finance/export-data-button";
import { DataTools } from "@/features/finance/data-tools";

export function DataCenterView(){
  const finance=useFinance();
  const {language}=useLocale();
  const ar=language==="ar";
  const {transactions,budgets,recurring=[],goals=[],holdings=[],plans=[]}=finance;
  // A read-only UTF-8 estimate from React state; never read/write storage while rendering.
  const estimateBytes=useMemo(()=>new TextEncoder().encode(JSON.stringify({transactions,budgets,recurring,goals,holdings,plans})).length,[transactions,budgets,recurring,goals,holdings,plans]);
  const c=ar?{
    heading:"مركز البيانات والخصوصية",intro:"اعرف شو محفوظ بهالمتصفح، وخذ نسخة بيدك وقت ما بدك.",
    local:"بيانات على هذا الجهاز",storage:"حجم البيانات التقريبي بصيغة JSON",notYet:"غير متوفر",
    transactions:"المعاملات",budgets:"الميزانيات",recurring:"القواعد المتكررة",goals:"أهداف الادخار",holdings:"الأصول والالتزامات",plans:"المشتريات المخطّطة",
    backup:"نسخك الاحتياطية",backupInfo:"نزّل ملف JSON واحتفظ فيه بمكان آمن. عند استرجاع الملف، رح تراجع عدد السجلات وتؤكد الاستبدال قبل أي تغيير.",
    safety:"معلومات خصوصيتك",localNote:"السجلات تبقى داخل تخزين هذا المتصفح. ما في ربط بحسابات بنكية أو مزامنة سحابية ضمن هالتطبيق.",
    warning:"ملفات JSON غير مشفّرة وقد تحتوي تفاصيل مالية خاصة. لا ترسلها لأشخاص آخرين ولا تحفظها بمكان عام.",
    clearing:"حذف بيانات المتصفح أو تغيير الجهاز قد يفقدك سجلاتك إذا ما عندك نسخة احتياطية.",
    conflict:"انتباه: في تعديل من تبويب آخر. لا تسترجع نسخة قبل تحميل أحدث البيانات.",
    error:"تعذّر حفظ البيانات حالياً على هذا المتصفح. انسخ بياناتك احتياطياً قبل تعديل المزيد."
  }:{
    heading:"Privacy & data center",intro:"See what this browser stores and keep a backup under your control.",
    local:"Stored on this device",storage:"Approximate JSON record size",notYet:"Not available",
    transactions:"Transactions",budgets:"Budgets",recurring:"Recurring rules",goals:"Savings goals",holdings:"Assets and liabilities",plans:"Planned purchases",
    backup:"Your backup files",backupInfo:"Download a JSON copy and keep it somewhere safe. Before restoring, you can review record counts and confirm the replacement.",
    safety:"Your data privacy",localNote:"Records stay in this browser's local storage. There is no bank connection or built-in cloud sync.",
    warning:"JSON backup files are not encrypted and may contain private financial information. Do not share them or save them in public locations.",
    clearing:"Clearing browser data or switching devices may lose your records unless you have exported a backup.",
    conflict:"Another tab changed the data. Load the latest records before restoring a backup.",
    error:"Saving is currently unavailable in this browser. Make a backup before making further changes."
  };
  const stats=[
    {label:c.transactions,count:transactions.length},{label:c.budgets,count:budgets.length},
    {label:c.recurring,count:recurring.length},{label:c.goals,count:goals.length},
    {label:c.holdings,count:holdings.length},{label:c.plans,count:plans.length}
  ];
  return <section className="mx-auto grid max-w-7xl gap-5" aria-label={c.heading}>
    <div className="surface-card p-5 md:p-7"><div className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><Database className="h-4 w-4" aria-hidden="true"/>{ar?"خصوصيتك":"LOCAL DATA"}</div>
      <h2 className="text-2xl font-bold">{c.heading}</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.intro}</p></div>
    {finance.storageConflict&&<p role="alert" className="rounded-xl border border-amber-500/50 p-4 text-sm">{c.conflict}</p>}
    {finance.storageError&&<p role="alert" className="rounded-xl border border-amber-500/50 p-4 text-sm">{c.error}</p>}
    <div className="surface-card p-5 md:p-7">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><HardDrive className="h-5 w-5" aria-hidden="true"/>{c.local}</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {stats.map(s=><div key={s.label} className="rounded-xl bg-secondary/65 p-4">
          <p className="text-sm text-muted-foreground">{s.label}</p><strong className="mt-1 block text-2xl tabular-nums">{s.count}</strong>
        </div>)}
      </div>
      <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><FileJson className="h-4 w-4" aria-hidden="true"/>{c.storage}: <strong className="tabular-nums text-foreground">{finance.storageError?c.notYet:`${new Intl.NumberFormat(ar?"ar":"en").format(estimateBytes)} bytes`}</strong></p>
    </div>
    <div className="surface-card p-5 md:p-7">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><LockKeyhole className="h-5 w-5" aria-hidden="true"/>{c.backup}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{c.backupInfo}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2"><ExportDataButton showLabel/><DataTools restoreOnly/></div>
    </div>
    <div className="surface-card grid gap-4 p-5 md:p-7">
      <h3 className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5" aria-hidden="true"/>{c.safety}</h3>
      <p className="flex gap-3 text-sm text-muted-foreground"><CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>{c.localNote}</p>
      <p className="flex gap-3 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>{c.warning}</p>
      <p className="flex gap-3 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"/>{c.clearing}</p>
    </div>
  </section>;
}
