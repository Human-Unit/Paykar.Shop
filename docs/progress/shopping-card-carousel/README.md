# Last order and My templates — reference refinement

Date: 2026-10-08

Scope: only the Last order and My templates blocks on `/my-shopping`. The supplied reference sets the composition; existing Paykar colors, theme, typography and real product imagery are retained.

| Block | Before | After |
| --- | --- | --- |
| Last order | Wide summary with a separate expandable history | Large, nearly square centered card, overlapping product photos, partially visible real neighboring orders, arrows and pagination dots |
| My templates | Static template grid | Square shopping cards in a horizontally scrollable row, overlapping product photos, bottom-aligned primary cart action and an edit menu |
| Actions | Existing repeat/save/view/edit/cart behavior | Same handlers and data, arranged to match the reference hierarchy |

Desktop order cards are 390 × 356 px (374 px high with longer Tajik content); template cards are 340 × 340 px. Small-screen cards grow vertically when translated copy needs room. No fake orders, templates or product photos are added to the application. With multiple real orders, the latest order starts in the center with earlier orders on either side. A single item has no fabricated neighbors or unnecessary carousel controls.

The header, shell, breadcrumbs, curated shopping sets and editor layouts are unchanged by this task. Existing homepage work in the worktree was preserved. No backend, API, database, dependency or storage-schema changes were made. The shared action components gained optional decorative icons; their business logic is unchanged.

## Evidence

- [Before — desktop](screenshots/before-1440-en-dark.png)
- [After — desktop](screenshots/after-1440-en-dark.png)
- [Order carousel — desktop](screenshots/orders-1440-en-dark.png)
- [Template carousel — desktop](screenshots/templates-1440-en-dark.png)
- [After — mobile](screenshots/after-390-en-dark.png)
- [Recorded browser assertions and responsive measurements](verification.json)

Screenshots use existing persisted orders and temporary personal templates in an isolated QA browser context. Template fixture names are test labels; product images and shopping previews come from the real API. No persistent order was created, and the user's browser storage was not modified.

## Commands actually executed

Frontend commands ran in `apps/web`:

| Command | Result |
| --- | --- |
| Targeted `npx prettier --write` | PASS |
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:shopping` | PASS — 6 tests, no skips |
| `npm run test:navigation` | PASS — 4 tests, no skips |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| Docker Compose production `build web` | PASS — final Linux production build includes the scroll-snap fix |
| Docker Compose `up -d --no-deps web` | PASS — frontend recreated; API and PostgreSQL retained |

The existing Node `MODULE_TYPELESS_PACKAGE_JSON` warning appeared during tests. It did not fail the checks. Final Docker status: frontend, API and PostgreSQL healthy.

## Browser verification

The in-app Browser had no connected browser. Automated verification **did run** using standalone Playwright Chromium against the production Docker frontend at `http://localhost:3000`.

Real API checks passed: repeat an existing order into cart, save it as a personal template, reload template persistence, bulk-add template products, open the editor, view an existing confirmation and reload it. Carousel arrows, dots, keyboard navigation, normal smooth motion, reduced motion, touch swipe, template edit-menu Escape/focus restoration and editor links passed.

Explicitly intercepted HTTP 503 checks passed: failed product-preview requests show an error and preserve the cart, removing interception restores successful adding, failed order loading shows Retry, and retry recovers against the real API. Single-item controls and absent-personal-data behavior passed; curated sets remain available. These error scenarios are intercepted tests, not claims about real provider failures.

The responsive matrix covers RU/TJ/EN × dark/light at 1440 and 390 px, plus RU/TJ dark at 320 px and RU dark at 1024 px: 15 cases. All had correct document language, no page horizontal overflow, no clipped action text and two visible neighboring order previews. No page JavaScript errors were recorded. Anchor screenshots were visually inspected.

Testing caught a template Previous-button boundary issue caused by native snapping four pixels away from the logical start. Track scroll padding was aligned. The final rebuilt production frontend was reloaded without injected styles: Next moved the row; Previous returned to `scrollLeft = 0` and became disabled.

No remaining verification failures were observed in this scope. No commit or push was performed.
