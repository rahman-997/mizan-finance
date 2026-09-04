import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSummary,
  currentMonthTransactions,
  filterTransactions,
  monthlySeries,
  spendingByCategory,
} from "../lib/finance-utils.mjs";

const transactions = [
  { id: "1", title: "Salary", amount: 3000, type: "income", category: "Salary", date: "2026-09-01" },
  { id: "2", title: "Groceries", amount: 200, type: "expense", category: "Food", date: "2026-09-02", note: "Weekly shop" },
  { id: "3", title: "Rent", amount: 900, type: "expense", category: "Housing", date: "2026-08-02" },
];

test("calculateSummary returns income, expenses, balance, and savings rate", () => {
  assert.deepEqual(calculateSummary(transactions), {
    income: 3000,
    expenses: 1100,
    balance: 1900,
    savingsRate: 63.33333333333333,
  });
});

test("filterTransactions combines search, type, category, and sorting", () => {
  const result = filterTransactions(transactions, {
    query: "weekly",
    type: "expense",
    category: "Food",
    sort: "amount-high",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Groceries");
});

test("filterTransactions sorts amounts without mutating the input", () => {
  const originalOrder = transactions.map((item) => item.id);
  const result = filterTransactions(transactions, { sort: "amount-low" });
  assert.deepEqual(result.map((item) => item.amount), [200, 900, 3000]);
  assert.deepEqual(transactions.map((item) => item.id), originalOrder);
});

test("currentMonthTransactions limits the collection to the selected month", () => {
  const result = currentMonthTransactions(transactions, new Date("2026-09-12T00:00:00Z"));
  assert.deepEqual(result.map((item) => item.id), ["1", "2"]);
});

test("spendingByCategory excludes income and sorts highest spending first", () => {
  assert.deepEqual(spendingByCategory(transactions), [
    { category: "Housing", amount: 900 },
    { category: "Food", amount: 200 },
  ]);
});

test("monthlySeries always returns the requested number of periods", () => {
  const result = monthlySeries(transactions, 6);
  assert.equal(result.length, 6);
  assert.ok(result.every((item) => "income" in item && "expenses" in item));
});
