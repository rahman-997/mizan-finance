"use client";
import { useRef, useState } from "react";
import { Upload, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { parseBackup } from "@/lib/finance-backup.mjs";
import { useFinance } from "./finance-provider";
import { useLocale } from "./locale-provider";
import type { FinanceData } from "./types";
export function DataTools(){
 const finance=useFinance();const {language}=useLocale();const ar=language==="ar";
 const file=useRef<HTMLInputElement>(null);const [pending,setPending]=useState<FinanceData|null>(null);const [error,setError]=useState("");const [monthly,setMonthly]=useState(false);const [add,setAdd]=useState(false);
 const read=async(f?:File)=>{setError("");if(!f)return;try{if(f.size>5*1024*1024)throw Error();setPending(parseBackup(JSON.parse(await f.text())));}catch{setError(ar?"الملف غير صالح أو حجمه أكبر من 5 ميغابايت. بياناتك لم تتغير.":"Invalid backup or file over 5 MB. Your data has not changed.");}};
 return <>
 <input ref={file} type="file" accept=".json,application/json" hidden onChange={e=>{void read(e.target.files?.[0]);e.target.value="";}}/>
 <Button variant="ghost" size="icon" aria-label={ar?"استعادة نسخة احتياطية":"Restore backup"} title={ar?"استعادة نسخة احتياطية":"Restore backup"} onClick={()=>file.current?.click()}><Upload/></Button>
 <Button variant="ghost" size="icon" aria-label={ar?"المصاريف الشهرية":"Monthly expenses"} title={ar?"المصاريف الشهرية":"Monthly expenses"} onClick={()=>setMonthly(true)}><Repeat2/></Button>
 {error&&!pending&&<p role="alert" className="text-sm">{error}</p>}
 <Dialog open={Boolean(pending)} onOpenChange={open=>{if(!open)setPending(null);}}><DialogContent className="max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>{ar?"استعادة البيانات؟":"Restore this backup?"}</DialogTitle><DialogDescription>{ar?"ستستبدل بيانات هذا المتصفح. صدّر نسخة من بياناتك الحالية أولاً إذا بدك تحتفظ فيها.":"This replaces the data in this browser. Export your current data first if you want to keep it."}</DialogDescription></DialogHeader><p>{pending?.transactions.length} {ar?"عملية":"transactions"} · {pending?.budgets.length} {ar?"ميزانية":"budgets"} · {pending?.recurring?.length || 0} {ar?"قاعدة شهرية":"monthly rules"} · {pending?.goals?.length || 0} {ar?"هدف ادخار":"savings goals"}</p><p className="text-sm text-muted-foreground">{ar?"ستُضاف أيضاً السجلات الشهرية المستحقة حتى اليوم عند الاستعادة.":"Monthly entries due through today will also be generated on restore."}</p>{error&&<p role="alert" className="form-error">{error}</p>}<DialogFooter><Button variant="outline" onClick={()=>setPending(null)}>{ar?"إلغاء":"Cancel"}</Button><Button onClick={()=>{try{finance.restoreBackup(pending);setPending(null);setError("");}catch(cause){const conflict=cause instanceof Error&&cause.message==="EXTERNAL_CHANGE";setError(conflict?(ar?"البيانات تغيّرت في تبويب آخر. صدّر نسختك إذا لزم، ثم حمّل أحدث السجلات قبل الاستعادة.":"Financial data changed in another tab. Export this tab if needed, then load the latest records before restoring."):(ar?"تعذر الحفظ. بياناتك الحالية لم تتغير.":"Could not save. Your current data has not changed."));}}}>{ar?"استبدال واستعادة":"Replace and restore"}</Button></DialogFooter></DialogContent></Dialog>
 <Dialog open={monthly} onOpenChange={setMonthly}><DialogContent className="max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>{ar?"المصاريف الشهرية":"Monthly expenses"}</DialogTitle><DialogDescription>{ar?"تُضاف الدفعات المستحقة عند فتح التطبيق. هذه سجلات محلية، ولا تُرسل أي دفعة مالية. التكرار يستخدم يوم بداية المصروف أو آخر يوم بالشهر الأقصر.":"Due entries are recorded when you open the app. No money is transferred. Recurrence uses the original day or the last day of a shorter month."}</DialogDescription></DialogHeader><div className="max-h-72 overflow-auto space-y-3">{(finance.recurring||[]).map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 break-words"><strong>{r.draft.title}</strong><p>{r.draft.amount} · {r.nextDate}</p></div><Button variant="outline" onClick={()=>finance.removeMonthlyExpense(r.id)}>{ar?"إيقاف التكرار":"Stop repeating"}</Button></div>)}{!finance.recurring?.length&&<p>{ar?"لا يوجد مصاريف متكررة.":"No recurring expenses yet."}</p>}</div><Button onClick={()=>{setMonthly(false);setAdd(true);}}>{ar?"إضافة مصروف شهري":"Add monthly expense"}</Button></DialogContent></Dialog>
 <TransactionForm open={add} onOpenChange={setAdd} expenseOnly onSubmit={draft=>{finance.addMonthlyExpense(draft);setMonthly(true);}}/>
 </>;
}
