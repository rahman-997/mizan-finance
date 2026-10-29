import { test, expect } from "@playwright/test";

test("PWA install assets and cached navigation work with Chromium offline", async ({ page, context, request }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await expect(page.locator(".v16-dashboard")).toBeVisible();

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const settings = await manifest.json();
  expect(settings.display).toBe("standalone");
  for (const size of [192, 512]) {
    const icon = await request.get("/icon-" + size + ".png");
    expect(icon.status()).toBe(200);
    expect(icon.headers()["content-type"]).toContain("image/png");
    const buffer = await icon.body();
    expect(Array.from(buffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }

  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error("PWA service worker did not activate");
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 30_000 });

  const cachedShell = await page.evaluate(async () => {
    const cache = await caches.open("mizan-static-v6");
    const paths = ["/", "/transactions", "/budgets", "/insights", "/goals", "/reports", "/recurring", "/calendar", "/holdings", "/planner", "/purchases", "/data-center"];
    return Promise.all(paths.map(async path => {
      const hit = await cache.match(path);
      return { path, status: hit?.status, contentType: hit?.headers.get("content-type") };
    }));
  });
  for (const entry of cachedShell) {
    expect(entry.status, entry.path + " needs offline shell").toBe(200);
    expect(entry.contentType, entry.path + " should be HTML").toContain("text/html");
  }

  await context.setOffline(true);
  const offlineResponse = await page.goto("/budgets", { waitUntil: "domcontentloaded" });
  expect(offlineResponse?.status()).toBe(200);

  // This smoke test verifies install metadata, cache population and offline HTML
  // routing. It does not claim that all scripts or editing flows work offline.
});
