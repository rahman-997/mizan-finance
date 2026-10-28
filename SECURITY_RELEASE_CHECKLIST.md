# V16 security and offline release checklist (October 29, 2026)

This applies only to the unmerged `feat/dashboard-v16` draft branch. Do not promote it to `main` or deploy without explicit approval.

## Verified automated checks

- `npm run ci`: lint, TypeScript, finance/PWA unit tests, production build and UI contracts.
- `npm audit --audit-level=moderate`: blocks known moderate-or-higher advisories across runtime and development/build dependencies. The expanded gate is part of the tooling remediation follow-up.
- Semgrep read-only scan, plus Chromium tests for Arabic/English, RTL, dark mode, responsive layouts, privacy masking, finance backup/restore and multi-tab handling.
- Chromium offline navigation: previously cached, known HTML routes return 200 while offline.
- Chromium disconnected editing test: a **previously loaded and hydrated transactions page** adds/edits a record using localStorage while the browser context is offline. After reconnection and reload, the updated value persists.
- Production cold offline test: build the real Workers app and serve it locally with `vite preview`; warm `/transactions` under service-worker control, close Chromium, reopen its persisted profile with networking disabled, create/edit a transaction, close it again and verify the edit after another offline browser restart. This passed in GitHub browser run `40770700385`. It covers the warmed transactions route, not every never-visited route or physical-device behavior.

## Release status and remaining checks

1. **Dependency remediation verified:** The October 29 follow-up updates Vinext to 1.3.1, the Cloudflare Vite plugin to 1.66.0, Wrangler to 4.154.0, the RSC plugin to 0.5.38 and ESLint's Next config to 16.4.3. It removes unused Drizzle dependencies (the application has no database imports or migration configuration) and pins transitive `fflate` to its patched 0.7.5 release. Full npm audit reports **0 advisories**, down from 14. Production build, lint, types, finance/PWA and UI tests passed, as did 10 dashboard and 19 browser regression scenarios in run `40769628970`. No forced downgrade or advisory suppression was used. Audit results are a point-in-time check, not a guarantee against future advisories.
2. **Production cold offline reopening verified in Chromium:** The persisted-profile test above demonstrates hydration and editing after a full browser restart for the warmed transactions route. Development-only virtual/HMR scripts still require networking; the production test uses compiled assets instead. Physical Android behavior remains unverified.
3. **Android install remains unverified on hardware.** Icons and manifest are validated in Chromium, but test install, app upgrade, screen reader, airplane mode, quota exhaustion and data backup on a device before release.
4. **Local data is not encrypted.** Financial entries and JSON backup files are stored in readable browser-local data. Confirm this limitation in release notes and avoid adding bank or payment connections without a separate review.
5. **Recheck the full dependency audit before release.** Keep the expanded build/development audit gate enabled; do not revert to a production-only gate if a future advisory appears.

## Mitigations already in the draft

- The local Vite dev server binds to `127.0.0.1` by default, reducing exposure to other network devices. Exposing it intentionally with `--host` requires separate consideration.
- Cache only eligible same-origin app assets/pages; do not cache API/auth/query-string or private/no-store responses, and do not return HTML in place of JavaScript.
- Cache cleanup only targets Mizan's own service-worker cache prefix.
- No auto-merge, no production storage changes, and no deployment.

**Interpretation:** The audited follow-up lockfile has no currently reported advisories. Production Chromium proves offline reopening and editing for the warmed transactions route. It does not establish physical Android installation, every offline route, or compatibility with every browser.
