import test from "node:test";
import assert from "node:assert/strict";
import { appendGoal, changeGoal, deleteGoal, validateGoals } from "../lib/goal-utils.mjs";
import { reportMonths, reportCsv } from "../lib/monthly-report.mjs";
import { parseBackup } from "../lib/finance-backup.mjs";

const base = { transactions: [], budgets: [], recurring: [], goals: [] };
const goal = { id: "goal-a", title: "Emergency cushion", target: 1000, saved: 250 };

test("savings goals add, update and delete without changing transaction balances", () => {
  const one = appendGoal(base, goal);
  assert.equal(one.goals[0].saved, 250);
  assert.equal(one.transactions.length, 0);
  const changed = changeGoal(one, "goal-a", { title: "Emergency cushion", target: 1500, saved: 900 });
  assert.equal(changed.goals[0].target, 1500);
  assert.equal(base.goals.length, 0);
  assert.equal(deleteGoal(changed, "goal-a").goals.length, 0);
});

test("invalid, duplicate and excessive savings goals cannot be added or restored", () => {
  for (const value of [
    { ...goal, saved: -1 }, { ...goal, saved: Infinity },
    { ...goal, target: 0 }, { ...goal, title: " " },
    { ...goal, saved: 1000001 }, { ...goal, title: "X".repeat(100) },
  ]) assert.throws(() => appendGoal(base, value));
  assert.throws(() => appendGoal({ ...base, goals: [goal] }, goal), /GOAL/);
  assert.throws(() => validateGoals([goal, goal]));
  assert.throws(() => validateGoals(Array.from({ length: 21 }, (_, i) => ({ ...goal, id: String(i) }))));
  assert.throws(() => parseBackup({ ...base, goals: [{ ...goal, saved: -1 }] }));
});

test("savings goals survive backup roundtrip, and old backups remain importable", () => {
  const stored = parseBackup({ ...base, goals: [goal] });
  assert.deepEqual(stored.goals, [goal]);
  assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(stored))), stored);
  assert.deepEqual(parseBackup({ transactions: [], budgets: [] }), { transactions: [], budgets: [], recurring: [] });
});

test("historical reports group real transactions by ISO month and compute net totals", () => {
  const entries = [
    { id: "a", date: "2026-01-09", type: "income", amount: 120, category: "Salary", title: "Work" },
    { id: "b", date: "2026-01-20", type: "expense", amount: 45, category: "Food", title: "Groceries" },
    { id: "c", date: "2025-12-31", type: "expense", amount: 20, category: "Food", title: "Old" },
    { id: "d", date: "2026-02-01", type: "income", amount: 90, category: "Salary", title: "Work" },
  ];
  const months = reportMonths(entries, 3, "2026-02-20");
  assert.deepEqual(months.map(x => x.key), ["2025-12", "2026-01", "2026-02"]);
  assert.deepEqual(months.map(x => [x.income, x.expenses, x.net]), [[0, 20, -20], [120, 45, 75], [90, 0, 90]]);
  assert.deepEqual(reportMonths([], 1, "2026-02-20").map(x => x.net), [0]);
  assert.throws(() => reportMonths(entries, 24, "2026-02-20"));
});

test("CSV export contains aggregated monthly values but no raw transaction text", () => {
  const csv = reportCsv([{key:"2026-02",income:100.5,expenses:10,net:90.5}]);
  assert.match(csv, /Month,Income,Expenses,Net/);
  assert.match(csv, /2026-02,100.5,10,90.5/);
  assert.ok(!csv.includes("secret"));
});
