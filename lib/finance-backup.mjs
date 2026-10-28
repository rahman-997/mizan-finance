import { validateGoals } from './goal-utils.mjs';

// monthly:<rule ID>:YYYY-MM-DD must remain valid on the next load/export.
const MAX_RULE_ID_LENGTH = 150;
const MAX_TRANSACTION_ID_LENGTH = MAX_RULE_ID_LENGTH + 'monthly::YYYY-MM-DD'.length;
const fail = () => { throw new Error('Invalid or unsupported finance backup.'); };
const text = (v, max = 180) => typeof v === 'string' && v.length > 0 && v.length <= max;
export function validDate(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= '2000-01-01' && v <= '2100-12-31' && !Number.isNaN(Date.parse(v)) && new Date(v+'T12:00:00Z').toISOString().slice(0,10) === v;
}
function transaction(v, idRequired = true) {
  if (!v || typeof v !== 'object' || (idRequired && !text(v.id,MAX_TRANSACTION_ID_LENGTH)) || !text(v.title,60) || !text(v.category,80) || !['income','expense'].includes(v.type) || typeof v.amount !== 'number' || !Number.isFinite(v.amount) || v.amount <= 0 || v.amount > 1000000 || !validDate(v.date) || (v.note !== undefined && (typeof v.note !== 'string' || v.note.length > 180))) fail();
  return { ...(idRequired ? {id:v.id} : {}), title:v.title, category:v.category, type:v.type, amount:v.amount, date:v.date, ...(v.note !== undefined ? {note:v.note} : {}) };
}
export function parseBackup(value) {
  if (!value || typeof value !== 'object' || (value.app !== undefined && value.app !== 'Mizan Finance') || (value.version !== undefined && ![1,2,3].includes(value.version)) || !Array.isArray(value.transactions) || !Array.isArray(value.budgets) || value.transactions.length > 10000 || value.budgets.length > 100) fail();
  const transactions = value.transactions.map(v=>transaction(v));
  if(new Set(transactions.map(t=>t.id)).size!==transactions.length)fail();
  const budgets=value.budgets.map(b=>{if(!b||!text(b.category,80)||typeof b.limit!=='number'||!Number.isFinite(b.limit)||b.limit<0||b.limit>1000000)fail();return {category:b.category,limit:b.limit};});
  if(new Set(budgets.map(b=>b.category)).size!==budgets.length)fail();
  if(value.recurring!==undefined&&!Array.isArray(value.recurring))fail();
  const recurring=(value.recurring||[]).map(r=>{if(!r||r.draft?.type!=='expense'||!text(r.id,MAX_RULE_ID_LENGTH)||!validDate(r.nextDate)||!Number.isInteger(r.day)||r.day<1||r.day>31)fail();return {id:r.id,day:r.day,nextDate:r.nextDate,draft:transaction(r.draft,false)};});
  if(recurring.length>100||new Set(recurring.map(r=>r.id)).size!==recurring.length)fail();
  return {transactions,budgets,recurring};
}
export function nextOccurrence(date, day) {
  if(!validDate(date)||!Number.isInteger(day)||day<1||day>31)fail();
  const d=new Date(date+'T12:00:00Z');const y=d.getUTCFullYear(),m=d.getUTCMonth()+1;
  const last=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  return new Date(Date.UTC(y,m,Math.min(day,last),12)).toISOString().slice(0,10);
}
export function materializeRecurring(data,today) {
  if(!validDate(today))fail();
  const transactions=[...data.transactions];const ids=new Set(transactions.map(t=>t.id));
  const recurring=(data.recurring||[]).map(rule=>{
    let date=rule.nextDate,count=0;
    while(date<=today&&count<120){
      const id=`monthly:${rule.id}:${date}`;
      if(!ids.has(id)){if(transactions.length>=10000)break;transactions.unshift({...rule.draft,id,date});ids.add(id);}
      date=nextOccurrence(date,rule.day);count++;
    }
    return {...rule,nextDate:date};
  });
  return {...data,transactions,recurring};
}

export function localDate(date = new Date()) {
  return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function appendTransaction(data, entry) {
  if (data.transactions.length >= 10000) throw new Error('TRANSACTION_LIMIT');
  return {...data,transactions:[transaction(entry),...data.transactions]};
}
export function appendMonthlyExpense(data, rule, today) {
  if ((data.recurring || []).length >= 100) throw new Error('RECURRING_LIMIT');
  const validated = parseBackup({transactions:[],budgets:[],recurring:[rule]}).recurring[0];
  return materializeRecurring({...data,recurring:[...(data.recurring || []),validated]},today);
}
