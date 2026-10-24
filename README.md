# Mizan Finance

Mizan is a bilingual, privacy-first personal finance planner built as a complete frontend application. It helps users record transactions, set category budgets, and understand spending patterns without connecting a bank account.

## Features

- Responsive dashboard for desktop, tablet, and mobile
- Transaction search, filtering, sorting, details, creation, editing, and deletion
- Validated transaction and budget forms with clear feedback
- Monthly category budgets and progress tracking
- Six-month cash-flow and category spending charts
- Persistent browser storage with loading, success, empty, and recoverable error states
- Installable PWA with offline app-shell caching
- English/Arabic localization with RTL support
- Light and dark themes
- Accessible semantics, labels, focus states, keyboard controls, and reduced-motion support
- JSON backup export and validated restore with replacement confirmation
- Monthly expense rules, with due entries added on app opening and month-end handling
- Automated behavior tests

## Routes

- `/` — financial overview
- `/transactions` — searchable transaction ledger
- `/budgets` — monthly category limits
- `/insights` — spending and cash-flow analysis
- Unknown routes — custom not-found state

## Project links

- Repository: https://github.com/rahman-997/mizan-finance
- Live demo: https://mizan-finance-rahman-997.netlify.app

## Run locally

Requirements: Node.js 22.13 or newer. The npm scripts are cross-platform and work in PowerShell, Command Prompt, macOS, and Linux.

```bash
npm ci
npm run dev
```

Open the local address shown in the terminal.

## Validate, test, and build

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:ui
```

Run the complete local quality gate with:

```bash
npm run ci
```

The core finance behavior tests are intentionally independent from the production build, while the UI contract tests run after `dist/` exists.

## Deploy to Cloudflare Workers

Authenticate Wrangler once with your Cloudflare account, then deploy with:

```bash
npm run deploy
```

The deploy command performs a verified production build first and then deploys the Cloudflare Worker output.

## Architecture

The application uses Next-compatible file routing through Vinext, React and TypeScript for the UI, React Context for shared finance data, local component state for filters and dialogs, Zod plus React Hook Form for validation, Recharts for data visualization, and browser storage for persistence. Pure calculation helpers live in `lib/finance-utils.mjs` and are exercised by Node's built-in test runner.

See [PROJECT_SUBMISSION.md](./PROJECT_SUBMISSION.md) for the complete product definition, AI prompts, architecture explanation, chosen feature rationale, and reflection answers.

## Screenshots

### Desktop

![Mizan Finance desktop dashboard](screenshots/mizan-desktop.jpg)

### Mobile

![Mizan Finance mobile dashboard](screenshots/mizan-mobile.jpg)

## Privacy

Mizan does not transmit financial entries to a server. User-created data remains in the current browser's local storage.

## Author

Designed and developed by **[Abdulrahman Hajar](https://github.com/rahman-997)** — Frontend Engineer and Full-Stack Developer in Istanbul, Türkiye.

## License

MIT

### Backup and monthly expenses
Use the upload icon beside Export to preview and restore a JSON backup (up to 5 MB). Existing exports remain supported. Restore replaces this browser’s entries and budgets only after confirmation and a successful local save. Export first to retain the current data.

The repeat icon manages monthly expense rules. These create local records, never payments. Due entries are generated when the app opens, up to 120 occurrences per rule per opening and 10,000 entries overall. Short months use their last day and the original day is retained for later months. Stopping a rule keeps previous entries.

### Browser regression checks
Run `npm ci`, `npx playwright install chromium`, then `npm run test:browser`.
The separate Node-based Vinext test server exercises device-local flows without
Cloudflare bindings; production configuration is unchanged. Tests cover Arabic
and English restore confirmation/cancellation, storage failure, entry/rule limits,
and toolbar viewport bounds at 320, 360, 390 and 768 px. These checks supplement
`npm run ci`; they do not replace visual inspection, keyboard/focus testing,
200% zoom, or mobile keyboard testing.


## Integrated V16 development build

The V16 dashboard and the previous backup/monthly-expense and read-only security work are **integrated only on the `feat/dashboard-v16` draft branch**. They are not part of the `main` branch or the public deployment until separately approved.

- Responsive blue-accented dashboard, with recorded income, expenses, balance and savings rate.
- A 6/12-month trend selector, categorized spending chart and budget progress.
- English and Arabic (RTL), dark/light appearance and an on-dashboard amount-hiding control.
- Validated local JSON backup restoration with an explicit replace confirmation; monthly recurring **records**, not payment instructions.
- Atomic in-memory finance updates that prevent repeated edits in one React render from dropping entries.
- Cross-tab write conflict detection: another tab's changes pause this tab's saves instead of silently overwriting them. Export this tab first if necessary, then use **Load latest records**.
- Read-only Semgrep security scan and Dependabot PRs with no automatic merging.

**Data handling:** Browser localStorage is not encrypted storage. Anyone with access to the same browser profile, its local data or an exported JSON backup may be able to read the finance records. This demo is not connected to banks or payment systems. Keep backups private, and do not depend on a single device as the only copy of important records.

### Verification

```bash
npm ci
npm run ci
npx playwright install chromium
npm run test:browser
```

The GitHub browser quality workflow additionally runs `node tests/dashboard-browser.mjs` to check real Chromium rendering at 320, 360, 390, 768 and 1280 pixels with both languages. Its screenshots and results are stored as workflow artifacts. No live deployment is required for these tests.
