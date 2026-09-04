import type { FinanceData } from "./types";

const isoDate = (monthOffset: number, day: number) => {
  const value = new Date();
  value.setMonth(value.getMonth() + monthOffset, day);
  return value.toISOString().slice(0, 10);
};

export const seedData: FinanceData = {
  transactions: [
    { id: "tx-1", title: "Monthly salary", amount: 4200, type: "income", category: "Salary", date: isoDate(0, 1), note: "Main salary payment" },
    { id: "tx-2", title: "Apartment rent", amount: 1250, type: "expense", category: "Housing", date: isoDate(0, 2), note: "Monthly rent and building fees" },
    { id: "tx-3", title: "Groceries", amount: 186.4, type: "expense", category: "Food", date: isoDate(0, 5), note: "Weekly grocery shop" },
    { id: "tx-4", title: "Metro card", amount: 48, type: "expense", category: "Transport", date: isoDate(0, 7) },
    { id: "tx-5", title: "Interface design project", amount: 720, type: "income", category: "Freelance", date: isoDate(0, 9), note: "Final client payment" },
    { id: "tx-6", title: "Frontend course", amount: 160, type: "expense", category: "Learning", date: isoDate(-1, 18) },
    { id: "tx-7", title: "Pharmacy", amount: 42.75, type: "expense", category: "Health", date: isoDate(-1, 12) },
    { id: "tx-8", title: "Coffee with friends", amount: 31.2, type: "expense", category: "Leisure", date: isoDate(-2, 24) },
    { id: "tx-9", title: "Monthly salary", amount: 4200, type: "income", category: "Salary", date: isoDate(-1, 1) },
    { id: "tx-10", title: "Monthly salary", amount: 4100, type: "income", category: "Salary", date: isoDate(-2, 1) },
    { id: "tx-11", title: "Home internet", amount: 36, type: "expense", category: "Housing", date: isoDate(-2, 15) },
    { id: "tx-12", title: "Book order", amount: 54, type: "expense", category: "Learning", date: isoDate(-3, 11) },
  ],
  budgets: [
    { category: "Housing", limit: 1450 },
    { category: "Food", limit: 500 },
    { category: "Transport", limit: 180 },
    { category: "Health", limit: 200 },
    { category: "Learning", limit: 260 },
    { category: "Leisure", limit: 240 },
  ],
};
