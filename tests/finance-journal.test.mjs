import test from 'node:test';
import assert from 'node:assert/strict';
import { createFinanceJournal } from '../lib/finance-journal.mjs';
import { appendTransaction, appendMonthlyExpense } from '../lib/finance-backup.mjs';
const draft={title:'Monthly rent',category:'Housing',type:'expense',amount:300,date:'2026-10-01'};
const entry=(id)=>({...draft,id});
test('synchronous sequential commits do not lose transactions inside one render',()=>{
  const journal=createFinanceJournal({transactions:[],budgets:[],recurring:[]});
  journal.commit(s=>appendTransaction(s,entry('one')));
  journal.commit(s=>appendTransaction(s,entry('two')));
  assert.deepEqual(journal.get().transactions.map(t=>t.id),['two','one']);
});
test('failed transaction update preserves the previous snapshot',()=>{
  const journal=createFinanceJournal({transactions:Array.from({length:10000},(_,i)=>entry('e'+i)),budgets:[],recurring:[]});
  const prev=journal.get();
  assert.throws(()=>journal.commit(s=>appendTransaction(s,entry('new'))),/TRANSACTION_LIMIT/);
  assert.strictEqual(journal.get(),prev);
});
test('successive recurring commitments stay independent',()=>{
  const journal=createFinanceJournal({transactions:[],budgets:[],recurring:[]});
  for(const id of ['rent','utilities']) {
    journal.commit(s=>appendMonthlyExpense(s,{id,day:1,nextDate:'2026-11-01',draft},'2026-10-25'));
  }
  assert.deepEqual(journal.get().recurring.map(r=>r.id),['rent','utilities']);
});
test('replacement atomically becomes the base for the next transaction',()=>{
  const journal=createFinanceJournal({transactions:[entry('old')],budgets:[],recurring:[]});
  journal.replace({transactions:[],budgets:[],recurring:[]});
  journal.commit(s=>appendTransaction(s,entry('new')));
  assert.deepEqual(journal.get().transactions.map(x=>x.id),['new']);
});
