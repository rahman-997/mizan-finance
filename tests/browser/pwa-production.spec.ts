import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { devices } from "@playwright/test";

test("production build hydrates and edits after a cold offline restart", async ({ page, context }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".transaction-list")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });

  // Warm the real production JS chunks under service-worker control before
  // simulating a user closing and reopening the installed app.
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".transaction-list")).toBeVisible();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".v16-dashboard")).toBeVisible();
  await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".transaction-list")).toBeVisible();
  const cache = await page.evaluate(async () => {
    const store = await caches.open("mizan-static-v3");
    const urls = (await store.keys()).map((request) => new URL(request.url).pathname);
    return { scripts: urls.filter((url) => /\.(?:js|css)$/.test(url)), pages: urls.filter((url) => ["/", "/transactions", "/budgets", "/insights"].includes(url)) };
  });
  expect(cache.scripts.length, "production assets need a real offline cache").toBeGreaterThan(0);
  expect(cache.pages).toContain("/transactions");

  await context.setOffline(true);
  // A real document navigation in an offline browser, not only an open React tab.
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator(".transaction-list")).toBeVisible({ timeout: 20_000 });
  await page.locator(".page-header button").click();
  const form = page.getByRole("dialog");
  await expect(form).toBeVisible();
  await form.locator("#transaction-title").fill("Cold offline purchase");
  await form.locator("#transaction-amount").fill("23.75");
  await form.locator('button[type="submit"]').click();
  await expect(form).toHaveCount(0);

  const row = page.locator(".transaction-row").filter({ hasText: "Cold offline purchase" });
  await expect(row).toBeVisible();
  await row.click();
  await page.getByRole("button", { name: "Edit transaction" }).click();
  const edit = page.getByRole("dialog");
  await expect(edit).toBeVisible();
  await edit.locator("#transaction-amount").fill("24.50");
  await edit.locator('button[type="submit"]').click();
  await expect(edit).toHaveCount(0);

  // A second offline reload proves local edits persist across cold restarts.
  const second = await page.reload({ waitUntil: "domcontentloaded" });
  expect(second?.status()).toBe(200);
  await expect(page.locator(".transaction-row").filter({ hasText: "Cold offline purchase" })).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("mizan-finance-v1") ?? "{}");
    return data.transactions?.find((item: { title: string }) => item.title === "Cold offline purchase")?.amount;
  })).toBe(24.5);

  await context.setOffline(false);
  await page.reload();
  await expect(page.locator(".transaction-row").filter({ hasText: "Cold offline purchase" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("production PWA reopens in Arabic dark mode on a mobile-width offline screen", async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem("mizan-language", "ar");
    localStorage.setItem("theme", "dark");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".v16-dashboard")).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".v16-dashboard")).toBeVisible();
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.classList.contains("dark"));
  await context.setOffline(true);
  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator(".v16-dashboard")).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(() => document.documentElement.dir === "rtl" && document.documentElement.classList.contains("dark"));
  await page.locator(".v16-eye").click();
  await expect(page.locator(".v16-main-balance")).toHaveText("••••••");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(391);
});


test("offline backup export and confirmed restore preserve original finance records", async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto("/transactions");
  await expect(page.locator(".transaction-list")).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
  await page.reload();
  await expect(page.locator(".transaction-list")).toBeVisible();

  await context.setOffline(true);
  const reloaded = await page.reload({ waitUntil: "domcontentloaded" });
  expect(reloaded?.status()).toBe(200);
  await expect(page.locator(".transaction-list")).toBeVisible();

  await page.locator(".page-header button").click();
  const add = page.getByRole("dialog");
  await add.locator("#transaction-title").fill("Original offline entry");
  await add.locator("#transaction-amount").fill("42.50");
  await add.locator('button[type="submit"]').click();
  await expect(add).toHaveCount(0);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export data" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^mizan-finance-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(exported.app).toBe("Mizan Finance");
  expect(exported.transactions.some((item: { title: string; amount: number }) =>
    item.title === "Original offline entry" && item.amount === 42.5)).toBe(true);

  await page.locator(".page-header button").click();
  const second = page.getByRole("dialog");
  await second.locator("#transaction-title").fill("Discard after backup");
  await second.locator("#transaction-amount").fill("9.75");
  await second.locator('button[type="submit"]').click();
  await expect(second).toHaveCount(0);
  await expect(page.locator(".transaction-row").filter({ hasText: "Discard after backup" })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "mizan-restore.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  const confirm = page.getByRole("dialog");
  await expect(confirm).toContainText("Restore this backup?");
  // No financial data changes before the explicit user confirmation.
  expect(await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mizan-finance-v1")!).transactions
      .some((item: { title: string }) => item.title === "Discard after backup"))).toBe(true);
  await confirm.getByRole("button", { name: "Replace and restore" }).click();
  await expect(confirm).toHaveCount(0);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("mizan-finance-v1")!));
  expect(saved.transactions.some((item: { title: string; amount: number }) =>
    item.title === "Original offline entry" && item.amount === 42.5)).toBe(true);
  expect(saved.transactions.some((item: { title: string }) => item.title === "Discard after backup")).toBe(false);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator(".transaction-row").filter({ hasText: "Original offline entry" })).toBeVisible();
  await expect(page.locator(".transaction-row").filter({ hasText: "Discard after backup" })).toHaveCount(0);
});

test.describe("Android-emulated installed-screen checks", () => {
  test.use({
    viewport: devices["Pixel 7"].viewport,
    deviceScaleFactor: devices["Pixel 7"].deviceScaleFactor,
    hasTouch: devices["Pixel 7"].hasTouch,
    isMobile: devices["Pixel 7"].isMobile,
    userAgent: devices["Pixel 7"].userAgent,
  });

  test("mobile RTL keyboard dialog and offline navigation survive restart", async ({ page, context }, testInfo) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      localStorage.setItem("mizan-language", "ar");
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/");
    await expect(page.locator(".v16-dashboard")).toBeVisible();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
    await page.reload();
    await expect(page.locator(".v16-dashboard")).toBeVisible();
    await page.goto("/transactions");
    await expect(page.locator(".transaction-list")).toBeVisible();
    await page.goto("/");
    await expect(page.locator(".v16-dashboard")).toBeVisible();

    await context.setOffline(true);
    const response = await page.reload({ waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator(".v16-dashboard")).toBeVisible();
    await expect(page.locator(".mobile-nav")).toBeVisible();
    await page.waitForFunction(() =>
      document.documentElement.lang === "ar"
      && document.documentElement.dir === "rtl"
      && document.documentElement.classList.contains("dark"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => innerWidth + 1));

    await page.locator(".mobile-nav a[href='/transactions']").click();
    await expect(page.locator(".transaction-list")).toBeVisible();
    await page.locator(".page-header button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("#transaction-title")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);

    await page.screenshot({ path: testInfo.outputPath("android-emulated-offline.png"), fullPage: true });
  });
});


test("new sections remain interactive after a production offline restart", async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto("/goals");
  await expect(page.getByRole("heading", { name: "Save for what matters" })).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole("button", { name: "New goal" })).toBeVisible();
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Your money in perspective" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  await context.setOffline(true);
  const report = await page.reload({ waitUntil: "domcontentloaded" });
  expect(report?.status()).toBe(200);
  await page.getByRole("button", { name: "12 months" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(13);
  const goalsResponse = await page.goto("/goals", { waitUntil: "domcontentloaded" });
  expect(goalsResponse?.status()).toBe(200);
  await page.getByRole("button", { name: "New goal" }).click();
  await expect(page.getByRole("dialog").locator("#goal-title")).toBeVisible();
});
