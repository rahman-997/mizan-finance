import { test, expect } from "@playwright/test";

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
    const store = await caches.open("mizan-static-v2");
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
