import type { FinanceData,Holding } from "../features/finance/types";
export function validateHoldings(value:unknown): Holding[];
export function addHolding(data:FinanceData,item:Holding):FinanceData;
export function editHolding(data:FinanceData,id:string,draft:Omit<Holding,"id">):FinanceData;
export function removeHolding(data:FinanceData,id:string):FinanceData;
export function holdingsSummary(items:Holding[]):{assets:number;liabilities:number;net:number};
