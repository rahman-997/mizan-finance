"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Trash2, ShieldCheck, Wallet, Landmark, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatMoney } from "@/features/finance/format";
import { holdingsSummary } from "@/lib/finance-holdings.mjs";
import type { Holding } from "@/features/finance/types";

type Draft = { label:string; kind:"asset"|"liability"; value:string };
const blank: Draft = {label:"",kind:"asset",value:""};
export function HoldingsView() {
  const {holdings=[],addHolding,editHolding,removeHolding,storageConflict}=useFinance();
  const {language}=useLocale();
  const ar=language==="ar";
  const c=ar ? {
    title:"ممتلكاتك والتزاماتك", intro:"قائمة تقديرية تكتبها بنفسك، مستقلة عن دخل ومصروفات الدفتر.",
    new:"إضافة بند",edit:"تعديل البند",save:"حفظ البند",cancel:"إلغاء",name:"اسم البند",value:"القيمة التقديرية (دولار)",type:"نوع البند",
    asset:"أصل",liability:"التزام",assets:"مجموع الأصول",liabilities:"مجموع الالتزامات",net:"الصافي التقديري",
    empty:"لا توجد بنود بعد. أضف أصلاً أو التزاماً لتكوين صورة تقديرية.",note:"القيم تقديرية ومسجّلة يدوياً. لا يتم احتسابها في رصيد المعاملات ولا التحقق منها عبر بنك.",
    delete:"حذف البند",confirm:"حذف هذا البند؟",confirmInfo:"لن يُحذف أي مصروف أو دخل من سجل المعاملات.",
    error:"اسم البند من 2 إلى 60 حرفاً، والقيمة يجب أن تكون أكبر من صفر ولا تزيد عن مليون.",
    conflict:"تغيّرت البيانات في تبويب آخر. حمّل أحدث السجلات قبل التعديل.",limit:"الحد الأقصى 40 بنداً."
  } : {
    title:"Assets and liabilities",intro:"A manual estimate of what you own and owe, separate from your transaction ledger.",
    new:"Add item",edit:"Edit item",save:"Save item",cancel:"Cancel",name:"Item name",value:"Estimated value (USD)",type:"Item type",
    asset:"Asset",liability:"Liability",assets:"Total assets",liabilities:"Total liabilities",net:"Estimated net position",
    empty:"No items yet. Add an asset or liability to start a manual snapshot.",
    note:"Values are manually entered estimates, not verified balances. This section never changes your transaction balance or connects to a bank.",
    delete:"Delete item",confirm:"Delete this item?",confirmInfo:"Your recorded income and expense transactions will not be affected.",
    error:"Use 2 to 60 characters and a positive value no greater than one million.",
    conflict:"Data changed in another tab. Load the latest records before editing.",limit:"Up to 40 items are supported."
  };
  const [editing,setEditing]=useState<Holding|"new"|null>(null);
  const [removing,setRemoving]=useState<Holding|null>(null);
  const [draft,setDraft]=useState<Draft>(blank);
  const [error,setError]=useState("");
  const summary=holdingsSummary(holdings);
  const open=(item:Holding|"new")=>{setEditing(item);setError("");setDraft(item==="new"?blank:{label:item.label,kind:item.kind,value:String(item.value)});};
  const save=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const label=draft.label.trim(),value=Number(draft.value);
    if(label.length<2||label.length>60||!draft.value.trim()||!Number.isFinite(value)||value<=0||value>1_000_000){setError(c.error);return;}
    try {
      if(editing==="new") addHolding({label,kind:draft.kind,value});
      else if(editing)editHolding(editing.id,{label,kind:draft.kind,value});
      setEditing(null);setError("");
    }catch(e){const message=e instanceof Error?e.message:"";setError(message==="EXTERNAL_CHANGE"?c.conflict:message==="HOLDING_LIMIT"?c.limit:c.error);}
  };
  return <section className="mx-auto grid max-w-7xl gap-5" aria-label={c.title}>
    <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
      <div><div className="mb-2 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><Building2 className="h-4 w-4" aria-hidden="true"/>{ar?"سجل تقديري":"MANUAL REGISTER"}</div>
        <h2 className="text-2xl font-bold">{c.title}</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{c.intro}</p></div>
      <Button onClick={()=>open("new")} disabled={storageConflict||holdings.length>=40}><Plus size={18}/>{c.new}</Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {([{label:c.assets,value:summary.assets,icon:Wallet},{label:c.liabilities,value:summary.liabilities,icon:Landmark},{label:c.net,value:summary.net,icon:Scale}]).map(({label,value,icon:Icon})=>
        <article className="surface-card min-w-0 p-5" key={label}><div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" aria-hidden="true"/>{label}</div><strong className="mt-3 block break-words text-xl tabular-nums" dir="ltr">{formatMoney(value,language)}</strong></article>)}
    </div>
    <div className="rounded-xl border border-border bg-secondary/70 p-4 text-sm text-muted-foreground"><ShieldCheck size={18} className="me-2 inline-block"/>{c.note}</div>
    {holdings.length===0&&<p className="surface-card p-8 text-center text-muted-foreground">{c.empty}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {holdings.map(item=><article key={item.id} className="surface-card min-w-0 p-5">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0">
          <span className="text-xs font-semibold uppercase text-muted-foreground">{item.kind==="asset"?c.asset:c.liability}</span>
          <h3 className="mt-1 break-words text-lg font-bold">{item.label}</h3></div>
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" aria-label={`${c.edit}: ${item.label}`} disabled={storageConflict} onClick={()=>open(item)}><Pencil size={17}/></Button>
            <Button variant="ghost" size="icon" aria-label={`${c.delete}: ${item.label}`} disabled={storageConflict} onClick={()=>setRemoving(item)}><Trash2 size={17}/></Button>
          </div>
        </div>
        <strong className="mt-4 block text-xl tabular-nums" dir="ltr">{formatMoney(item.value,language)}</strong>
      </article>)}
    </div>
    <Dialog open={editing!==null} onOpenChange={open=>{if(!open)setEditing(null);}}>
      <DialogContent className="max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing==="new"?c.new:c.edit}</DialogTitle><DialogDescription>{c.note}</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={save} noValidate>
          <div className="grid gap-2"><Label htmlFor="holding-label">{c.name}</Label><Input id="holding-label" maxLength={60} required value={draft.label} onChange={e=>setDraft(s=>({...s,label:e.target.value}))}/></div>
          <div className="grid gap-2"><Label htmlFor="holding-kind">{c.type}</Label><select id="holding-kind" className="h-10 w-full rounded-md border border-input bg-background px-3" value={draft.kind} onChange={e=>setDraft(s=>({...s,kind:e.target.value as Draft["kind"]}))}><option value="asset">{c.asset}</option><option value="liability">{c.liability}</option></select></div>
          <div className="grid gap-2"><Label htmlFor="holding-value">{c.value}</Label><Input id="holding-value" type="number" min="0.01" step="0.01" inputMode="decimal" required value={draft.value} onChange={e=>setDraft(s=>({...s,value:e.target.value}))}/></div>
          {error&&<p role="alert" className="form-error">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={()=>setEditing(null)}>{c.cancel}</Button><Button type="submit">{c.save}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={removing!==null} onOpenChange={open=>{if(!open)setRemoving(null);}}>
      <DialogContent><DialogHeader><DialogTitle>{c.confirm}</DialogTitle><DialogDescription>{c.confirmInfo}</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={()=>setRemoving(null)}>{c.cancel}</Button>
          <Button variant="destructive" onClick={()=>{if(!removing)return;try{removeHolding(removing.id);setRemoving(null);}catch{setRemoving(null);}}}>{c.delete}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
