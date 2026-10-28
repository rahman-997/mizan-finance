import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const language of ["en","ar"] as const) {
  test(language + ": holdings can be created, edited, exported, and removed independently from transactions", async ({page})=>{
    const ar=language==="ar";
    await page.addInitScript(v=>localStorage.setItem("mizan-language",v),language);
    await page.goto("/holdings");
    await expect(page.getByRole("heading",{name:ar?"اعرف قيمة ما تملك وما عليك":"Know what you own and owe"})).toBeVisible();
    const oldTx=await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").transactions);
    await page.getByRole("button",{name:ar?"إضافة بند":"Add item"}).click();
    const dialog=page.getByRole("dialog");
    await dialog.locator("#holding-label").fill("Handcrafted desk");
    await dialog.locator("#holding-value").fill("450");
    await dialog.getByRole("button",{name:ar?"حفظ البند":"Save item"}).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading",{name:"Handcrafted desk"})).toBeVisible();
    await page.reload();
    await page.getByRole("button",{name:ar?"تعديل البند: Handcrafted desk":"Edit item: Handcrafted desk"}).click();
    const edit=page.getByRole("dialog");
    await edit.locator("#holding-value").fill("550");
    await edit.getByRole("button",{name:ar?"حفظ البند":"Save item"}).click();
    await expect(edit).toHaveCount(0);
    const [backup]=await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button",{name:ar?"تصدير البيانات":"Export data"}).click()
    ]);
    const exported=JSON.parse(await readFile(await backup.path(),"utf8"));
    expect(exported.version).toBe(4);
    expect(exported.holdings.find((v:{label:string})=>v.label==="Handcrafted desk")?.value).toBe(550);
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").transactions)).toEqual(oldTx);
    await page.getByRole("button",{name:ar?"حذف البند: Handcrafted desk":"Delete item: Handcrafted desk"}).click();
    await page.getByRole("dialog").getByRole("button",{name:ar?"حذف البند":"Delete item",exact:true}).click();
    await page.reload();
    await expect(page.getByRole("heading",{name:"Handcrafted desk"})).toHaveCount(0);
  });

  test(language + ": what-if planner compares scenarios without writing finance records",async ({page})=>{
    const ar=language==="ar";
    await page.addInitScript(v=>localStorage.setItem("mizan-language",v),language);
    await page.goto("/planner");
    await expect(page.getByRole("heading",{name:ar?"جرّب خطتك الشهرية":"Explore your monthly options"})).toBeVisible();
    const before=await page.evaluate(()=>localStorage.getItem("mizan-finance-v1"));
    await page.locator("#planner-income").fill("100");
    await page.locator("#planner-expenses").fill("-25");
    await expect(page.getByText(ar?"الفرق عن المسجّل":"Difference from recorded")).toBeVisible();
    await page.getByRole("button",{name:ar?"إعادة الضبط":"Reset scenario"}).click();
    await expect(page.locator("#planner-income")).toHaveValue("0");
    await expect(page.locator("#planner-expenses")).toHaveValue("0");
    expect(await page.evaluate(()=>localStorage.getItem("mizan-finance-v1"))).toBe(before);
  });
}

test("new sections are accessible from 320px mobile More navigation",async ({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto("/");
  await page.getByRole("button",{name:"More sections"}).click();
  await expect(page.locator(".mobile-more-menu a")).toHaveCount(6);
  await page.locator(".mobile-more-menu a[href='/holdings']").click();
  await expect(page.getByRole("heading",{name:"Know what you own and owe"})).toBeVisible();
  await page.getByRole("button",{name:"More sections"}).click();
  await page.locator(".mobile-more-menu a[href='/planner']").click();
  await expect(page.getByRole("heading",{name:"Explore your monthly options"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
});
