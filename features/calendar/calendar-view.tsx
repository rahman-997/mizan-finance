"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Circle, Info, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/features/finance/finance-provider";
import { useLocale } from "@/features/finance/locale-provider";
import { formatMoney, formatDate } from "@/features/finance/format";
import { localDate } from "@/lib/finance-backup.mjs";
import { calendarDays } from "@/lib/finance-calendar.mjs";

function moveMonth(month:string, offset:number) {
  const [year,m] = month.split("-").map(Number);
  return new Date(Date.UTC(year,m-1+offset,1)).toISOString().slice(0,7);
}

export function CalendarView() {
  const {transactions,recurring=[]} = useFinance();
  const {language} = useLocale();
  const ar = language==="ar";
  const today = localDate();
  const [month,setMonth] = useState(()=>localDate().slice(0,7));
  const [selected,setSelected] = useState(()=>localDate());
  const days = useMemo(()=>calendarDays(transactions,recurring,month,today),[transactions,recurring,month,today]);
  const selectedDay = days.find(d=>d.date===selected);
  const firstOffset = (new Date(month+"-01T12:00:00Z").getUTCDay()+6)%7;
  const monthLabel = new Intl.DateTimeFormat(ar?"ar-SA":"en-US",{month:"long",year:"numeric"}).format(new Date(month+"-01T12:00:00Z"));
  const weekdayLabels = ar?["الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"]:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const c=ar
    ? {heading:"خريطتك المالية",recorded:"معاملات مسجلة",scheduled:"مصروفات مجدولة",none:"ما في معاملات أو مواعيد بهذا اليوم.",record:"مسجل",upcoming:"مجدول",prev:"الشهر السابق",next:"الشهر التالي",today:"اليوم",note:"المواعيد القادمة تقديرية ومبنية على قواعد التكرار المحلية. لا تمثل دفعاً تلقائياً لأي فاتورة.",selected:"تفاصيل اليوم",entries:"الحركات في هذا الشهر"}
    : {heading:"Your money calendar",recorded:"Recorded transactions",scheduled:"Scheduled expenses",none:"No recorded or scheduled activity on this day.",record:"Recorded",upcoming:"Scheduled",prev:"Previous month",next:"Next month",today:"Today",note:"Upcoming dates are previews from your locally saved recurring rules. They do not pay bills automatically.",selected:"Day details",entries:"Activity this month"};
  const go = (delta:number) => {
    const next=moveMonth(month,delta);
    if(next < "2000-01" || next > "2100-12")return;
    setMonth(next);
    setSelected(next+"-01");
  };
  const selectToday=()=>{setMonth(today.slice(0,7));setSelected(today)};
  const recordedCount=days.reduce((n,d)=>n+d.recorded.length,0);
  const scheduledCount=days.reduce((n,d)=>n+d.scheduled.length,0);
  return <section className="mx-auto grid max-w-7xl gap-5" aria-label={c.heading}>
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5 md:p-7">
      <div><div className="mb-2 inline-flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground"><CalendarDays size={17}/>{ar?"التقويم":"CALENDAR"}</div><h2 className="text-2xl font-bold">{c.heading}</h2></div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={selectToday}>{c.today}</Button>
        <Button variant="outline" size="icon" onClick={()=>go(-1)} disabled={month==="2000-01"} aria-label={c.prev}><ChevronLeft size={18}/></Button>
        <Button variant="outline" size="icon" onClick={()=>go(1)} disabled={month==="2100-12"} aria-label={c.next}><ChevronRight size={18}/></Button>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.recorded}</p><strong className="mt-2 block text-2xl">{recordedCount}</strong></div>
      <div className="surface-card p-5"><p className="text-sm text-muted-foreground">{c.scheduled}</p><strong className="mt-2 block text-2xl">{scheduledCount}</strong></div>
    </div>
    <div className="rounded-xl border border-border bg-secondary/70 p-4 text-sm text-muted-foreground"><Info size={16} className="me-2 inline-block"/>{c.note}</div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(270px,.8fr)]">
      <div className="surface-card min-w-0 p-3 sm:p-5">
        <h3 className="mb-5 px-1 text-lg font-bold">{monthLabel}</h3>
        <div className="grid grid-cols-7 gap-1" role="group" aria-label={monthLabel} dir={ar?"rtl":"ltr"}>
          {weekdayLabels.map((day,i)=><span key={i} className="overflow-hidden py-2 text-center text-[10px] font-semibold text-muted-foreground sm:text-xs" aria-label={day}>{day.slice(0,ar?2:3)}</span>)}
          {Array.from({length:firstOffset},(_,i)=><span key={"empty-"+i} aria-hidden="true"/>)}
          {days.map(day=>{
            const active=day.date===selected;
            const hasRecords=day.recorded.length>0,hasScheduled=day.scheduled.length>0;
            return <button key={day.date} type="button" onClick={()=>setSelected(day.date)}
              aria-label={`${formatDate(day.date,language)}: ${day.recorded.length} ${c.recorded}, ${day.scheduled.length} ${c.scheduled}`}
              aria-pressed={active}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${active?"border-primary bg-secondary font-bold":"border-transparent hover:bg-secondary"}`}>
              <span>{Number(day.date.slice(-2))}</span>
              <span className="flex h-2 gap-0.5">{hasRecords&&<Circle className="h-1.5 w-1.5 fill-indigo-500 text-indigo-500" aria-hidden="true"/>}{hasScheduled&&<Circle className="h-1.5 w-1.5 fill-amber-500 text-amber-500" aria-hidden="true"/>}</span>
            </button>;
          })}
        </div>
      </div>
      <aside className="surface-card min-w-0 p-5" aria-label={c.selected}>
        <div className="mb-4 flex items-center gap-2"><ListChecks size={18} aria-hidden="true"/><h3 className="font-bold">{c.selected}</h3></div>
        <p className="mb-5 text-sm font-semibold">{formatDate(selected,language)}</p>
        {!selectedDay || (selectedDay.recorded.length===0 && selectedDay.scheduled.length===0) ? <p className="text-sm text-muted-foreground">{c.none}</p>:
          <div className="grid gap-3">
            {selectedDay.recorded.map(item=><article key={item.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="mb-1 block text-xs font-semibold text-indigo-500">{c.record}</span>
              <div className="flex flex-wrap items-start justify-between gap-2"><strong className="min-w-0 break-words text-sm">{item.title}</strong><span className="tabular-nums text-sm" dir="ltr">{item.type==="income"?"+":"−"}{formatMoney(item.amount,language)}</span></div>
            </article>)}
            {selectedDay.scheduled.map(item=><article key={item.id} className="rounded-xl border border-dashed border-amber-500/50 p-3">
              <span className="mb-1 block text-xs font-semibold text-amber-600 dark:text-amber-400">{c.upcoming}</span>
              <div className="flex flex-wrap items-start justify-between gap-2"><strong className="break-words text-sm">{item.title}</strong><span className="tabular-nums text-sm" dir="ltr">{formatMoney(item.amount,language)}</span></div>
            </article>)}
          </div>}
      </aside>
    </div>
    <p className="text-sm text-muted-foreground">{c.entries}: {recordedCount} / {scheduledCount}</p>
  </section>;
}
