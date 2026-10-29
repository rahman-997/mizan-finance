import type { FinanceData, PlannedPurchase } from "../features/finance/types";
export function validatePlans(value:unknown): PlannedPurchase[];
export function addPlan(data:FinanceData,item:PlannedPurchase):FinanceData;
export function editPlan(data:FinanceData,id:string,draft:Omit<PlannedPurchase,"id">):FinanceData;
export function deletePlan(data:FinanceData,id:string):FinanceData;
export function plansSummary(items:PlannedPurchase[]):{count:number;total:number};
