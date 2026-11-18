# Mizan Finance V16 — category aggregation safety, Draft only

Base: `integration/mizan-v16-otp-main-20261112` / Draft PR #12 at `cdbd247a3446b86ff7abddb15bacdb6b977a7a11`.
New branch: `fix/mizan-v16-safe-category-aggregation-20261119`.

## Why this patch exists
- The V16 integration branch was still using `{}` for expense-category accumulation. User-defined categories named `__proto__`, `constructor` or `toString` can collide with inherited properties and corrupt category amounts.
- The proven fix already exists separately in Draft PR #13 targeting main. This branch re-applies the *same* safe null-prototype accumulator to the V16 integration candidate, without merging PRs.

## Changes / verification
- `Object.create(null)` for category grouping; no database, billing, API or UI changes.
- Added targeted test to V16's existing `tests/finance-utils.test.mjs`.
- Executed the exact proposed V16 finance-utils source using an isolated V8 evaluator: 4 prototype-like sample items aggregate to 30 / 12 / 7 and total expenses remain 49 — PASS.
- Complete `node --test`, Next.js/Vinext build, integration, financial edge-case QA and browser E2E remain **not verified**, no deployment or paid Actions run.
- Reconcile this duplicate one-line fix with PR #13 during eventual branch integration; do not merge blindly. **NO-GO** until full release QA.
