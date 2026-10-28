import type { Transaction } from "../features/finance/types";
export type MonthlyReportRow = { key: string; income: number; expenses: number; net: number };
export function reportMonths(transactions: Transaction[], count?: number, today?: string): MonthlyReportRow[];
export function reportCsv(months: MonthlyReportRow[]): string;
