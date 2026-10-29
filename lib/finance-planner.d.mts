import type { Transaction } from "../features/finance/types";
export type MonthTotals={income:number;expenses:number;net:number};
export type Scenario={baselineNet:number;income:number;expenses:number;net:number;difference:number};
export function actualMonth(transactions:Transaction[],month:string):MonthTotals;
export function planScenario(baseline:MonthTotals,change:{incomeChange:number;expenseChange:number}):Scenario;
