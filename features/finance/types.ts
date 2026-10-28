export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note?: string;
};

export type Budget = {
  category: string;
  limit: number;
};

export type RecurringExpense = { id: string; day: number; nextDate: string; draft: TransactionDraft };

export type SavingsGoal = { id: string; title: string; target: number; saved: number };

export type FinanceData = {
  goals?: SavingsGoal[];
  transactions: Transaction[];
  budgets: Budget[];
  recurring?: RecurringExpense[];
};

export type TransactionDraft = Omit<Transaction, "id">;

export const categories = [
  "Housing",
  "Food",
  "Transport",
  "Health",
  "Learning",
  "Leisure",
  "Salary",
  "Freelance",
] as const;
