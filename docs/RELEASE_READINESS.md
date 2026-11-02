# Mizan Finance: Release readiness and OTP handoff

Last prepared: 2026-11-02. This document is the handoff for the current browser-local finance planner and the **visual-only OTP preview**.

## 1. Verified engineering state

- The `/verify` route is part of `main`, with a reusable `GlassyOtp` component.
- OTP preview UI: six digits, keyboard/paste support, Arabic/Persian digit normalization, English, Arabic RTL and Turkish copy, error/success/replay states, responsive layout and reduced-motion styling.
- GitHub Actions CI validates ESLint, TypeScript, 14 behavior tests, production build and 6 component tests.
- The browser smoke check mounts **the same React OTP component** in an isolated Vite QA harness using Chrome DevTools. It tests desktop/mobile layout, six input slots, translations, incorrect/correct preview values and replay. Screenshots are attached to the CI run as an artifact.
- **Coverage limit:** the Vite harness is not an end-to-end test of a deployed Vinext/Cloudflare route; a live deployment smoke test is required before marking hosting production-ready.

Latest PRs to consult: [#8](https://github.com/rahman-997/mizan-finance/pull/8) for the UI and [#9](https://github.com/rahman-997/mizan-finance/pull/9) for the QA harness/RTL fix.

## 2. Security and product boundaries

**Mizan Finance currently has NO real sign-in system.**

- The UI preview displays an openly documented sample code. This code is neither a secret nor an authorization mechanism.
- The preview sends no SMS, email or OTP request and creates no server-side session.
- Transactions, budgets and backups are kept in browser-local storage. OTP completion does not encrypt, synchronize or gate access to those records. Do not market the preview as financial-account protection.
- Do not attach the preview's `verifyPreviewOtp` helper to any real account, financial transaction, production login or payment flow.
- Do not put API credentials, SMS vendor keys or production OTP secrets in public Git files, front-end bundles or browser storage.

A real authentication release is a **separate architecture project**, requiring explicit provider/backend selection, account and data model design, secure storage/sync decisions, abuse prevention, privacy controls, costs and an approved threat-model review.

At minimum, that future project needs server-side challenge issuance and verification, appropriate expiry and attempt/rate limits, secure session cookies, CSRF protection where applicable, resend throttling, safe error messages, observability without recording OTP values, and tested recovery/accessibility flows. None of this is currently implemented.

## 3. Hosting decision: Cloudflare versus Netlify

The current application build is based on **Vinext + Cloudflare Workers**, as seen in `vite.config.ts`, `wrangler.jsonc` and the existing `npm run deploy` command. Cloudflare Workers is the **preferred existing deployment architecture** to validate, not an assertion that the application is already live there.

The committed `netlify.toml` currently publishes `dist/client` and rewrites all routes to `/index.html`. **Do not assume this static Netlify configuration correctly serves a Vinext server-rendered/RSC application.** Before using Netlify for production, implement and verify a compatible deployment adapter/runtime, all routes, SSR/server assets and caching behavior. The README's historical Netlify demo URL has **not been verified** as the current production site.

Never silently create a new hosted project, enable paid add-ons or change DNS. Hosting publication requires an explicit owner decision about provider, environment, domain and permission to publish.

## 4. Preflight checklist (run before owner-approved publication)

- [ ] Confirm the intended host, connected account, project ownership, production domain and deployment permissions.
- [ ] Verify whether changes to the production branch cause automatic deployment. Disable/skip automatic publication until the release has approval.
- [ ] Confirm any cost or quota implications in the hosting provider account.
- [ ] On a clean checkout with Node.js >=22.13, run `npm ci`.
- [ ] Run `npm run ci` and confirm all stages pass on the precise release SHA.
- [ ] Inspect the latest Chrome screenshot artifact for desktop English, mobile English, mobile Arabic (including correct RTL numbers/connected text), mobile Arabic success and mobile Turkish.
- [ ] On the selected deployment runtime, test `/`, `/transactions`, `/budgets`, `/insights` and `/verify` directly (including full refresh and deep links), plus unknown-route behavior.
- [ ] Confirm browser-local finance data persists through reload and that export/import flows work without a server.
- [ ] Test mobile widths around 320 and 390px, focus/keyboard accessibility, Arabic RTL, light/dark navigation and reduced-motion mode.
- [ ] Ensure `/verify` clearly communicates its status as **a visual demo, not real authentication**.
- [ ] Verify PWA, service worker caches, and rollback behavior after deploy.
- [ ] Record the release commit SHA, deployment URL and result of live smoke tests.

## 5. Cloudflare Workers release procedure (only after explicit approval)

```bash
npm ci
npm run ci
# Confirm account/environment and the expected domain in your Cloudflare workspace.
# This next command publishes. DO NOT run until the release is explicitly approved:
npm run deploy
```

The repository deploy command performs a build before invoking Wrangler deployment. Wrangler authentication and access to the intended Cloudflare account must be established through the owner's account, and a release operator must inspect the actual output. Run all live-route checks in section 4 after deployment; a successful build alone is not evidence of a working public site.

## 6. Rollback and privacy

- Preserve the pre-release deployment identifier and the previous working Git SHA.
- If the live smoke check fails, use the hosting provider's verified rollback controls to restore the previous good deployment; do not assume a Git revert instantly restores a hosted site.
- Confirm cache and service-worker behavior after rollback.
- Finance data is browser-local: **never** overwrite users' browser storage as part of an OTP UI or deployment experiment. Encourage a JSON backup before browser reset/migration.
- Avoid user secrets, OTP values, phone numbers and financial records in CI screenshots or logs.

## 7. Readiness decision

| Capability | State |
| --- | --- |
| Front-end finance planner | Built and CI tested |
| Glass OTP UI preview | Built and CI tested |
| OTP component browser interactions | Chrome smoke-tested in isolated harness |
| Real account login / SMS OTP | **Not implemented** |
| Live deployment and public-route smoke tests | **Not verified** |
| Provider, billing, domain and permission to publish | **Owner decision required** |

**Release gate:** Do not call the full solution production-ready until the host is verified and the live checks pass. The OTP interface may be presented as a **design preview** only until a separate secure authentication backend exists.
