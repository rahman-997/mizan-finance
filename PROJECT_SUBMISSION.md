# Mizan Finance — Final Project Submission

## Product summary

Mizan Finance is a private-by-design personal finance planner for students, early-career professionals, and anyone who wants a clear monthly money routine without connecting a bank account. It solves the problem of scattered expense notes by combining a transaction ledger, budget limits, and visual insights in one responsive application.

## Target users

- People who want a simple manual finance tracker.
- Arabic and English speakers who prefer a bilingual interface.
- Privacy-conscious users who want their data stored on their own device.

## Main user actions

- Review the financial overview and six-month cash-flow trend.
- Search, filter, sort, open, add, edit, and delete transactions.
- Set monthly spending limits and monitor category progress.
- Review spending distribution and month-over-month signals.
- Switch between English and Arabic, including RTL layout.
- Switch between light and dark themes.

## Screens

1. Overview dashboard
2. Transactions ledger and details
3. Monthly budgets
4. Insights and data visualizations
5. Not-found and application error states

## Data requirements

The application stores transactions and category budgets in browser `localStorage`. The included seed data makes every major state visible on first use. All calculations run from the current transaction collection, so adding, editing, or deleting data immediately updates the dashboard, budget progress, and insights.

## Student-chosen feature: bilingual localization

I chose English/Arabic localization because personal finance tools are most useful when users can read important labels and amounts in their preferred language. The feature also adds real engineering value: the document language and direction change at runtime, RTL layouts are supported, and number/date formatting follows the selected locale.

## Architecture

- `app/` defines the route entry points, shared metadata, and error boundaries.
- `features/finance/` owns the domain types, seed data, persistence, locale, and application shell.
- `features/dashboard/`, `features/transactions/`, `features/budgets/`, and `features/insights/` keep screen responsibilities separate.
- `components/ui/` provides accessible interface primitives.
- `lib/finance-utils.mjs` contains reusable pure calculations shared by the UI and automated tests.
- `tests/` verifies behavior such as summaries, filtering, sorting, grouping, and date-range selection.

## Important states

- Loading: skeleton layout while local data is restored.
- Success: toast feedback after create, update, delete, budget update, and reset operations.
- Empty: a recoverable no-results state for transaction filters.
- Error: storage recovery notice plus a route-level application error boundary.

## AI prompts used

### 1. Planning

> Analyze the final-project requirements for a privacy-first personal finance frontend. Propose the smallest complete product scope, feature boundaries, state ownership, routes, and data flow. Explain trade-offs and do not write implementation code yet.

### 2. Implementation review

> Review the transaction and budget implementation for unclear responsibilities, duplicated calculations, incorrect state placement, accessibility gaps, weak validation, and maintainability risks. Preserve working behavior and recommend only changes that reduce real risk.

### 3. Testing and debugging

> The expected behavior is that search, type, category, and sort filters work together without mutating the original transactions. Review the filter utility and its automated tests, explain likely edge cases, then suggest the smallest reliable fix for any failure.

## Reflection

**What was the most difficult technical decision?**
Choosing state ownership. Transaction and budget data must be shared by every screen and persist between visits, while filter and dialog state is temporary and belongs to the screen that uses it. A small context provider plus local screen state kept that boundary clear without adding a global-state library.

**Where did AI help the most?**
AI was most helpful when checking the complete user journey across requirements: validation, loading and recovery states, responsive behavior, accessibility, and test coverage.

**Which AI suggestion did you reject or modify, and why?**
I rejected adding authentication and a remote database. They would increase scope and privacy risk without improving the core manual-tracking use case. Device-local persistence is simpler and directly supports the product promise.

**What would you improve with more time?**
I would add encrypted cross-device sync, recurring transactions, CSV import/export, custom categories, and more comprehensive component-level accessibility tests.

## Submission links

- Repository URL: https://github.com/rahman-997/mizan-finance
- Live deployed URL: pending the first successful Cloudflare Workers deployment.
