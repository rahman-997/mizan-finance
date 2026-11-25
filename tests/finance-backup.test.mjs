import test from 'node:test';import assert from 'node:assert/strict';
import {parseBackup,materializeRecurring,nextOccurrence} from '../lib/finance-backup.mjs';
const draft={title:'Rent',category:'Housing',type:'expense',amount:100,date:'2024-01-31'};
const data={transactions:[],budgets:[{category:'Housing',limit:200}],recurring:[{id:'r',day:31,nextDate:'2024-01-31',draft}]};
test('imports legacy exports and rejects unsupported or corrupt data',()=>{assert.deepEqual(parseBackup({app:'Mizan Finance',transactions:[],budgets:[]}),{transactions:[],budgets:[],recurring:[]});for(const v of [null,{...data,version:99},{...data,transactions:[{...draft,id:'x',amount:NaN}]},{...data,transactions:[{...draft,id:'x',date:'2024-02-31'}]},{...data,transactions:[{...draft,id:'x'},{...draft,id:'x'}]}])assert.throws(()=>parseBackup(v));});
test('month end retains original day across leap February',()=>{assert.equal(nextOccurrence('2024-01-31',31),'2024-02-29');assert.equal(nextOccurrence('2024-02-29',31),'2024-03-31');assert.equal(nextOccurrence('2025-01-31',31),'2025-02-28');});
test('catch-up is idempotent and does not generate future entries',()=>{const first=materializeRecurring(data,'2024-03-30');assert.equal(first.transactions.length,2);assert.equal(first.recurring[0].nextDate,'2024-03-31');assert.deepEqual(materializeRecurring(first,'2024-03-30'),first);assert.equal(materializeRecurring(first,'2024-03-31').transactions.length,3);});
test('stopping a rule retains previous entries',()=>{const first=materializeRecurring(data,'2024-02-29');assert.equal(materializeRecurring({...first,recurring:[]},'2024-05-31').transactions.length,2);});

test('rejects oversized recurring arrays before reading any entries', () => {
  let reads = 0;
  const recurring = new Array(101).fill(data.recurring[0]);
  Object.defineProperty(recurring, 0, { get() { reads++; return data.recurring[0]; } });
  assert.throws(() => parseBackup({...data, recurring}), /Invalid or unsupported finance backup/);
  assert.equal(reads, 0);
});

test('rejects invalid recurring shape before reading transaction entries', () => {
  let reads = 0;
  const transactions = [{...draft, id:'t'}];
  Object.defineProperty(transactions, 0, { get() { reads++; return {...draft, id:'t'}; } });
  for (const recurring of [null, {}, new Array(101).fill(data.recurring[0])]) {
    assert.throws(() => parseBackup({...data, transactions, recurring}), /Invalid or unsupported finance backup/);
  }
  assert.equal(reads, 0);
});

test('accepts exactly 100 distinct recurring rules and preserves legacy omission', () => {
  const recurring = Array.from({length:100}, (_, i) => ({...data.recurring[0], id:`rule-${i}`}));
  assert.deepEqual(parseBackup({...data, recurring}).recurring, recurring);
  assert.deepEqual(parseBackup({transactions:[], budgets:[]}).recurring, []);
  assert.throws(() => parseBackup({...data, recurring:[...recurring, {...data.recurring[0], id:'extra'}]}));
});
