import type { Transaction, RecurringExpense } from "../features/finance/types";
export type CalendarEvent = { id:string; date:string; title:string; category:string; amount:number };
export type CalendarDay = { date:string; recorded:Transaction[]; scheduled:CalendarEvent[] };
export function monthKey(value:unknown): string;
export function upcomingRecurring(rules:RecurringExpense[],month:string,today?:string): CalendarEvent[];
export function calendarDays(transactions:Transaction[],recurring:RecurringExpense[],month:string,today?:string): CalendarDay[];
