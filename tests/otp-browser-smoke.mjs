/* Dependency-free browser smoke test. Requires Node 22 and Chrome. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const delay = ms => new Promise(done => setTimeout(done, ms));
const baseUrl = "http://127.0.0.1:4173";
const harnessPath = "/tests/otp-harness/index.html";
const binary = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"].find(x => x && existsSync(x));
if (!binary) throw new Error("Google Chrome or Chromium is required");
const profile = await mkdtemp(join(tmpdir(), "mizan-chrome-"));
const outputDir = resolve("screenshots/browser-smoke");
await mkdir(outputDir, { recursive: true });
let viteServer, chrome, socket, seq = 0;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolveResult, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(Error("CDP timeout: " + method)); }, 12000);
    pending.set(id, { resolveResult, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const out = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (out.exceptionDetails) throw new Error(JSON.stringify(out.exceptionDetails));
  return out.result.value;
}

async function waitFor(expression, label, timeout = 25000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { if (await evaluate(expression)) return; } catch { /* hydration not complete */ }
    await delay(160);
  }
  throw new Error("Timeout: " + label);
}

async function viewport(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await delay(160);
  const metrics = await evaluate('(() => { const b = document.querySelector(".mizan-otp-card").getBoundingClientRect(); return { width: innerWidth, scroll: document.documentElement.scrollWidth, left: b.left, right: b.right }; })()');
  assert.ok(metrics.left >= -2 && metrics.right <= metrics.width + 2 && metrics.scroll <= metrics.width + 4,
    "Overflow at " + width + ": " + JSON.stringify(metrics));
  console.log("PASS viewport " + width + "x" + height);
}

async function shot(name) {
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(join(outputDir, name + ".png"), Buffer.from(screenshot.data, "base64"));
}

async function choose(code, title) {
  const clicked = await evaluate('(() => { const el = [...document.querySelectorAll(".mizan-otp-languages button")].find(x => x.textContent.trim() === ' + JSON.stringify(code) + '); if (!el) return false; el.click(); return true; })()');
  assert.equal(clicked, true);
  await waitFor('document.querySelector(".mizan-otp-card h2")?.textContent === ' + JSON.stringify(title), code + " translation");
}

async function type(code) {
  assert.equal(await evaluate('(() => { const el = document.querySelector("input[autocomplete=one-time-code]"); if (!el) return false; el.focus(); el.select(); return true; })()'), true);
  await send("Input.insertText", { text: code });
  await waitFor('document.querySelector("input[autocomplete=one-time-code]")?.value === ' + JSON.stringify(code), "input " + code);
}

async function run() {
  // The real OTP React components are tested inside Vite without Vinext or a
  // Cloudflare Workers runtime. The production build is validated separately.
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
  chrome = spawn(binary, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { stdio: "ignore" });
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]; if (port) break; } catch { /* Chrome loading */ }
    await delay(100);
  }
  if (!port) throw new Error("Chrome debugging port was not created");
  const response = await fetch("http://127.0.0.1:" + port + "/json/new?about:blank", { method: "PUT" });
  if (!response.ok) throw Error("Cannot create Chrome tab: " + response.status);
  const target = await response.json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, fail) => { socket.addEventListener("open", ok, { once: true }); socket.addEventListener("error", fail, { once: true }); });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id); clearTimeout(item.timer);
    if (message.error) item.reject(new Error(message.error.message)); else item.resolveResult(message.result);
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: baseUrl + harnessPath });
  await waitFor('Boolean(document.querySelector("input[autocomplete=one-time-code]"))', "OTP input");
  assert.equal(await evaluate('document.querySelectorAll("[data-slot=input-otp-slot]").length'), 6);
  assert.equal(await evaluate('document.querySelector(".mizan-otp-card h2").textContent'), "Verify your number");
  await shot("desktop-en");
  await viewport(390, 844, true); await shot("mobile-en");
  await viewport(320, 700, true);
  await choose("AR", "تأكيد رقم هاتفك");
  assert.equal(await evaluate('document.querySelector(".mizan-otp-scene").dir'), "rtl");
  await viewport(390, 844, true); await shot("mobile-ar");
  await type("123456");
  await evaluate('document.querySelector(".mizan-otp-action").click()');
  await waitFor('Boolean(document.querySelector(".mizan-otp-feedback.is-error"))', "invalid-code feedback");
  assert.equal(await evaluate('document.querySelector(".mizan-otp-feedback").getAttribute("role")'), "alert");
  await type("246810");
  await evaluate('document.querySelector(".mizan-otp-action").click()');
  await waitFor('Boolean(document.querySelector(".mizan-otp-success"))', "success feedback");
  await shot("mobile-ar-success");
  await evaluate('document.querySelector(".mizan-otp-restart").click()');
  await waitFor('Boolean(document.querySelector("input[autocomplete=one-time-code]"))', "reset form");
  assert.equal(await evaluate('document.querySelector("input[autocomplete=one-time-code]").value'), "");
  await choose("TR", "Numaranızı doğrulayın");
  assert.equal(await evaluate('document.querySelector(".mizan-otp-scene").lang'), "tr");
  await viewport(390, 844, true); await shot("mobile-tr");
  console.log("PASS browser tests: en/ar/tr, 6 slots, errors, success, replay, responsive layout");
}

try { await run(); } finally {
  socket?.close();
  if (chrome && chrome.exitCode === null) chrome.kill("SIGTERM");
  await viteServer?.close();
  await delay(600);
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 }).catch(() => {});
}
