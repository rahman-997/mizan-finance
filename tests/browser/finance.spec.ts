import { test, expect, type Page } from '@playwright/test';

const draft = {title:'Rent',category:'Housing',type:'expense',amount:100,date:'2026-10-01'};
const rule = {id:'r',day:1,nextDate:'2099-10-01',draft};
const backup = {transactions:[{...draft,id:'original'}],budgets:[],recurring:[]};
const file = (data: unknown) => ({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});

async function openWith(page: Page, data: unknown, language = 'en') {
  await page.addInitScript(({data,language}) => {
    if (!sessionStorage.getItem('finance-test-seeded')) {
      localStorage.setItem('mizan-finance-v1',JSON.stringify(data));
      localStorage.setItem('mizan-language',language);
      sessionStorage.setItem('finance-test-seeded','true');
    }
  }, {data,language});
  await page.goto('/');
  await expect(page.getByRole('button',{name:language === 'ar' ? 'استعادة نسخة احتياطية' : 'Restore backup'})).toBeVisible();
}

for (const language of ['en','ar']) {
  const ar = language === 'ar';
  test(`${language}: failed restore reports error inside confirmation and preserves data`, async ({page}) => {
    await openWith(page,backup,language);
    const before = await page.evaluate(() => localStorage.getItem('mizan-finance-v1'));
    await page.locator('input[type=file]').setInputFiles(file({transactions:[],budgets:[],recurring:[]}));
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key,value) {
        if(key === 'mizan-finance-v1') throw new DOMException('Full','QuotaExceededError');
        return original.call(this,key,value);
      };
    });
    await dialog.getByRole('button',{name:ar?'استبدال واستعادة':'Replace and restore'}).click();
    await expect(dialog.getByRole('alert')).toContainText(ar?'تعذر الحفظ':'Could not save');
    expect(await page.evaluate(() => localStorage.getItem('mizan-finance-v1'))).toBe(before);
    await expect(dialog).toBeVisible();
  });

  test(`${language}: rule 101 keeps the form open and explains the limit`, async ({page}) => {
    await openWith(page,{...backup,recurring:Array.from({length:100},(_,i)=>({...rule,id:`r${i}`}))},language);
    await page.getByRole('button',{name:ar?'المصاريف الشهرية':'Monthly expenses',exact:true}).click();
    await page.getByRole('button',{name:ar?'إضافة مصروف شهري':'Add monthly expense',exact:true}).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#transaction-title').fill('New rent');
    await dialog.locator('#transaction-amount').fill('100');
    await dialog.locator('button[type=submit]').click();
    await expect(dialog.getByRole('alert')).toContainText('100');
    await expect(dialog.locator('#transaction-title')).toHaveValue('New rent');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mizan-finance-v1')!).recurring.length)).toBe(100);
  });

  test(`${language}: entry 10001 is refused and existing data survives reload`, async ({page}) => {
    await openWith(page,{...backup,transactions:Array.from({length:10000},(_,i)=>({...draft,id:`t${i}`}))},language);
    await page.locator('.page-header button').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#transaction-title').fill('Extra entry');
    await dialog.locator('#transaction-amount').fill('10');
    await dialog.locator('button[type=submit]').click();
    await expect(dialog.getByRole('alert')).toContainText('10,000');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mizan-finance-v1')!).transactions.length)).toBe(10000);
    await page.reload();
    await expect(page.locator('.page-header button')).toBeVisible();
    await expect(page.getByText(ar?'البيانات المحفوظة غير متاحة':'Saved data unavailable',{exact:true})).toHaveCount(0);
  });

  test(`${language}: restore can be cancelled and confirmed with recurring preview`, async ({page}) => {
    await openWith(page,backup,language);
    const before = await page.evaluate(() => localStorage.getItem('mizan-finance-v1'));
    const restored = {transactions:[],budgets:[],recurring:[rule]};
    await page.locator('input[type=file]').setInputFiles(file(restored));
    await expect(page.getByRole('dialog')).toContainText(ar?'1 قاعدة شهرية':'1 monthly rules');
    await page.getByRole('button',{name:ar?'إلغاء':'Cancel',exact:true}).click();
    expect(await page.evaluate(() => localStorage.getItem('mizan-finance-v1'))).toBe(before);
    await page.locator('input[type=file]').setInputFiles(file(restored));
    await page.getByRole('button',{name:ar?'استبدال واستعادة':'Replace and restore'}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mizan-finance-v1')!).recurring.length)).toBe(1);
  });

  for (const width of [320,360,390,768]) {
    test(`${language}: toolbar fits viewport ${width}`,async ({page}) => {
      await page.setViewportSize({width,height:740});
      await openWith(page,backup,language);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const buttons = page.locator('.sidebar-actions button');
      await expect(buttons).toHaveCount(5);
      for(const button of await buttons.all()) await expect(button).toBeInViewport();
    });
  }
}

test('concurrent tabs warn instead of silently overwriting finance data', async ({page,context}) => {
  await page.goto('/');
  await expect(page.locator('.v16-dashboard')).toBeVisible();
  await page.waitForFunction(() => Boolean(localStorage.getItem('mizan-finance-v1')));
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.locator('.v16-dashboard')).toBeVisible();
  await page.locator('.page-header button').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('#transaction-title').fill('Second tab protected');
  await dialog.locator('#transaction-amount').fill('25');
  await dialog.locator('button[type=submit]').click();
  await expect(dialog).toHaveCount(0);
  await expect(other.getByText('Financial data changed in another tab')).toBeVisible();
  const before = await other.evaluate(() => JSON.parse(localStorage.getItem('mizan-finance-v1')).transactions.length);
  await other.getByRole('button',{name:'Load latest records'}).click();
  await expect(other.getByText('Second tab protected')).toBeVisible();
  const after = await other.evaluate(() => JSON.parse(localStorage.getItem('mizan-finance-v1')).transactions.length);
  expect(after).toBe(before);
  await other.close();
});
