import { test, expect } from "@playwright/test";

test("offline edit persists from the installed app shell and survives offline reload", async ({ page, context }) => {
  test.setTimeout(120_000);

  // A first online visit installs the worker; a controlled online visit allows
  // its same-origin scripts, styles and route chunks to enter the static cache.
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

  // Loading a cached HTML document is insufficient; React must hydrate and
  // submit the real transaction form while no network connection exists.
  const offlinePage = await page.reload({ waitUntil: "domcontentloaded" });
  expect(offlinePage?.status()).toBe(200);
  await expect(page.locator(".v16-dashboard")).toBeVisible();
  await page.locator(".page-header button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#transaction-title").fill("Offline grocery purchase");
  await dialog.locator("#transaction-amount").fill("17.75");
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const stored = localStorage.getItem("mizan-finance-v1");
    const rows = stored ? JSON.parse(stored).transactions : [];
    return rows.some((entry: { title: string; amount: number }) =>
      entry.title === "Offline grocery purchase" && entry.amount === 17.75);
  })).toBe(true);

  // Confirm a new offline document load still hydrates with the persisted data.
  await page.reload();
  await expect(page.getByText("Offline grocery purchase")).toBeVisible();

  // Check offline navigation AND an edit, rather than merely receiving HTTP 200.
  await page.goto("/transactions");
  await expect(page.locator(".transaction-list")).toBeVisible();
  await page.locator(".transaction-row").filter({ hasText: "Offline grocery purchase" }).click();
  await page.getByRole("button", { name: "Edit transaction" }).click();
  const edit = page.getByRole("dialog");
  await edit.locator("#transaction-amount").fill("19.25");
  await edit.locator('button[type="submit"]').click();
  await expect(edit).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".transaction-row").filter({ hasText: "Offline grocery purchase" })).toBeVisible();
  expect(await page.evaluate(() => {
    const rows = JSON.parse(localStorage.getItem("mizan-finance-v1")!).transactions;
    return rows.find((entry: { title: string }) => entry.title === "Offline grocery purchase")?.amount;
  })).toBe(19.25);
});
