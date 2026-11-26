import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// The dashboard shows "this month" figures for whatever month the data covers,
// so no UI string may hard-code a month name (a stale "September plan" label
// was shown over November data).
const MONTHS = /january|february|march|april|june|july|august|september|october|november|december|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|ocak|şubat|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık/i;

test("locale dictionaries contain no hard-coded month names", () => {
  const src = readFileSync("features/finance/locale-provider.tsx", "utf8");
  const dashboard = src.match(/dashboardEyebrow:\s*"([^"]*)"/g) ?? [];
  assert.ok(dashboard.length >= 1);
  for (const entry of dashboard) assert.doesNotMatch(entry, MONTHS, entry);
});
