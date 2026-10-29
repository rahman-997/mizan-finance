import { test, expect } from "@playwright/test";

for (const lang of ["en", "ar"] as const) {
  test(lang + ": recurring monthly rule can be added and stopped without deleting past records", async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem("mizan-language",value),lang);
    await page.goto("/recurring");
    const ar = lang === "ar";
    await expect(page.getByRole("heading",{name:ar?"المصروفات المتكررة":"Plan recurring expenses"})).toBeVisible();
    await page.getByRole("button",{name:ar?"إضافة مصروف متكرر":"Add recurring expense"}).click();
    const form=page.getByRole("dialog");
    await form.locator("#transaction-title").fill("Monthly practice fee");
    await form.locator("#transaction-amount").fill("45");
    await form.locator("#transaction-date").fill(new Date().toISOString().slice(0,10));
    await form.getByRole("button",{name:ar?"إضافة معاملة":"Add transaction"}).click();
    await expect(form).toHaveCount(0);
    await expect(page.getByRole("heading",{name:"Monthly practice fee"})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").recurring?.length)).toBe(1);
    await page.reload();
    await expect(page.getByRole("heading",{name:"Monthly practice fee"})).toBeVisible();
    await page.getByRole("button",{name:ar?"إيقاف التكرار: Monthly practice fee":"Stop recurring: Monthly practice fee"}).click();
    const confirm=page.getByRole("dialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button",{name:ar?"تأكيد الإيقاف":"Confirm stop"}).click();
    await expect(confirm).toHaveCount(0);
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").recurring?.length)).toBe(0);
    await page.reload();
    await expect(page.getByRole("heading",{name:"Monthly practice fee"})).toHaveCount(0);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").transactions?.some((t: {title:string})=>t.title==="Monthly practice fee"))).toBe(true);
  });

  test(lang + ": calendar distinguishes entries from scheduled rules, navigates months",async ({ page })=>{
    await page.addInitScript(value=>localStorage.setItem("mizan-language",value),lang);
    await page.goto("/calendar");
    const ar=lang==="ar";
    await expect(page.getByRole("heading",{name:ar?"تقويمك المالي":"Your financial calendar"})).toBeVisible();
    const days=page.getByRole("group").locator("button[aria-pressed]");
    await expect(days).toHaveCount(new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate());
    await page.getByRole("button",{name:ar?"الشهر السابق":"Previous month"}).click();
    await expect(page.getByRole("button",{name:ar?"اليوم":"Today"})).toBeVisible();
    await page.getByRole("button",{name:ar?"اليوم":"Today"}).click();
    await page.getByRole("group").locator("button[aria-pressed]").first().click();
    await expect(page.getByRole("complementary",{name:ar?"تفاصيل اليوم":"Day details"})).toBeVisible();
  });
}

test("mobile More menu exposes calendar and recurring routes without overflow",async ({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto("/");
  await page.getByRole("button",{name:"More sections"}).click();
  await expect(page.locator(".mobile-more-menu a")).toHaveCount(8);
  await page.locator(".mobile-more-menu a[href='/calendar']").click();
  await expect(page.getByRole("heading",{name:"Your financial calendar"})).toBeVisible();
  await page.getByRole("button",{name:"More sections"}).click();
  await page.locator(".mobile-more-menu a[href='/recurring']").click();
  await expect(page.getByRole("heading",{name:"Plan recurring expenses"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
});
