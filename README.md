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
