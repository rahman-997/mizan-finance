"use client";

import { useState } from "react";
import { CalendarClock, CreditCard, CirclePlus, Trash2, Info, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatDate, formatMoney, categoryLabels } from "@/features/finance/format";

export function RecurringView() {
  const finance = useFinance();
  const {language} = useLocale();
  const ar = language === "ar";
  const [formOpen,setFormOpen] = useState(false);
  const [stopId,setStopId] = useState<string|null>(null);
  const [error,setError] = useState("");
  const recurring = finance.recurring || [];
  const selected = recurring.find(x=>x.id===stopId);
  const monthlyTotal = recurring.reduce((s,r)=>s+r.draft.amount,0);
  const c = ar
    ? {add:"إضافة مصروف متكرر",heading:"التزاماتك الشهرية",monthly:"المجموع الشهري المجدول",rules:"القواعد النشطة",next:"الموعد القادم",day:"يتكرر يوم",stop:"إيقاف التكرار",confirm:"إيقاف هذا المصروف الشهري؟",confirmHint:"ستبقى المعاملات المسجلة سابقاً محفوظة. لن يُضاف المزيد من هذا المصروف تلقائياً.",yes:"تأكيد الإيقاف",cancel:"إلغاء",empty:"ما عندك مصروفات متكررة بعد.",notice:"قواعد التكرار تُسجّل مصروفات في دفتر التطبيق عندما يحين موعدها ويُفتح التطبيق. لا تدفع أي فاتورة ولا تسحب أموالاً من البنك.",error:"تغيّرت البيانات في تبويب آخر. حمّل أحدث السجلات أولاً.",count:"قاعدة"}
    : {add:"Add recurring expense",heading:"Your monthly commitments",monthly:"Scheduled monthly total",rules:"Active rules",next:"Next entry",day:"Repeats on day",stop:"Stop recurring",confirm:"Stop this monthly expense?",confirmHint:"Past recorded transactions remain. No more entries will be created from this rule.",yes:"Confirm stop",cancel:"Cancel",empty:"No recurring expenses yet.",notice:"Recurring rules record an expense in your local ledger when due and you open the app. They do not pay bills or transfer bank funds.",error:"Financial data changed in another tab. Load the latest records first.",count:"rules"};
  const stop = () => {
    if(!stopId) return;
    try { finance.removeMonthlyExpense(stopId);setStopId(null);setError(""); }
    catch { setError(c.error); }
  };
  return <section className="mx-auto grid max-w-7xl gap-5" aria-label={c.heading}>
    <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
      <div><div className="mb-3 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><CalendarClock size={17}/>{ar?"خطتك المتكررة":"RECURRING PLAN"}</div><h2 className="text-2xl font-bold">{c.heading}</h2></div>
      <Button onClick={()=>setFormOpen(true)} disabled={finance.storageConflict || recurring.length>=100}><CirclePlus size={18}/>{c.add}</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.monthly}</p><strong className="mt-2 block text-2xl tabular-nums" dir="ltr">{formatMoney(monthlyTotal,language)}</strong></div>
      <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.rules}</p><strong className="mt-2 block text-2xl tabular-nums">{recurring.length} {c.count}</strong></div>
    </div>
    <div className="rounded-xl border border-border bg-secondary/70 p-4 text-sm text-muted-foreground"><Info size={17} className="me-2 inline-block"/>{c.notice}</div>
    {recurring.length===0 && <div className="surface-card p-8 text-center text-muted-foreground">{c.empty}</div>}
    <div className="grid gap-4 md:grid-cols-2">
      {[...recurring].sort((a,b)=>a.nextDate.localeCompare(b.nextDate)).map(rule=>
        <article className="surface-card min-w-0 p-5" key={rule.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><div className="mb-3 inline-flex rounded-xl bg-secondary p-2"><CreditCard className="h-5 w-5" aria-hidden="true"/></div><h3 className="break-words text-lg font-bold">{rule.draft.title}</h3><p className="mt-1 text-sm text-muted-foreground">{categoryLabels[rule.draft.category]?.[language] || rule.draft.category}</p></div>
            <strong dir="ltr" className="shrink-0 text-lg tabular-nums">{formatMoney(rule.draft.amount,language)}</strong>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground"><span>{c.next}: <strong className="text-foreground">{formatDate(rule.nextDate,language)}</strong></span><span>{c.day} {rule.day}</span></div>
          <Button variant="outline" className="mt-5" disabled={finance.storageConflict} onClick={()=>{setError("");setStopId(rule.id);}} aria-label={`${c.stop}: ${rule.draft.title}`}><Trash2 size={16}/>{c.stop}</Button>
        </article>)}
    </div>
    <TransactionForm expenseOnly open={formOpen} onOpenChange={setFormOpen} onSubmit={finance.addMonthlyExpense}/>
    <Dialog open={Boolean(stopId)} onOpenChange={open=>{if(!open)setStopId(null);}}>
      <DialogContent><DialogHeader><DialogTitle>{c.confirm}</DialogTitle><DialogDescription>{selected?.draft.title}. {c.confirmHint}</DialogDescription></DialogHeader>
      {error && <p role="alert" className="form-error"><ShieldAlert className="me-2 inline h-4 w-4"/>{error}</p>}
      <DialogFooter><Button variant="outline" onClick={()=>setStopId(null)}>{c.cancel}</Button><Button variant="destructive" onClick={stop}>{c.yes}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
