import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const workerSource = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://mizan.example";
const key = (request) => typeof request === "string" ? new URL(request, origin).href : request.url;

function fakeWorker(onlineFetch = async () => { throw new TypeError("Offline"); }) {
  const handlers = {};
  const stores = new Map();
  const cached = (cacheName) => {
    if (!stores.has(cacheName)) stores.set(cacheName, new Map());
    const items = stores.get(cacheName);
    return {
      async addAll(urls) {
        for (const url of urls)
          items.set(key(url), new Response(url, { headers: { "Content-Type": url.endsWith(".svg") ? "image/svg+xml" : "text/html" } }));
      },
      async put(request, response) { items.set(key(request), response); },
      async match(request, options = {}) {
        const response = items.get(key(request));
        if (response?.headers.has("vary") && !options.ignoreVary && typeof request !== "string") return undefined;
        return response;
      },
    };
  };
  const caches = {
    open: async name => cached(name),
    keys: async () => Array.from(stores.keys()),
    delete: async name => stores.delete(name),
    match: async request => {
      for (const store of stores.values()) if (store.has(key(request))) return store.get(key(request));
    },
  };
  const self = {
    location: { origin },
    clients: { claim() {} },
    skipWaiting() {},
    addEventListener(name, fn) { handlers[name] = fn; },
  };
  vm.runInNewContext(workerSource, { self, caches, fetch: onlineFetch, URL, Response, Promise }, { filename: "sw.js" });
  async function run(name, request) {
    const waits = [];
    let promise;
    handlers[name]({ request, waitUntil(p) { waits.push(Promise.resolve(p)); }, respondWith(p) { promise = Promise.resolve(p); } });
    const response = promise ? await promise : undefined;
    await Promise.all(waits);
    return response;
  }
  function makeRequest(path, { mode = "cors", method = "GET", destination = "", headers = {} } = {}) {
    return { url: key(path), mode, method, destination, headers: new Headers(headers) };
  }
  return { stores, cached, run, makeRequest };
}

test("offline script never receives the home page as a JS fallback", async () => {
  const sw = fakeWorker();
  await sw.run("install");
  const response = await sw.run("fetch", sw.makeRequest("/assets/app.js", { destination: "script" }));
  assert.ok(!response || response.status === 503);
});

test("a navigation revalidates online and serves cached shell offline", async () => {
  let online = true;
  const sw = fakeWorker(async () => {
    if (!online) throw Error("Offline");
    return new Response("fresh html", { status: 200, headers: { "content-type": "text/html" } });
  });
  await sw.run("install");
  const req = sw.makeRequest("/budgets", { mode: "navigate" });
  assert.equal(await (await sw.run("fetch", req)).text(), "fresh html");
  online = false;
  assert.equal(await (await sw.run("fetch", req)).text(), "fresh html");
});

test("does not cache API responses or requests with sensitive headers", async () => {
  const sw = fakeWorker(async () => new Response("secret response"));
  await sw.run("install");
  await sw.run("fetch", sw.makeRequest("/api/records"));
  await sw.run("fetch", sw.makeRequest("/assets/test.js", { destination: "script", headers: { Authorization: "Bearer secret" } }));
  for (const items of sw.stores.values()) {
    assert.equal(items.has(origin + "/api/records"), false);
    assert.equal(items.has(origin + "/assets/test.js"), false);
  }
});

test("activation keeps caches belonging to other apps", async () => {
  const sw = fakeWorker();
  await sw.cached("other-app-cache").put("/other", new Response("keep"));
  await sw.cached("mizan-static-old").put("/", new Response("delete"));
  await sw.run("activate");
  assert.equal(sw.stores.has("other-app-cache"), true);
  assert.equal(sw.stores.has("mizan-static-old"), false);
});

test("offline navigation does not fake unrelated routes", async () => {
  const sw = fakeWorker();
  await sw.run("install");
  const res = await sw.run("fetch", sw.makeRequest("/api/no-page", { mode: "navigate" }));
  assert.ok(!res || res.status === 503);
});

test("previously fetched static assets stay available offline", async () => {
  let connected = true;
  const sw = fakeWorker(async () => {
    if (!connected) throw Error("Offline");
    return new Response("console.log('cached')", { headers: { "content-type": "text/javascript" } });
  });
  await sw.run("install");
  const req = sw.makeRequest("/assets/app-abc.js", { destination: "script" });
  assert.equal(await (await sw.run("fetch", req)).text(), "console.log('cached')");
  connected = false;
  assert.equal(await (await sw.run("fetch", req)).text(), "console.log('cached')");
});

test("private or no-store responses never enter static cache", async () => {
  const sw = fakeWorker(async () => new Response("confidential", { headers: { "cache-control": "private, no-store" } }));
  await sw.run("install");
  await sw.run("fetch", sw.makeRequest("/assets/private.js", { destination: "script" }));
  for (const items of sw.stores.values()) assert.equal(items.has(origin + "/assets/private.js"), false);
});

test("external, query-string and mutation requests are not intercepted", async () => {
  const sw = fakeWorker();
  await sw.run("install");
  assert.equal(await sw.run("fetch", sw.makeRequest("https://third-party.example/asset.js", { destination: "script" })), undefined);
  assert.equal(await sw.run("fetch", sw.makeRequest("/assets/app.js?v=secret", { destination: "script" })), undefined);
  assert.equal(await sw.run("fetch", sw.makeRequest("/assets/app.js", { method: "POST", destination: "script" })), undefined);
});

test("PWA manifest advertises installable PNG icons", async () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.display, "standalone");
  const icons = manifest.icons.filter((icon) => icon.type === "image/png");
  assert.ok(icons.some(icon => icon.sizes.includes("192x192")));
  assert.ok(icons.some(icon => icon.sizes.includes("512x512")));
  assert.ok(icons.some(icon => icon.purpose.includes("maskable")));
});

test("offline navigation handles Vinext Vary headers on cached HTML", async () => {
  const sw = fakeWorker();
  await sw.cached("mizan-static-v6").put("/budgets", new Response("cached html", { headers: { vary: "Accept, RSC, Next-Router-State-Tree", "content-type": "text/html" } }));
  const req = sw.makeRequest("/budgets", { mode: "navigate", headers: { Accept: "text/html" } });
  assert.equal(await (await sw.run("fetch", req)).text(), "cached html");
});
