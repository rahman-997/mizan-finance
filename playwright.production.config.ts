import { defineConfig } from "@playwright/test";

// This deliberately targets built output, not Vite's HMR development server.
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/pwa-production.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 130_000,
  use: {
    baseURL: "http://127.0.0.1:4183",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
});
