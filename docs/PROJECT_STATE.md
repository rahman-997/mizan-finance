# Project state: Mizan Finance

Updated: 2026-11-26 14:55 (Europe/Istanbul). Written by the autonomous engineering worker.

- Work branch for this log: `docs/state-log-20261126`. Source branch under test: `main` (merge of PR #19).

## Completed (merged, main CI green)
- PR #15 security lockfile, #13 category aggregation safety, #16 backup preflight and recurring-rule size limit, #18 stale "SEPTEMBER PLAN" label now "MONTHLY OVERVIEW".
- PR #19 mobile fix: at 390px the sidebar "OTP UI preview" link sat in the header row (scrollWidth 438 vs clientWidth 390) and pushed the language and theme buttons off-screen; the floating OTP pill was covered by the "+" button. Link hidden in the mobile header, pill moved to the opposite corner (mirrored in RTL), spacing tightened under 340px. New test `tests/mobile-header-fit.test.mjs` (fails without the CSS, passes with it). Main CI run 190 success.

## Tests actually run (local build of main, synthetic seed data, headless Chrome)
- Width sweep 320/360/375/390/412 on 4 routes: no horizontal overflow. Real click on theme toggle flips dark mode; language toggle gives dir=rtl, no overflow (390 and 1440).
- Transactions: search, type filter (Income 4 rows), category filter (Food 1 row), combined filter, clear filters, sort (highest, lowest, oldest first), no-match empty state, add, reload persistence, delete.
- Insights and overview values against hand-computed seed values: Nov expenses 1,484.40, income 4,920, net 3,435.60, change vs Oct +632%, total balance 11,411.65, savings rate 70%, budget used 52%. All match.
- Budget edit Food 500 -> 600: card, total (2,930) and available (1,445.60) update and persist across reload.
- Backup: export is valid JSON (12 transactions); restore of a modified file through the file input and confirm dialog applies (11 tx, Food 777); a structurally invalid file and a non-JSON file are rejected with "Invalid backup or file over 5 MB. Your data has not changed."; restoring the original export returns 12 tx and Food 600.
- Not run: file over 5 MB, recurring-rule restore details, native device testing.

## Deployment
- The public demo https://mizan-finance-rahman-997.netlify.app is a stale older build (old label, mobile header defect). Its Netlify owner account was not found: checked eng.rahman771, abdulrahmanhajjar77 and abdulrahmanhajar9 teams (no "mizan" project) and the GitHub rahman-997 authorized apps (no Netlify). Not redeployed; a deploy needs the owner account or a new target decided by the user.
- The portfolio cover for Mizan is a labeled local-build capture of main ed4e621, not the live demo.

## Open items
- Older open PRs (#14, #12, #11, #7, #5, #4, #3) were not qualified in this pass.
- Next action: user names the Netlify account that owns the demo (or approves a new target), then redeploy main.
