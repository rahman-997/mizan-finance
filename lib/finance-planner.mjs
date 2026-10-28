// Does not alter transactions. The scenario is deliberately NOT stored.
export function actualMonth(transactions,month){
 if(typeof month!=="string"||!/^(20\\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month))throw new Error("INVALID_MONTH");
 const totals={income:0,expenses:0};
 for(const t of transactions){
  if(t.date?.slice(0,7)!==month)continue;
  if(t.type==="income")totals.income+=t.amount;
  else if(t.type==="expense")totals.expenses+=t.amount;
 }
 return {...totals,net:totals.income-totals.expenses};
}
export function planScenario(baseline,change){
 if(!baseline || !change || ![baseline.income,baseline.expenses,change.incomeChange,change.expenseChange].every(v=>typeof v==="number"&&Number.isFinite(v)))throw new Error("INVALID_SCENARIO");
 const income=baseline.income+change.incomeChange;
 const expenses=baseline.expenses+change.expenseChange;
 if([baseline.income,baseline.expenses,income,expenses].some(v=>v<0||v>1_000_000_000)||[change.incomeChange,change.expenseChange].some(v=>Math.abs(v)>1_000_000))throw new Error("INVALID_SCENARIO");
 const baselineNet=baseline.income-baseline.expenses;
 return {baselineNet,income,expenses,net:income-expenses,difference:income-expenses-baselineNet};
}
