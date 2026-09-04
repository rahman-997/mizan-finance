import type { Transaction } from "@/features/finance/types";

export function calculateSummary(transactions: Transaction[]): {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
};
export function filterTransactions(
  transactions: Transaction[],
  filters?: { query?: string; type?: string; category?: string; sort?: string },
): Transaction[];
export function spendingByCategory(transactions: Transaction[]): Array<{ category: string; amount: number }>;
export function monthlySeries(transactions: Transaction[], count?: number): Array<{ month: string; income: number; expenses: number }>;
export function currentMonthTransactions(transactions: Transaction[], reference?: Date): Transaction[];
