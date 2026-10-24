import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const out = "artifacts/dashboard-browser";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];
const widths = [320, 360, 390, 768, 1280];
try {
  for (const language of ["en", "ar"]) {
    for (const width of widths) {
      const theme = (width === 390 || width === 1280) ? "dark" : "light";
      const context = await browser.newContext({
        viewport: { width, height: 840 },
        deviceScaleFactor: 1,
        timezoneId: "Europe/Istanbul",
        reducedMotion: "reduce",
      });
      await context.addInitScript(({ language, theme }) => {
        localStorage.setItem("mizan-language", language);
        localStorage.setItem("theme", theme);
      }, { language, theme });
      const page = await context.newPage();
      page.on("pageerror", (err) => errors.push(language + " " + width + ": " + err.message));
      try {
        const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded", timeout: 40000 });
        assert.equal(response?.status(), 200, "Dashboard response must be 200");
        await page.locator(".v16-dashboard").waitFor({ state: "visible", timeout: 40000 });
        await page.waitForFunction(({language,theme}) =>
          document.documentElement.lang === language &&
          document.documentElement.dir === (language === "ar" ? "rtl" : "ltr") &&
          document.documentElement.classList.contains("dark") === (theme === "dark"),
          {language,theme},
          {timeout:15000}
        );

        await page.evaluate(() => document.fonts.ready);
        const measures = await page.evaluate(() => {
          const boxes = [".v16-toolbar", ".v16-metrics", ".v16-analysis-grid", ".v16-bottom-grid"]
            .map(selector => ({selector, box: document.querySelector(selector)?.getBoundingClientRect().toJSON()}));
          return { scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, boxes };
        });
        assert.ok(measures.scrollWidth <= width + 1,
          language + " " + width + " horizontal overflow: " + JSON.stringify(measures));
        for (const {selector, box} of measures.boxes) {
          assert.ok(box && box.left >= -1 && box.right <= width + 1,
            language + " " + width + " " + selector + " clipped: " + JSON.stringify(box));
        }

        assert.equal(await page.locator(".v16-stat-card").count(), 3, "Three financial summary tiles");
        assert.equal(await page.locator(".v16-row").count(), 4, "Recent movements should be present");
        assert.ok((await page.locator(".v16-spending-body").count()) === 1, "Category donut should render");

        const selector = page.locator(".v16-segment button");
        await selector.nth(1).click();
        assert.equal(await selector.nth(1).getAttribute("aria-pressed"), "true", "12-month switch works");
        await selector.nth(0).click();
        assert.equal(await selector.nth(0).getAttribute("aria-pressed"), "true", "6-month switch works");

        const eye = page.locator(".v16-eye");
        await eye.focus();
        await page.keyboard.press("Enter");
        assert.equal((await page.locator(".v16-main-balance").innerText()).trim(), "••••••", "Keyboard privacy toggle masks balance");
        assert.equal(await page.locator(".v16-center-mask").count(), 2, "Privacy toggle masks both charts");
        assert.equal(await page.locator(".v16-track[role='progressbar']").count(), 0, "Budget ratios do not leak from ARIA");
        await page.keyboard.press("Enter");
        await page.locator(".v16-plot svg").waitFor({state:"visible",timeout:15000});
        assert.ok((await page.locator(".v16-main-balance").innerText()).trim() !== "••••••", "Privacy toggle reveals figures");

        if ((width === 390 || width === 1280)) {
          await page.screenshot({path: out + "/" + language + "-" + width + "-" + theme + ".png",fullPage:true,animations:"disabled"});
        }
        // Use the actual navigation destination without changing financial data.
        if (width === 1280) {
          await page.goto("http://127.0.0.1:4173/transactions", {waitUntil:"domcontentloaded"});
          await page.locator(".content-panel").waitFor({state:"visible"});
          await page.goto("http://127.0.0.1:4173/budgets", {waitUntil:"domcontentloaded"});
          await page.locator(".content-panel").waitFor({state:"visible"});
          await page.goto("http://127.0.0.1:4173/insights", {waitUntil:"domcontentloaded"});
          await page.locator(".content-panel").waitFor({state:"visible"});
        }
        results.push({language,width,theme,result:"pass",overflow:measures.scrollWidth-width});
      } catch(e) {
        results.push({language,width,theme,result:"fail",message:e.message});
        await page.screenshot({path:out + "/FAIL-" + language + "-" + width + ".png",fullPage:true}).catch(()=>{});
        throw e;
      } finally { await context.close(); }
    }
  }
} finally {
  await browser.close();
  await writeFile(out + "/results.json",JSON.stringify({results,errors},null,2));
}
assert.deepEqual(errors,[], "Browser runtime errors detected");
console.log("Dashboard E2E: " + results.length + " scenarios passed; saved screenshot evidence in " + out);
