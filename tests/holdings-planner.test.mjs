import test from "node:test";
import assert from "node:assert/strict";
import { addHolding, editHolding, removeHolding, validateHoldings, holdingsSummary } from "../lib/finance-holdings.mjs";
import { planScenario, actualMonth } from "../lib/finance-planner.mjs";
import { parseBackup } from "../lib/finance-backup.mjs";
const blank = {transactions:[],budgets:[],recurring:[],goals:[]};
const item={id:"a1",label:"Laptop",kind:"asset",value:750};
test("holdings allow independent asset and liability tracking without changing transaction balances",()=>{
 const first=addHolding(blank,item);
 const second=addHolding(first,{id:"l1",label:"Study loan",kind:"liability",value:200});
 assert.deepEqual(holdingsSummary(second.holdings),{assets:750,liabilities:200,net:550});
 assert.equal(second.transactions.length,0);
 assert.equal(blank.holdings,undefined);
 assert.equal(editHolding(second,"a1",{label:"Laptop updated",kind:"asset",value:850}).holdings[0].value,850);
 assert.equal(removeHolding(second,"l1").holdings.length,1);
 assert.equal(second.holdings.length,2);
});
test("holdings reject malformed, duplicate, oversized and nonfinite values",()=>{
 for(const bad of [{...item,value:-1},{...item,value:0},{...item,value:Infinity},{...item,label:" "},{...item,kind:"other"},{...item,id:""},{...item,value:1e9}]) assert.throws(()=>addHolding(blank,bad));
 assert.throws(()=>addHolding({ ...blank,holdings:[item]},item),/HOLDING/);
 assert.throws(()=>validateHoldings(Array.from({length:41},(_,i)=>({...item,id:String(i)}))));
 assert.throws(()=>parseBackup({...blank,holdings:[{...item,value:-20}]}));
});
test("new holdings survive backup roundtrip and v1-v3 backups remain valid",()=>{
 const data=parseBackup({...blank,app:"Mizan Finance",version:4,holdings:[item]});
 assert.deepEqual(data.holdings,[item]);
 assert.deepEqual(parseBackup(data),data);
 for(const version of [1,2,3]) assert.equal(parseBackup({...blank,version}).holdings,undefined);
 assert.throws(()=>parseBackup({...blank,version:6}));
});
test("planner uses only actual recorded entries for the selected month",()=>{
 const transactions=[
  {date:"2026-10-01",amount:500,type:"income"},
  {date:"2026-10-15",amount:110,type:"expense"},
  {date:"2026-09-15",amount:3000,type:"expense"},
 ];
 assert.deepEqual(actualMonth(transactions,"2026-10"),{income:500,expenses:110,net:390});
 assert.deepEqual(actualMonth([],"2026-10"),{income:0,expenses:0,net:0});
});
test("what-if planner is pure, explicit and rejects invalid adjustments",()=>{
 const baseline={income:500,expenses:110,net:390};
 const result=planScenario(baseline,{incomeChange:50,expenseChange:-20});
 assert.deepEqual(result,{baselineNet:390,income:550,expenses:90,net:460,difference:70});
 assert.deepEqual(baseline,{income:500,expenses:110,net:390});
 for(const change of [{incomeChange:Infinity,expenseChange:0},{incomeChange:0,expenseChange:-111},{incomeChange:1e9,expenseChange:0}])
   assert.throws(()=>planScenario(baseline,change));
});
