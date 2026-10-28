import { test, expect } from "@playwright/test";

test("an open app records and edits transactions offline, then persists across reconnect", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto("/transactions");
  await expect(page.locator(".transaction-list")).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });

  // Disconnect the whole browser context. The hydrated app must stay usable.
  await context.setOffline(true);
  await page.locator(".page-header button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("#transaction-title").fill("Offline grocery purchase");
  await dialog.locator("#transaction-amount").fill("17.75");
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".transaction-row").filter({ hasText: "Offline grocery purchase" })).toBeVisible();

  const row = page.locator(".transaction-row").filter({ hasText: "Offline grocery purchase" });
  await row.click();
  await page.getByRole("button", { name: "Edit transaction" }).click();
  const edit = page.getByRole("dialog");
  await expect(edit).toBeVisible();
  await edit.locator("#transaction-amount").fill("19.25");
  await edit.locator('button[type="submit"]').click();
  await expect(edit).toHaveCount(0);

  expect(await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("mizan-finance-v1")!);
    return saved.transactions.find((item: { title: string }) => item.title === "Offline grocery purchase")?.amount;
  })).toBe(19.25);

  // Restoring connectivity must not erase entries created while offline.
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator(".transaction-row").filter({ hasText: "Offline grocery purchase" })).toBeVisible();
  expect(await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("mizan-finance-v1")!);
    return saved.transactions.find((item: { title: string }) => item.title === "Offline grocery purchase")?.amount;
  })).toBe(19.25);
});
