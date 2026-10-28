import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const language of ["en", "ar"] as const) {
  test(language + ": savings goal creates, edits, persists and deletes with backup support", async ({ page }) => {
    await page.addInitScript(language => localStorage.setItem("mizan-language", language), language);
    await page.goto("/goals");
    const ar = language === "ar";
    await expect(page.getByRole("heading", { name: ar ? "ادّخر لما يهمك" : "Save for what matters" })).toBeVisible();
    await page.getByRole("button", { name: ar ? "هدف جديد" : "New goal" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#goal-title").fill("New bicycle");
    await dialog.locator("#goal-target").fill("350");
    await dialog.locator("#goal-saved").fill("50");
    await dialog.getByRole("button", { name: ar ? "حفظ الهدف" : "Save goal" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "New bicycle" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "New bicycle" })).toBeVisible();
    await page.getByRole("button", { name: ar ? "تعديل الهدف: New bicycle" : "Edit goal: New bicycle" }).click();
    const edit = page.getByRole("dialog");
    await edit.locator("#goal-saved").fill("200");
    await edit.getByRole("button", { name: ar ? "حفظ الهدف" : "Save goal" }).click();
    await expect(edit).toHaveCount(0);
    const recorded = await page.evaluate(() => JSON.parse(localStorage.getItem("mizan-finance-v1")!).goals);
    expect(recorded.find((g: { title: string }) => g.title === "New bicycle")?.saved).toBe(200);

    const [file] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: ar ? "تصدير البيانات" : "Export data" }).click(),
    ]);
    const saved = JSON.parse(await readFile(await file.path(), "utf8"));
    expect(saved.version).toBe(3);
    expect(saved.goals.find((g: { title: string }) => g.title === "New bicycle")?.saved).toBe(200);

    await page.getByRole("button", { name: ar ? "حذف الهدف: New bicycle" : "Delete goal: New bicycle" }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: ar ? "حذف الهدف" : "Delete goal", exact: true }).click();
    await expect(page.getByRole("heading", { name: "New bicycle" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "New bicycle" })).toHaveCount(0);
  });

  test(language + ": monthly reports switch between six and twelve months and export CSV", async ({ page }) => {
    await page.addInitScript(language => localStorage.setItem("mizan-language", language), language);
    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: language === "ar" ? "تقاريرك الشهرية" : "Your money in perspective" })).toBeVisible();
    const table = page.getByRole("table");
    await expect(table.getByRole("row")).toHaveCount(7);
    await page.getByRole("button", { name: language === "ar" ? "12 أشهر" : "12 months" }).click();
    await expect(table.getByRole("row")).toHaveCount(13);
    const [file] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: language === "ar" ? "تصدير CSV" : "Export CSV" }).click(),
    ]);
    const csv = await readFile(await file.path(), "utf8");
    expect(csv).toContain("Month,Income,Expenses,Net");
    expect(csv.trim().split("\n")).toHaveLength(13);
    expect(csv).not.toContain("Monthly salary");
  });
}

test("eight-section navigation with mobile More menu remains usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(page.locator(".mobile-nav > a")).toHaveCount(4);
  const links = page.locator(".mobile-nav > a");
  for (const item of await links.all()) await expect(item).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  await page.locator(".mobile-nav a[href='/goals']").click();
  await expect(page.getByRole("heading", { name: "Save for what matters" })).toBeVisible();
  await page.getByRole("button", { name: "More sections" }).click();
  await expect(page.locator(".mobile-more-menu a")).toHaveCount(4);
  await page.locator(".mobile-more-menu a[href='/reports']").click();
  await expect(page.getByRole("heading", { name: "Your money in perspective" })).toBeVisible();
});
