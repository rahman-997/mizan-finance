import test from "node:test";
import assert from "node:assert/strict";
import { calendarDays, upcomingRecurring, monthKey } from "../lib/finance-calendar.mjs";

const draft = { title: "Rent", amount: 325, category: "Housing", type: "expense", date: "2026-01-31" };
const rent = { id: "r1", day: 31, nextDate: "2026-01-31", draft };

test("calendar groups recorded transactions separately from scheduled, unposted expenses", () => {
  const records = [{ ...draft, id: "t1", date: "2026-02-28" }, { ...draft, id: "t2", type: "income", date: "2026-02-01" }];
  const scheduled = [{ ...rent, nextDate: "2026-02-28" }];
  const feb = calendarDays(records, scheduled, "2026-02");
  assert.equal(feb.length, 28);
  assert.equal(feb[27].recorded.length, 1);
  assert.equal(feb[27].scheduled.length, 1);
  assert.equal(feb[27].scheduled[0].id, "r1");
  assert.equal(feb[27].recorded[0].id, "t1");
  assert.equal(feb[0].recorded[0].type, "income");
  assert.ok(feb[26].recorded.length === 0);
});

test("31st recurrences safely clamp across February and restore original day in March", () => {
  assert.deepEqual(upcomingRecurring([rent], "2026-02", "2026-01-01").map(x => x.date), ["2026-02-28"]);
  assert.deepEqual(upcomingRecurring([rent], "2026-03", "2026-01-01").map(x => x.date), ["2026-03-31"]);
  assert.deepEqual(upcomingRecurring([rent], "2026-04", "2026-01-01").map(x => x.date), ["2026-04-30"]);
});

test("only future active rules appear; no double-counted scheduled entries", () => {
  assert.equal(upcomingRecurring([rent], "2026-01", "2026-02-01").length, 0);
  assert.equal(upcomingRecurring([rent], "2026-05", "2026-05-20").length, 1);
  assert.equal(upcomingRecurring([rent], "2026-05", "2026-06-01").length, 0);
  assert.equal(calendarDays([], [], "2024-02").length, 29);
  assert.throws(() => monthKey("garbage"), /INVALID_MONTH/);
  assert.throws(() => calendarDays([], [], "2026-13"), /INVALID_MONTH/);
});

test("calendar never mutates saved data or creates payments", () => {
  const transactions = [];
  const recurring = [rent];
  calendarDays(transactions, recurring, "2026-01");
  assert.equal(transactions.length, 0);
  assert.equal(recurring[0].nextDate, "2026-01-31");
});
