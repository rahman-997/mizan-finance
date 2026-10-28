# V16 security and offline release checklist (October 28, 2026)

This applies only to the unmerged `feat/dashboard-v16` draft branch. Do not promote it to `main` or deploy without explicit approval.

## Verified automated checks

- `npm run ci`: lint, TypeScript, finance/PWA unit tests, production build and UI contracts.
- `npm audit --omit=dev --audit-level=moderate`: blocks known moderate-or-higher production dependency advisories. This gate passed in GitHub CI.
- Semgrep read-only scan, plus Chromium tests for Arabic/English, RTL, dark mode, responsive layouts, privacy masking, finance backup/restore and multi-tab handling.
- Chromium offline navigation: previously cached, known HTML routes return 200 while offline.
- Chromium disconnected editing test: a **previously loaded and hydrated transactions page** adds/edits a record using localStorage while the browser context is offline. After reconnection and reload, the updated value persists.

## Open release blockers

1. **Remaining dependency advisories:** Full npm audit reported **14 (0 critical, 6 high, 8 moderate)** on October 28, 2026. The following are in the development/build dependency tree, not the production-only audit:
   - High: `vinext`, `image-size`, `miniflare`, `sharp`, `undici`, `ws`.
   - Moderate: `@cloudflare/vite-plugin`, `@esbuild-kit/core-utils`, `@esbuild-kit/esm-loader`, `@vercel/og`, `drizzle-kit`, `esbuild`, `satori`, `wrangler`.
   - The audit's automated fixes propose potentially breaking major changes or old versions. Do not use `npm audit fix --force`, blindly suppress advisories, or downgrade the Cloudflare/Vinext stack without full compatibility checks and a freshly audited lockfile.
2. **Cold offline reopening is not yet demonstrated.** In the Vite **development** browser harness, offline HTML reopens, but React does not hydrate after an offline reload because development-only virtual/HMR modules require networking. This result does not prove behavior of a built production PWA. Test a real production build under a controlled offline browser and a physical Android install before claiming cold offline support.
3. **Android install remains unverified on hardware.** Icons and manifest are validated in Chromium, but test install, app upgrade, screen reader, airplane mode, quota exhaustion and data backup on a device before release.
4. **Local data is not encrypted.** Financial entries and JSON backup files are stored in readable browser-local data. Confirm this limitation in release notes and avoid adding bank or payment connections without a separate review.
5. **Remaining dev/build advisories need a conscious disposition** (patched version + tests, isolated tool, or explicit documented exception) before release approval.

## Mitigations already in the draft

- The local Vite dev server binds to `127.0.0.1` by default, reducing exposure to other network devices. Exposing it intentionally with `--host` requires separate consideration.
- Cache only eligible same-origin app assets/pages; do not cache API/auth/query-string or private/no-store responses, and do not return HTML in place of JavaScript.
- Cache cleanup only targets Mizan's own service-worker cache prefix.
- No auto-merge, no production storage changes, and no deployment.

**Interpretation:** Green CI and passing disconnected editing are valuable checks, but are **not** a claim that all security advisories are eliminated or that an already-closed PWA will fully initialize while offline.
