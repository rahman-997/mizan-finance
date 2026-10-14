import type { FinanceData } from '../features/finance/types';
export function validDate(value: unknown): boolean;
export function parseBackup(value: unknown): FinanceData;
export function nextOccurrence(date: string, day: number): string;
export function materializeRecurring(data: FinanceData, today: string): FinanceData;
