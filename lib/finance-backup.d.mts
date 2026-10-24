import type { FinanceData, Transaction, RecurringExpense } from '../features/finance/types';
export function validDate(value: unknown): boolean;
export function parseBackup(value: unknown): FinanceData;
export function nextOccurrence(date: string, day: number): string;
export function materializeRecurring(data: FinanceData, today: string): FinanceData;
export function localDate(date?: Date): string;
export function appendTransaction(data: FinanceData, entry: Transaction): FinanceData;
export function appendMonthlyExpense(data: FinanceData, rule: RecurringExpense, today: string): FinanceData;
