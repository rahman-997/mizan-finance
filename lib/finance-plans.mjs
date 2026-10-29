// A planned purchase is an intention, never a completed transaction or bill.
const invalid=()=>{throw new Error("INVALID_PLAN");};
function dateOkay(value) {
 return typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
   && value>="2000-01-01" && value<="2100-12-31"
   && !Number.isNaN(Date.parse(value))
   && new Date(value+"T12:00:00Z").toISOString().slice(0,10)===value;
}
function clean(value){
 if(!value||typeof value!=="object"||typeof value.id!=="string"||!value.id||value.id.length>150
 ||typeof value.title!=="string"||value.title.trim().length<2||value.title.trim().length>60
 ||typeof value.amount!=="number"||!Number.isFinite(value.amount)||value.amount<=0||value.amount>1_000_000
 ||!dateOkay(value.targetDate)) invalid();
 return {id:value.id,title:value.title.trim(),amount:value.amount,targetDate:value.targetDate};
}
export function validatePlans(value){
 if(!Array.isArray(value)||value.length>30)invalid();
 const plans=value.map(clean);
 if(new Set(plans.map(p=>p.id)).size!==plans.length)invalid();
 return plans;
}
export function addPlan(data,item){
 const current=data.plans||[];
 if(current.length>=30)throw new Error("PLAN_LIMIT");
 const plan=clean(item);
 if(current.some(p=>p.id===plan.id))throw new Error("PLAN_DUPLICATE");
 return {...data,plans:[...current,plan]};
}
export function editPlan(data,id,draft){
 const items=data.plans||[];
 if(!items.some(p=>p.id===id))throw new Error("PLAN_NOT_FOUND");
 const plan=clean({...draft,id});
 return {...data,plans:items.map(p=>p.id===id?plan:p)};
}
export function deletePlan(data,id){
 return {...data,plans:(data.plans||[]).filter(p=>p.id!==id)};
}
export function plansSummary(items){
 return {count:items.length,total:items.reduce((sum,p)=>sum+p.amount,0)};
}
