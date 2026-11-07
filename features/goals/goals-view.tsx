"use client";

import { useState } from "react";
import { CirclePlus, Pencil, PiggyBank, Trash2, Flag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatMoney } from "@/features/finance/format";
import type { SavingsGoal } from "@/features/finance/types";

type Form = { title: string; target: string; saved: string };
const empty: Form = { title: "", target: "", saved: "0" };

export function GoalsView() {
  const { goals = [], addGoal, editGoal, removeGoal, storageConflict } = useFinance();
  const { language } = useLocale();
  const ar = language === "ar";
  const c = ar
    ? { create: "هدف جديد", edit: "تعديل الهدف", save: "حفظ الهدف", cancel: "إلغاء", delete: "حذف الهدف", confirm: "هل تريد حذف هذا الهدف؟", confirmHint: "لن تُحذف أي معاملة مالية.", target: "المبلغ المستهدف (دولار)", saved: "المبلغ الموفّر يدوياً (دولار)", title: "اسم الهدف", example: "مثال: صندوق للطوارئ", savedTotal: "المبلغ المدوّن", targetTotal: "إجمالي الأهداف", progress: "مكتمل", remaining: "المتبقي", empty: "لا توجد أهداف بعد. أضف هدفاً صغيراً لتتبّع تقدمك.", note: "هذه الأهداف أرقام تخطيطية تحفظها يدوياً. لا تُخصم من الرصيد ولا تمثل رصيداً بنكياً.", error: "تحقق من الاسم والمبالغ: الهدف أكبر من صفر، والموفّر لا يقل عن صفر، والمبلغ لا يزيد عن مليون.", conflict: "تغيّرت بياناتك في تبويب آخر. حمّل أحدث السجلات قبل التعديل.", limit: "الحد الأقصى 20 هدفاً.", intro: "تابع خطوات ادخارك، دون تحويل أموال أو ربط حساب بنكي.", complete: "تم بلوغ الهدف" }
    : { create: "New goal", edit: "Edit goal", save: "Save goal", cancel: "Cancel", delete: "Delete goal", confirm: "Delete this goal?", confirmHint: "Your financial transactions will not be deleted.", target: "Target amount (USD)", saved: "Manually set aside (USD)", title: "Goal name", example: "e.g. Emergency fund", savedTotal: "Recorded progress", targetTotal: "Total targets", progress: "complete", remaining: "to go", empty: "No goals yet. Start with a small, personal milestone.", note: "Goal amounts are manual planning figures. They do not reduce your balance or represent money held by a bank.", error: "Check the name and amounts: target must be positive, saved cannot be negative, and values cannot exceed one million.", conflict: "Data changed in another tab. Load the latest records before editing.", limit: "Up to 20 goals are supported.", intro: "Track milestones without transferring funds or connecting a bank.", complete: "Goal reached" };
  const [editing, setEditing] = useState<SavingsGoal | "new" | null>(null);
  const [removing, setRemoving] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState("");
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const open = (goal: SavingsGoal | "new") => {
    setError(""); setEditing(goal);
    setForm(goal === "new" ? empty : { title: goal.title, target: String(goal.target), saved: String(goal.saved) });
  };
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = form.title.trim();
    const target = Number(form.target);
    const saved = Number(form.saved);
    if (title.length < 2 || title.length > 60 || !form.target.trim() || !form.saved.trim()
      || !Number.isFinite(target) || target <= 0 || target > 1_000_000
      || !Number.isFinite(saved) || saved < 0 || saved > 1_000_000) {
      setError(c.error); return;
    }
    try {
      if (editing === "new") addGoal({ title, target, saved });
      else if (editing) editGoal(editing.id, { title, target, saved });
      setEditing(null); setError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(message === "EXTERNAL_CHANGE" ? c.conflict : message === "GOAL_LIMIT" ? c.limit : c.error);
    }
  };
  return (
    <section className="mx-auto grid max-w-7xl gap-5" aria-label={ar ? "أهداف الادخار" : "Savings goals"}>
      <div className="surface-card grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center md:p-7">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><PiggyBank size={18} />{ar ? "مساحة للخطط" : "YOUR MILESTONES"}</div>
          <h2 className="text-2xl font-bold tracking-tight">{ar ? "كل هدف خطوة للأمام" : "Make room for what matters"}</h2>
          <p className="text-sm text-muted-foreground">{c.intro}</p>
        </div>
        <Button onClick={() => open("new")} disabled={storageConflict || goals.length >= 20} className="min-h-11"><CirclePlus size={18}/>{c.create}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.savedTotal}</p><strong className="mt-2 block text-2xl tabular-nums" dir="ltr">{formatMoney(totalSaved, language)}</strong></div>
        <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.targetTotal}</p><strong className="mt-2 block text-2xl tabular-nums" dir="ltr">{formatMoney(totalTarget, language)}</strong></div>
      </div>
      <p className="rounded-xl border border-border bg-secondary/60 p-4 text-sm text-muted-foreground"><Sparkles className="me-2 inline-block h-4 w-4" aria-hidden="true"/>{c.note}</p>
      {goals.length === 0 && <div className="surface-card p-8 text-center text-muted-foreground">{c.empty}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round(goal.saved / goal.target * 100));
          const done = goal.saved >= goal.target;
          return <article key={goal.id} className="surface-card min-w-0 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><div className="mb-2 inline-flex rounded-xl bg-secondary p-2"><Flag className="h-5 w-5 text-primary" aria-hidden="true"/></div><h3 className="break-words text-lg font-bold">{goal.title}</h3></div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label={`${c.edit}: ${goal.title}`} onClick={() => open(goal)} disabled={storageConflict}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`${c.delete}: ${goal.title}`} onClick={() => setRemoving(goal)} disabled={storageConflict}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2"><strong className="text-xl tabular-nums" dir="ltr">{formatMoney(goal.saved, language)}</strong><span className="text-sm text-muted-foreground" dir="ltr">/ {formatMoney(goal.target, language)}</span></div>
            <Progress className="mt-3 h-2" value={progress} aria-label={`${goal.title}: ${progress}% ${c.progress}`} />
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{progress}% {c.progress}</span><span className="text-muted-foreground">{done ? c.complete : `${formatMoney(goal.target - goal.saved, language)} ${c.remaining}`}</span></div>
          </article>;
        })}
      </div>
      <Dialog open={editing !== null} onOpenChange={(value) => { if (!value) setEditing(null); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === "new" ? c.create : c.edit}</DialogTitle><DialogDescription>{c.note}</DialogDescription></DialogHeader>
          <form onSubmit={save} className="grid gap-4" noValidate>
            <div className="grid gap-2"><Label htmlFor="goal-title">{c.title}</Label><Input id="goal-title" maxLength={60} required placeholder={c.example} value={form.title} onChange={e => setForm(f => ({...f,title:e.target.value}))}/></div>
            <div className="grid gap-2"><Label htmlFor="goal-target">{c.target}</Label><Input id="goal-target" type="number" required min="0.01" step="0.01" value={form.target} onChange={e => setForm(f => ({...f,target:e.target.value}))}/></div>
            <div className="grid gap-2"><Label htmlFor="goal-saved">{c.saved}</Label><Input id="goal-saved" type="number" required min="0" step="0.01" value={form.saved} onChange={e => setForm(f => ({...f,saved:e.target.value}))}/></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>{c.cancel}</Button><Button type="submit">{c.save}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={removing !== null} onOpenChange={value => { if(!value)setRemoving(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{c.confirm}</DialogTitle><DialogDescription>{c.confirmHint}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRemoving(null)}>{c.cancel}</Button>
            <Button variant="destructive" onClick={() => { if(!removing) return; try { removeGoal(removing.id); setRemoving(null); } catch { setRemoving(null); } }}>{c.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
