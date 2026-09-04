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

export type FinanceData = {
  transactions: Transaction[];
  budgets: Budget[];
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
