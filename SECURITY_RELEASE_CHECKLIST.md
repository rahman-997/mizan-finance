# V16 security and offline release checklist (October 28, 2026)

This applies only to the unmerged `feat/dashboard-v16` draft branch. Do not promote it to `main` or deploy without explicit approval.

## Verified automated checks

- `npm run ci`: lint, TypeScript, finance/PWA unit tests, production build and UI contracts.
- `npm audit --audit-level=moderate`: blocks known moderate-or-higher advisories across runtime and development/build dependencies. The expanded gate is part of the tooling remediation follow-up.
- Semgrep read-only scan, plus Chromium tests for Arabic/English, RTL, dark mode, responsive layouts, privacy masking, finance backup/restore and multi-tab handling.
- Chromium offline navigation: previously cached, known HTML routes return 200 while offline.
- Chromium disconnected editing test: a **previously loaded and hydrated transactions page** adds/edits a record using localStorage while the browser context is offline. After reconnection and reload, the updated value persists.

## Open release blockers

1. **Dependency remediation requires browser verification:** The October 29 follow-up updates Vinext to 1.3.1, the Cloudflare Vite plugin to 1.66.0, Wrangler to 4.154.0, the RSC plugin to 0.5.38 and ESLint's Next config to 16.4.3. It removes unused Drizzle dependencies (the application has no database imports or migration configuration) and pins transitive `fflate` to its patched 0.7.5 release. Full local npm audit now reports **0 advisories**, down from 14. The production build, lint, types, finance/PWA and UI tests passed locally; browser tests must also pass on this new lockfile before promotion. No forced downgrade or advisory suppression was used. Audit results are a point-in-time check, not a guarantee against future advisories.
2. **Cold offline startup now verified in a local production build using Chromium, not on physical Android.** The [production PWA workflow](.github/workflows/production-pwa.yml) builds and runs a local production preview (no deployment), warms hashed production assets with the service worker, disconnects the browser, cold-reloads the document, proves React hydration by opening and submitting the real form, edits an entry, cold-reloads offline again, and verifies persistence after reconnect. The initial [production Chromium run](https://github.com/rahman-997/mizan-finance/actions/runs/40785228522) passed. This is a *warm-installed* offline restart, not proof of the first ever launch without network. Device-specific Android installation and upgrade remain unverified.
3. **Android install remains unverified on hardware.** Icons and manifest are validated in Chromium, but test install, app upgrade, screen reader, airplane mode, quota exhaustion and data backup on a device before release.
4. **Local data is not encrypted.** Financial entries and JSON backup files are stored in readable browser-local data. Confirm this limitation in release notes and avoid adding bank or payment connections without a separate review.
5. **Recheck the full dependency audit before release.** Keep the expanded build/development audit gate enabled; do not revert to a production-only gate if a future advisory appears.

## Mitigations already in the draft

- The local Vite dev server binds to `127.0.0.1` by default, reducing exposure to other network devices. Exposing it intentionally with `--host` requires separate consideration.
- Cache only eligible same-origin app assets/pages; do not cache API/auth/query-string or private/no-store responses, and do not return HTML in place of JavaScript.
- Cache cleanup only targets Mizan's own service-worker cache prefix.
- No auto-merge, no production storage changes, and no deployment.

**Interpretation:** The audited follow-up lockfile has no currently reported advisories. A built production preview now passed a controlled Chromium cold-offline reload and editing test, including persistence. This does not establish that a real Android install, platform update, or first-use offline launch works.
