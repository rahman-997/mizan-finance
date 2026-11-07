// Estimates are manually recorded, not actual bank or market valuations.
const fail=()=>{throw new Error("INVALID_HOLDING");};
function validateHolding(h){
 if(!h || typeof h!=="object" || typeof h.id!=="string" || h.id.length<1 || h.id.length>150
 || typeof h.label!=="string" || h.label.trim().length<2 || h.label.trim().length>60
 || !["asset","liability"].includes(h.kind) || typeof h.value!=="number"
 || !Number.isFinite(h.value) || h.value<=0 || h.value>1_000_000) fail();
 return {id:h.id,label:h.label.trim(),kind:h.kind,value:h.value};
}
export function validateHoldings(items){
 if(!Array.isArray(items)||items.length>40)fail();
 const cleaned=items.map(validateHolding);
 if(new Set(cleaned.map(h=>h.id)).size!==cleaned.length)fail();
 return cleaned;
}
export function addHolding(data,item){
 const items=data.holdings||[];
 if(items.length>=40)throw new Error("HOLDING_LIMIT");
 const next=validateHolding(item);
 if(items.some(h=>h.id===next.id))throw new Error("HOLDING_DUPLICATE");
 return {...data,holdings:[...items,next]};
}
export function editHolding(data,id,draft){
 const items=data.holdings||[];
 if(!items.some(h=>h.id===id))throw new Error("HOLDING_NOT_FOUND");
 const cleaned=validateHolding({...draft,id});
 return {...data,holdings:items.map(h=>h.id===id?cleaned:h)};
}
export function removeHolding(data,id){
 return {...data,holdings:(data.holdings||[]).filter(h=>h.id!==id)};
}
export function holdingsSummary(items){
 const assets=items.filter(h=>h.kind==="asset").reduce((s,h)=>s+h.value,0);
 const liabilities=items.filter(h=>h.kind==="liability").reduce((s,h)=>s+h.value,0);
 return {assets,liabilities,net:assets-liabilities};
}
