import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.MIZAN_PRODUCTION_URL || "http://127.0.0.1:4174";
const profile = await mkdtemp(join(tmpdir(), "mizan-offline-"));
let context;

async function launch(offline) {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    baseURL,
    viewport: { width: 390, height: 844 },
    timezoneId: "Europe/Istanbul",
  });
  await context.setOffline(offline);
  const page = context.pages()[0] || await context.newPage();
  page.on("pageerror", (error) => console.error("Browser error:", error.message));
  page.on("requestfailed", (request) => console.error("Request failed:", request.url()));
  return page;
}

try {
  let page = await launch(false);
  await page.goto("/transactions", { waitUntil: "networkidle" });
  await expect(page.locator(".transaction-list")).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  // Reload under service-worker control to warm the compiled JS/CSS cache.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator(".transaction-list")).toBeVisible();
  await context.close();

  // Restart Chromium with only its persisted profile and networking disabled.
  // This must hydrate the production app, not merely display cached HTML.
  page = await launch(true);
  const response = await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200);
  await expect(page.locator(".transaction-list")).toBeVisible();
  await page.locator(".page-header button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#transaction-title").fill("Cold offline purchase");
  await dialog.locator("#transaction-amount").fill("17.75");
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toHaveCount(0);
  const row = page.locator(".transaction-row").filter({ hasText: "Cold offline purchase" });
  await expect(row).toBeVisible();
  await row.click();
  await page.getByRole("button", { name: "Edit transaction" }).click();
  await page.getByRole("dialog").locator("#transaction-amount").fill("19.25");
  await page.getByRole("dialog").locator('button[type="submit"]').click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await context.close();

  page = await launch(true);
  await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".transaction-row").filter({ hasText: "Cold offline purchase" })).toBeVisible();
  const amount = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("mizan-finance-v1"));
    return saved.transactions.find((item) => item.title === "Cold offline purchase")?.amount;
  });
  assert.equal(amount, 19.25);
  console.log("Production cold offline PASS: restarted Chromium, hydrated cached app, created/edited a transaction, and preserved it across another offline restart.");
} finally {
  await context?.close();
}
