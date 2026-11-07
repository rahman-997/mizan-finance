"use client";

import { useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatMoney, formatDate } from "@/features/finance/format";
import { localDate } from "@/lib/finance-backup.mjs";
import { plansSummary } from "@/lib/finance-plans.mjs";
import type { PlannedPurchase } from "@/features/finance/types";

type Draft = {title:string;amount:string;targetDate:string};
const initial = (): Draft => ({title:"",amount:"",targetDate:localDate()});
export function PurchasesView(){
  const {plans=[],addPlan,editPlan,deletePlan,storageConflict}=useFinance();
  const {language}=useLocale();
  const ar=language==="ar";
  const c=ar?{
    heading:"مشترياتك المخطّطة",intro:"سجّل الأشياء التي تفكّر بشرائها ومتى تتمنى شراءها، بدون خصم أي مبلغ.",
    add:"إضافة مشتريات مخطّطة",edit:"تعديل الخطة",save:"حفظ الخطة",cancel:"إلغاء",remove:"حذف الخطة",confirm:"حذف هذه الخطة؟",
    confirmDescription:"هذا يحذف الخطة فقط، ولا يغيّر المعاملات أو ميزانيتك.",
    item:"اسم الشيء",amount:"التكلفة المقدّرة (دولار)",targetDate:"التاريخ المستهدف",count:"خطط محفوظة",sum:"إجمالي التكلفة المقدّرة",
    empty:"لا توجد مشتريات مخطّطة بعد. أضف فكرة لتتابعها لاحقاً.",note:"هذه خطط يدوية فقط، وليست فواتير أو مشتريات فعلية أو دفعات تلقائية. التقديرات لا تغيّر رصيدك.",
    invalid:"اكتب اسماً من 2 إلى 60 حرفاً، وتكلفة موجبة لا تتجاوز مليون، وتاريخاً صحيحاً.",
    conflict:"البيانات تغيّرت في تبويب آخر. حمّل أحدث السجلات قبل التعديل.",limit:"الحد الأقصى 30 خطة."
  }:{
    heading:"Planned purchases",intro:"Keep track of possible purchases and target dates without affecting your ledger.",
    add:"Add planned purchase",edit:"Edit plan",save:"Save plan",cancel:"Cancel",remove:"Delete plan",confirm:"Delete this plan?",
    confirmDescription:"Only this plan will be removed. Your transactions and budgets stay unchanged.",
    item:"Item name",amount:"Estimated cost (USD)",targetDate:"Target date",count:"Saved plans",sum:"Estimated total",
    empty:"No planned purchases yet. Add something you're considering.",
    note:"These are manual intentions, not bills, completed purchases or automatic payments. Estimated costs never change your balance.",
    invalid:"Enter a 2 to 60 character name, a positive amount up to one million, and a valid date.",
    conflict:"Another tab changed your data. Load the latest records before editing.",limit:"You can save up to 30 plans."
  };
  const [editing,setEditing]=useState<PlannedPurchase|"new"|null>(null);
  const [removing,setRemoving]=useState<PlannedPurchase|null>(null);
  const [draft,setDraft]=useState<Draft>(initial);
  const [error,setError]=useState("");
  const summary=plansSummary(plans);
  const open=(value:PlannedPurchase|"new")=>{setEditing(value);setError("");setDraft(value==="new"?initial():{title:value.title,amount:String(value.amount),targetDate:value.targetDate});};
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const title=draft.title.trim(),amount=Number(draft.amount);
    const targetDate=draft.targetDate;
    if(title.length<2||title.length>60||!draft.amount.trim()||!Number.isFinite(amount)||amount<=0||amount>1_000_000||!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)){
      setError(c.invalid);return;
    }
    try{
      if(editing==="new")addPlan({title,amount,targetDate});
      else if(editing)editPlan(editing.id,{title,amount,targetDate});
      setEditing(null);setError("");
    }catch(e){
      const message=e instanceof Error?e.message:"";
      setError(message==="EXTERNAL_CHANGE"?c.conflict:message==="PLAN_LIMIT"?c.limit:c.invalid);
    }
  };
  return <section className="mx-auto grid max-w-7xl gap-5" aria-label={c.heading}>
    <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
      <div><div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><ClipboardList size={17} aria-hidden="true"/>{ar?"قائمة خططك":"YOUR IDEAS"}</div><h2 className="text-2xl font-bold">{c.heading}</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{c.intro}</p></div>
      <Button onClick={()=>open("new")} disabled={storageConflict||plans.length>=30}><Plus className="h-4 w-4"/>{c.add}</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.count}</p><strong className="mt-2 block text-2xl tabular-nums">{summary.count}</strong></div>
      <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.sum}</p><strong className="mt-2 block text-2xl tabular-nums" dir="ltr">{formatMoney(summary.total,language)}</strong></div>
    </div>
    <p className="rounded-xl border border-border bg-secondary/70 p-4 text-sm text-muted-foreground"><Info className="me-2 inline h-4 w-4" aria-hidden="true"/>{c.note}</p>
    {!plans.length&&<p className="surface-card p-8 text-center text-muted-foreground">{c.empty}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {[...plans].sort((a,b)=>a.targetDate.localeCompare(b.targetDate)).map(item=><article key={item.id} className="surface-card min-w-0 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h3 className="break-words text-lg font-bold">{item.title}</h3><span className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" aria-hidden="true"/>{formatDate(item.targetDate,language)}</span></div>
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" aria-label={`${c.edit}: ${item.title}`} disabled={storageConflict} onClick={()=>open(item)}><Pencil size={17}/></Button>
            <Button size="icon" variant="ghost" aria-label={`${c.remove}: ${item.title}`} disabled={storageConflict} onClick={()=>setRemoving(item)}><Trash2 size={17}/></Button>
          </div>
        </div>
        <strong className="mt-4 block text-xl tabular-nums" dir="ltr">{formatMoney(item.amount,language)}</strong>
      </article>)}
    </div>
    <Dialog open={editing!==null} onOpenChange={o=>{if(!o)setEditing(null);}}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing==="new"?c.add:c.edit}</DialogTitle><DialogDescription>{c.note}</DialogDescription></DialogHeader>
        <form noValidate onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2"><Label htmlFor="plan-title">{c.item}</Label><Input id="plan-title" required maxLength={60} value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}/></div>
          <div className="grid gap-2"><Label htmlFor="plan-amount">{c.amount}</Label><Input id="plan-amount" type="number" inputMode="decimal" min="0.01" step="0.01" required value={draft.amount} onChange={e=>setDraft(v=>({...v,amount:e.target.value}))}/></div>
          <div className="grid gap-2"><Label htmlFor="plan-date">{c.targetDate}</Label><Input id="plan-date" type="date" required min="2000-01-01" max="2100-12-31" value={draft.targetDate} onChange={e=>setDraft(v=>({...v,targetDate:e.target.value}))}/></div>
          {error&&<p className="form-error" role="alert">{error}</p>}
          <DialogFooter><Button variant="outline" type="button" onClick={()=>setEditing(null)}>{c.cancel}</Button><Button type="submit">{c.save}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={removing!==null} onOpenChange={o=>{if(!o)setRemoving(null);}}>
      <DialogContent>
        <DialogHeader><DialogTitle>{c.confirm}</DialogTitle><DialogDescription>{c.confirmDescription}</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={()=>setRemoving(null)}>{c.cancel}</Button>
          <Button variant="destructive" onClick={()=>{if(!removing)return;try{deletePlan(removing.id);setRemoving(null);}catch{setRemoving(null);}}}>{c.remove}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
