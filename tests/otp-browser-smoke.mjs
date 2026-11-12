/* Isolated OTP UI smoke: real Playwright Chromium, synthetic test data only. */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4173";
const harnessPath = "/tests/otp-harness/index.html";
const outputDir = resolve("screenshots/browser-smoke");
await mkdir(outputDir, { recursive: true });

let viteServer, browser, page;

async function evaluate(expression) {
  return page.evaluate(expression);
}

async function waitFor(expression, label, timeout = 25000) {
  try {
    await page.waitForFunction(expression, null, { timeout, polling: 160 });
  } catch (error) {
    throw new Error("Timeout: " + label, { cause: error });
  }
}

async function viewport(width, height) {
  await page.setViewportSize({ width, height });
  const metrics = await evaluate('(() => { const b = document.querySelector(".mizan-otp-card").getBoundingClientRect(); return { width: innerWidth, scroll: document.documentElement.scrollWidth, left: b.left, right: b.right }; })()');
  assert.ok(
    metrics.left >= -2 && metrics.right <= metrics.width + 2 &&
    metrics.scroll <= metrics.width + 4,
    "Overflow at " + width + ": " + JSON.stringify(metrics)
  );
  console.log("PASS viewport " + width + "x" + height);
}

async function shot(name) {
  await page.screenshot({ path: resolve(outputDir, name + ".png"), animations: "disabled" });
}

async function choose(code, title) {
  const button = page.locator(".mizan-otp-languages button").filter({ hasText: code });
  assert.equal(await button.count(), 1, "Expected a single language control " + code);
  await button.click();
  await waitFor('document.querySelector(".mizan-otp-card h2")?.textContent === ' + JSON.stringify(title), code + " translation");
}

async function type(code) {
  const input = page.locator('input[autocomplete="one-time-code"]');
  await input.focus();
  await input.press("ControlOrMeta+A");
  await page.keyboard.insertText(code);
  await waitFor('document.querySelector("input[autocomplete=one-time-code]")?.value === ' + JSON.stringify(code), "input " + code);
}

async function run() {
  // Test the shipped React OTP component on localhost, not a deployed finance service.
  const { createServer } = await import("vite");
  const { default: react } = await import("@vitejs/plugin-react");
  viteServer = await createServer({
    configFile: false,
    root: process.cwd(),
    plugins: [react()],
    resolve: { alias: { "@": process.cwd() } },
    server: { host: "127.0.0.1", port: 4173, strictPort: true },
    appType: "spa",
  });
  await viteServer.listen();
  const ready = await fetch(baseUrl + harnessPath);
  assert.equal(ready.status, 200, "OTP harness must be served");

  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseUrl + harnessPath, { waitUntil: "domcontentloaded" });
  await waitFor('Boolean(document.querySelector("input[autocomplete=one-time-code]"))', "OTP input");
  assert.equal(await evaluate('document.querySelectorAll("[data-slot=input-otp-slot]").length'), 6);
  assert.equal(await evaluate('document.querySelector(".mizan-otp-card h2").textContent'), "Verify your number");

  await shot("desktop-en");
  await viewport(390, 844); await shot("mobile-en");
  await viewport(320, 700);
  await choose("AR", "تأكيد رقم هاتفك");
  assert.equal(await evaluate('document.querySelector(".mizan-otp-scene").dir'), "rtl");
  await viewport(390, 844); await shot("mobile-ar");

  await type("123456");
  await page.locator(".mizan-otp-action").click();
  await waitFor('Boolean(document.querySelector(".mizan-otp-feedback.is-error"))', "invalid-code feedback");
  assert.equal(await evaluate('document.querySelector(".mizan-otp-feedback").getAttribute("role")'), "alert");
  await type("246810");
  await page.locator(".mizan-otp-action").click();
  await waitFor('Boolean(document.querySelector(".mizan-otp-success"))', "success feedback");
  await shot("mobile-ar-success");
  await page.locator(".mizan-otp-restart").click();
  await waitFor('Boolean(document.querySelector("input[autocomplete=one-time-code]"))', "reset form");
  assert.equal(await evaluate('document.querySelector("input[autocomplete=one-time-code]").value'), "");

  await choose("TR", "Numaranızı doğrulayın");
  assert.equal(await evaluate('document.querySelector(".mizan-otp-scene").lang'), "tr");
  await viewport(390, 844); await shot("mobile-tr");
  console.log("PASS browser tests: en/ar/tr, 6 slots, errors, success, replay, responsive layout");
}

try {
  await run();
} finally {
  await page?.close().catch(() => {});
  await browser?.close().catch(() => {});
  await viteServer?.close().catch(() => {});
}
