import test from 'node:test';
import assert from 'node:assert/strict';
import * as finance from '../lib/finance-backup.mjs';

const draft = {title:'Rent',category:'Housing',type:'expense',amount:100,date:'2026-10-01'};
const rule = {id:'r',day:1,nextDate:draft.date,draft};
const data = {transactions:[],budgets:[],recurring:[rule]};

test('accepted maximum rule IDs survive materialization and backup round-trip', () => {
  const parsed = finance.parseBackup({...data,recurring:[{...rule,id:'x'.repeat(150)}]});
  const generated = finance.materializeRecurring(parsed,'2026-10-17');
  assert.deepEqual(finance.parseBackup(JSON.parse(JSON.stringify(generated))),generated);
});

test('monthly expense backup rejects income rules', () => {
  assert.throws(() => finance.parseBackup({...data,recurring:[{...rule,draft:{...draft,type:'income'}}]}));
});

test('manual addition refuses entry 10001 without changing existing data', () => {
  const full = {...data,transactions:Array.from({length:10000},(_,i)=>({...draft,id:`t${i}`}))};
  assert.throws(() => finance.appendTransaction(full,{...draft,id:'new'}), /TRANSACTION_LIMIT/);
  assert.equal(full.transactions.length,10000);
  assert.doesNotThrow(() => finance.parseBackup(full));
});

test('manual addition can fill the last available entry', () => {
  const almost = {...data,transactions:Array.from({length:9999},(_,i)=>({...draft,id:`t${i}`}))};
  const result = finance.appendTransaction(almost,{...draft,id:'new'});
  assert.equal(result.transactions.length,10000);
  assert.equal(result.transactions[0].id,'new');
  assert.doesNotThrow(() => finance.parseBackup(result));
});

test('monthly addition reports the rule limit without changing existing data', () => {
  const full = {...data,recurring:Array.from({length:100},(_,i)=>({...rule,id:`r${i}`}))};
  assert.throws(() => finance.appendMonthlyExpense(full,{...rule,id:'new'},'2026-10-17'), /RECURRING_LIMIT/);
  assert.equal(full.recurring.length,100);
});

test('monthly addition records due entries and remains restorable', () => {
  const result = finance.appendMonthlyExpense({...data,recurring:[]},rule,'2026-10-17');
  assert.equal(result.transactions.length,1);
  assert.equal(result.recurring[0].nextDate,'2026-11-01');
  assert.doesNotThrow(() => finance.parseBackup(result));
});

test('local date reflects Istanbul midnight and refreshes for a new day', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'Europe/Istanbul';
  try {
    assert.equal(finance.localDate(new Date('2026-10-17T21:30:00Z')),'2026-10-18');
    assert.equal(finance.localDate(new Date('2026-10-18T21:30:00Z')),'2026-10-19');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
