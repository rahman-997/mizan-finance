import {test,expect} from "@playwright/test";
import {readFile} from "node:fs/promises";

for(const language of ["en","ar"] as const){
 test(language+": planned purchases add, edit, persist and delete without making transactions",async ({page})=>{
  const ar=language==="ar";
  await page.addInitScript(v=>localStorage.setItem("mizan-language",v),language);
  await page.goto("/purchases");
  await expect(page.getByRole("heading",{name:ar?"خطّط قبل الشراء":"Plan before you buy"})).toBeVisible();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").transactions);
  await page.getByRole("button",{name:ar?"إضافة مشتريات مخطّطة":"Add planned purchase"}).click();
  const dialog=page.getByRole("dialog");
  await dialog.locator("#plan-title").fill("Desk lamp");
  await dialog.locator("#plan-amount").fill("35.50");
  await dialog.locator("#plan-date").fill("2027-02-15");
  await dialog.getByRole("button",{name:ar?"حفظ الخطة":"Save plan"}).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading",{name:"Desk lamp"})).toBeVisible();
  await page.getByRole("button",{name:ar?"تعديل الخطة: Desk lamp":"Edit plan: Desk lamp"}).click();
  await page.getByRole("dialog").locator("#plan-amount").fill("42.75");
  await page.getByRole("dialog").getByRole("button",{name:ar?"حفظ الخطة":"Save plan"}).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const plans=await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").plans);
  expect(plans.some((p:{title:string,amount:number})=>p.title==="Desk lamp"&&p.amount===42.75)).toBe(true);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").transactions)).toEqual(before);
  await page.getByRole("button",{name:ar?"حذف الخطة: Desk lamp":"Delete plan: Desk lamp"}).click();
  await page.getByRole("dialog").getByRole("button",{name:ar?"حذف الخطة":"Delete plan",exact:true}).click();
  await page.reload();
  await expect(page.getByRole("heading",{name:"Desk lamp"})).toHaveCount(0);
 });
 test(language+": privacy center exports and restores full version five backup",async ({page})=>{
  const ar=language==="ar";
  await page.addInitScript(v=>localStorage.setItem("mizan-language",v),language);
  await page.goto("/purchases");
  await page.getByRole("button",{name:ar?"إضافة مشتريات مخطّطة":"Add planned purchase"}).click();
  await page.getByRole("dialog").locator("#plan-title").fill("Replacement keyboard");
  await page.getByRole("dialog").locator("#plan-amount").fill("85");
  await page.getByRole("dialog").getByRole("button",{name:ar?"حفظ الخطة":"Save plan"}).click();
  await page.goto("/data-center");
  await expect(page.getByRole("heading",{name:ar?"بياناتك تحت سيطرتك":"Your data, your control"})).toBeVisible();
  await expect(page.getByText(ar?"ملفات JSON غير مشفّرة":"JSON backup files are not encrypted",{exact:false})).toBeVisible();
  const [download]=await Promise.all([
   page.waitForEvent("download"),
   page.locator("main").getByRole("button",{name:ar?"تصدير البيانات":"Export data"}).click()
  ]);
  const contents=JSON.parse(await readFile(await download.path(),"utf8"));
  expect(contents.version).toBe(5);
  expect(contents.plans.some((p:{title:string})=>p.title==="Replacement keyboard")).toBe(true);
  await page.locator("main input[type=file]").setInputFiles({name:"mizan-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(contents))});
  const confirm=page.getByRole("dialog");
  await expect(confirm).toBeVisible();
  await expect(confirm).toContainText(ar?"مشتريات مخططة":"planned purchases");
  await confirm.getByRole("button",{name:ar?"استبدال واستعادة":"Replace and restore"}).click();
  await expect(confirm).toHaveCount(0);
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("mizan-finance-v1")||"{}").plans?.some((p:{title:string})=>p.title==="Replacement keyboard"))).toBe(true);
 });
}
test("twelve-section mobile More menu includes purchases and privacy without overflow",async ({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.goto("/");
 await page.getByRole("button",{name:"More sections"}).click();
 await expect(page.locator(".mobile-more-menu a")).toHaveCount(8);
 await page.locator(".mobile-more-menu a[href='/purchases']").click();
 await expect(page.getByRole("heading",{name:"Plan before you buy"})).toBeVisible();
 await page.getByRole("button",{name:"More sections"}).click();
 await page.locator(".mobile-more-menu a[href='/data-center']").click();
 await expect(page.getByRole("heading",{name:"Your data, your control"})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
});


test("long desktop section navigation stays scrollable without hiding backup controls",async ({page})=>{
  for(const viewport of [{width:1280,height:720},{width:1024,height:600}]){
    await page.setViewportSize(viewport);
    await page.goto("/transactions");
    const nav=page.locator(".desktop-nav");
    await expect(nav).toBeVisible();
    expect(await nav.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
    await expect(page.getByRole("button",{name:"Export data"})).toBeInViewport();
    await expect(page.getByRole("button",{name:"Restore backup"})).toBeInViewport();
    await nav.getByRole("link",{name:"Privacy & data"}).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button",{name:"Export data"})).toBeInViewport();
    await expect(page.getByRole("button",{name:"Restore backup"})).toBeInViewport();
  }
});
