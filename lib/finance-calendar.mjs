import { nextOccurrence, validDate } from "./finance-backup.mjs";
export function monthKey(value) {
  if (typeof value !== "string" || !/^(20\d\d|2100)-(0[1-9]|1[0-2])$/.test(value)) throw new Error("INVALID_MONTH");
  return value;
}
export function upcomingRecurring(rules, month, today = `${month}-01`) {
  monthKey(month);
  if (!validDate(today)) throw new Error("INVALID_DATE");
  const result = [];
  const end = `${month}-${new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).getUTCDate()}`;
  for (const rule of rules) {
    let date = rule.nextDate;
    let guard = 0;
    while (date < `${month}-01` && guard++ < 1200) date = nextOccurrence(date, rule.day);
    if (date >= today && date <= end && date.slice(0,7) === month) {
      result.push({ id: rule.id, date, title: rule.draft.title, category: rule.draft.category, amount: rule.draft.amount });
    }
  }
  return result.sort((a,b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}
export function calendarDays(transactions, recurring, month, today = `${month}-01`) {
  monthKey(month);
  const [y,m] = month.split("-").map(Number);
  const total = new Date(Date.UTC(y,m,0)).getUTCDate();
  const scheduled = upcomingRecurring(recurring,month,today);
  return Array.from({length:total},(_,i)=>{
    const date = `${month}-${String(i+1).padStart(2,"0")}`;
    return {date,recorded:transactions.filter(t=>t.date === date),scheduled:scheduled.filter(t=>t.date === date)};
  });
}
