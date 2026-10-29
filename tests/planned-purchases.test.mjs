import test from "node:test";
import assert from "node:assert/strict";
import { addPlan, editPlan, deletePlan, validatePlans, plansSummary } from "../lib/finance-plans.mjs";
import { parseBackup } from "../lib/finance-backup.mjs";

const base = {transactions:[],budgets:[],goals:[],holdings:[],recurring:[]};
const laptop = {id:"planned-a",title:"New laptop",amount:890,targetDate:"2027-02-15"};
const books = {id:"planned-b",title:"Reference books",amount:75,targetDate:"2026-11-12"};

test("planned purchases are independent of real financial transactions",()=>{
 const a=addPlan(base,laptop);
 const b=addPlan(a,books);
 assert.equal(a.transactions.length,0);
 assert.equal(base.plans,undefined);
 assert.deepEqual(plansSummary(b.plans),{count:2,total:965});
 assert.deepEqual(b.plans.map(x=>x.title),["New laptop","Reference books"]);
 const edited=editPlan(b,"planned-a",{title:"Laptop",amount:700,targetDate:"2027-03-01"});
 assert.equal(edited.plans[0].amount,700);
 assert.equal(b.plans[0].amount,890);
 assert.equal(deletePlan(edited,"planned-b").plans.length,1);
});
test("invalid purchase data is rejected before writing and importing",()=>{
 for(const bad of [
  {...laptop,title:" "},{...laptop,title:"x".repeat(70)},{...laptop,amount:0},
  {...laptop,amount:-1},{...laptop,amount:Infinity},{...laptop,amount:1e9},
  {...laptop,targetDate:"2026-02-30"},{...laptop,id:""}
 ]) assert.throws(()=>addPlan(base,bad));
 assert.throws(()=>addPlan({...base,plans:[laptop]},laptop),/PLAN/);
 assert.throws(()=>validatePlans([laptop,laptop]),/PLAN/);
 assert.throws(()=>validatePlans(Array.from({length:31},(_,i)=>({...laptop,id:"p"+i}))),/PLAN/);
 assert.throws(()=>parseBackup({...base,plans:[{...laptop,amount:-10}]}));
});
test("version 5 backups roundtrip plans and versions 1-4 remain valid",()=>{
 const v5=parseBackup({app:"Mizan Finance",version:5,...base,plans:[laptop]});
 assert.deepEqual(v5.plans,[laptop]);
 assert.deepEqual(parseBackup(v5),v5);
 for(const version of [1,2,3,4]){
  const restored=parseBackup({app:"Mizan Finance",version,...base});
  assert.equal(restored.plans,undefined);
 }
 assert.throws(()=>parseBackup({app:"Mizan Finance",version:6,...base}));
});
