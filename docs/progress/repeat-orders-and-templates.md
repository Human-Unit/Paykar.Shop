# Repeat orders, shopping templates and header utilities

Verified locally: 2026-10-07. **IMPLEMENTATION STATUS — COMPLETE**.

## Branch and scope

Worktree: `D:\Workshop\Paykar\Test_Task_Paykar_Shop-main`.
Branch: `feat/repeat-orders-and-templates`, created from the freshly fetched `origin/main` at `0a2e471`. The worktree was clean before branching. No commits, pushes or merges were made. The separate order-journey and theme-wave feature branches were not integrated or modified. Their additions are not part of this branch; the phone and preference implementation already in main remain intact.

The stack remains Next.js/TypeScript/App Router/Framer Motion, FastAPI/SQLAlchemy/Pydantic, PostgreSQL/Alembic and Docker Compose. No new dependency, authentication, infrastructure, payment provider or recommendation system.

## Behavior

- `/my-shopping` groups actual order history, personal templates and curated baskets. The burger menu provides its entry point; the homepage shows three compact curated cards after early product discovery.
- Guest history stores only up to 50 unique order UUID references in `paykar-order-history-v1`. Order cards load existing `GET /api/v1/orders/{id}` records; they show date, original total, line count, status and view/repeat/save actions. There is no history table, copied order snapshot or public order-list endpoint.
- Successful checkout remembers the UUID after the existing success-only cart clear. Opening a valid confirmation also remembers its capability URL. Old orders appear after opening their saved confirmation links. Failed checkout never records an order.
- Personal templates use `paykar-shopping-templates-v1`, with a version-1 envelope and validated IDs, names, dates and integer quantities. Limits: 20 templates, 48 lines, 1–99 per line. They include created/updated dates and product-name hints, without authoritative stored prices.
- Create, rename, edit product lines/quantities, confirmed delete, save current cart, save an actual confirmed order and add all are implemented. Storage failure falls back to the current tab and displays a localized persistence warning. Unavailable references remain visible until explicitly removed; malformed storage references are filtered safely.
- Repeat and add-all POST current IDs/quantities to the shared preview API. Active products use current catalog prices and stock; missing/inactive/empty products are skipped. The cart provider atomically merges valid lines with existing quantities, respecting the existing 48-line/99-unit limits and remaining stock. The result reports units added and unavailable, missing, quantity-limited and capacity-limited lines.
- No historical price, quantity, total or status is rewritten. Current price estimates exclude delivery and are checked again at checkout.
- Desktop header order is Logo → Search → Saved → Cart → Language → Theme → Menu. Secondary utilities have a quiet separator. At ≤768px language/theme are in the existing dialog; Saved/Cart stay visible in separate 44px cells with compact count badges. Sticky/search/navigation logic remains.
- All new store-authored text has RU/TJ/EN translations. Personal names remain user-entered. Real labels, buttons, focus behavior, empty/error/loading states and existing reduced-motion behavior are reused.

## APIs and persistence decisions

Added:

```text
POST /api/v1/shopping/preview
GET  /api/v1/shopping/templates
GET  /api/v1/shopping/templates/{template_id}
```

The preview validates distinct positive IDs and integer quantities, then returns current products, requested/available quantities and available/unavailable/missing status. It performs no order mutation or stock reservation. Existing order, delivery, payment and product APIs retain their contracts.

**No migrations or new tables.** There is no authenticated guest identity beyond existing unguessable order links. Personal templates stay on the device; manually curated definitions are version-controlled JSON. The API resolves their slugs to current PostgreSQL IDs/products. The existing seed transaction rejects unknown slugs; repeated seed runs remain idempotent and do not reset stock. Alembic remains the only schema authority.

## Curated data

Definitions: `db/seed/shopping_templates.json`.

| Basket | Real seed product slugs and quantities |
| --- | --- |
| Family | wheat-bread ×2, milk ×2, potatoes ×1, apples-red ×1, black-tea ×1, napkins ×1 |
| Breakfast | wheat-bread ×1, butter ×1, cheese ×1, milk ×1, coffee ×1 |
| Fruit and vegetables | carrots ×1, cucumbers ×1, apples-red ×2, bananas ×1, yogurt ×2, water ×2 |
| Guests | apple-juice ×2, black-tea ×1, oat-cookies ×2, milk-chocolate ×1, wafers ×1 |
| Weekly essentials | milk ×2, rye-bread ×2, potatoes ×2, cheese ×1, dish-soap ×1, trash-bags ×1 |

No baby products exist in the current seed catalog; a fruit/vegetable basket was used instead. There are no diet/health claims or invented products. This merchandising is separate from existing manual product connections.

## Files changed

Frontend:

- `src/app/my-shopping/page.tsx`, `src/app/my-shopping/templates/[id]/page.tsx`.
- `src/components/my-shopping.tsx`, `my-shopping.module.css`: management, history, editor, preview, add/save actions and compact discovery.
- `src/lib/shopping.ts`, `shopping-storage.ts`: validated models/storage and pure stock-aware merging.
- `src/context/cart.tsx`: additive bulk method through existing persistence/notice flow.
- `src/components/shell.tsx`, `site-navigation.tsx`, `src/styles/chrome.css`: utility grouping/mobile controls and shopping entry.
- `src/components/home.tsx`, `cart-page.tsx`, `order-confirmation.tsx`: compact feature entry/actions.
- `src/components/checkout.tsx`: two-line import/successful UUID registration only.
- `src/lib/translations.json`, `tests/shopping.test.mjs`, `package.json` (test script only).
- `src/components/saved-items-page.tsx`, `src/context/saved-items.tsx`: formatting only to fix inherited format-check failures.

Backend/data:

- `apps/api/app/api/routes/shopping.py`, `app/schemas/shopping.py`, `app/services/shopping_service.py`, `app/api/router.py`.
- `apps/api/tests/test_shopping.py`.
- `db/seed/shopping_templates.json`, `db/seed/seed.py`.
- README and this evidence directory.

## Commands actually executed

From `apps/web`:

```powershell
npm run lint
npm run format:check
npm run typecheck
npm run build
npm run test:catalog
npm run test:shopping
```

All PASS. Production build generated 22 static/prerendered pages plus the dynamic routes. Catalog tests: **13 passed**. Shopping tests: **6 passed** (storage validation/caps, UUID history, partial/stock-aware merging, cart capacity and immutable inputs). No TypeScript suppression or new testing framework.

The local Compose project uses the existing ignored environment file from the other checkout. Prefix used below:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env
```

With that prefix, actually ran:

```powershell
build api
up -d postgres
run --rm --no-deps api alembic upgrade head
run --rm --no-deps -e POSTGRES_DB=paykar_test api alembic upgrade head
run --rm --no-deps -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
run --rm --no-deps api ruff check .
run --rm --no-deps api ruff format --check .
run --rm --no-deps api ruff check /seed/seed.py
run --rm --no-deps api ruff format --check /seed/seed.py
run --rm --no-deps api python /seed/seed.py
up --build -d --no-deps api web
config --quiet
```

All final checks PASS. Backend tests: **137 passed, zero skips** against the separately migrated `paykar_test`, never destructive tests on the demo DB. New integration tests verify current price after changing a product in the test DB, stock adjustments, inactive/missing/empty items, unchanged historical order, invalid quantities/duplicates, curated listing/detail, real seed references and unknown-slug rejection. Ruff also checked the seed script. Repeated seed runs returned five templates, seven categories, 40 products and 34 connections without resetting stock.

Earlier development checks mounted the current `apps/api` source into the same Python 3.12 image before rebuilding it. The final pytest/Ruff checks ran against the rebuilt image without a source mount.

## Browser acceptance

The in-app Browser connection was unavailable (no connected browsers). **No in-app Browser or user-performed manual acceptance is claimed.** Standalone Playwright drove real Chrome **154.0.8037.98** against the production Docker web/API. Tests used isolated contexts, closed afterward, preserving the user's browser cart.

Results: [browser-acceptance.json](repeat-shopping/browser-acceptance.json). Screenshots: [screenshots](repeat-shopping/screenshots/).

| Check | Evidence/result |
| --- | --- |
| Create personal template, edit quantity/name, reload, add all, delete | PASS |
| Family uses real seeded products, current estimate and add all | PASS |
| Actual empty-stock kefir + missing reference + available milk | PASS; valid milk added, unavailable/missing reported, existing cart counted toward stock |
| Explicit stale-line removal | PASS |
| Preview failure | PASS; injected HTTP 503 leaves cart unchanged |
| Browser storage quota failure | PASS; localized warning and usable per-tab fallback after client navigation |
| Header + management page, 320/390/768/1024/1440 × RU/TJ/EN × dark/light | PASS, 30 combinations with reduced motion; no horizontal overflow or Saved/Cart/search intersections |
| Personal editor + curated detail, same matrix | PASS, 60 combinations; no overflow or clipped buttons |
| Mobile language/theme selection, reload persistence, shopping entry | PASS |
| Keyboard drawer Enter/Escape and focus return | PASS |
| Search keyboard selection, saved product reload, cart +/- persistence | PASS |
| Combined catalog category/stock/sort and manual connections | PASS |
| Real guest checkout / routing | PASS; 2,887m, 273s, 20.00 TJS, 51 route coordinates drawn on Leaflet |
| Failed order submission | PASS; injected 503 preserves cart |
| Actual order creation / cart clear / local history reference | PASS |
| Confirmation reload / save actual order as template / repeat from history | PASS |
| Historical order immutability | PASS; GET response identical after repeat |
| Direct browser requests to HeiGIT/openrouteservice | None observed during actual checkout |
| Configured ORS key in production browser assets | PASS; 35 JavaScript files scanned, zero exact secret matches; key was not printed |
| Captured page/hydration errors | None |

Real browser-created order: `83643cfb-d126-4451-afec-777803c2f88b`, cash, pending, **34.00 TJS** (milk 14.00 + delivery 20.00). Read-only PostgreSQL verification found that UUID and its item (product 8, quantity 1.000, unit/line price 14.00). The QA order remains in the demo DB; it consumed one milk unit. Availability fixture changes and destructive regression fixtures ran only on the dedicated test DB. Missing reference/HTTP failures injected in browser tests are explicitly distinct from actual DB/provider checks.

Screenshots were visually inspected for desktop curated detail, TJ/light management and EN/light mobile editor. Mobile full-page stitched captures include the fixed bottom tab bar at its capture position; viewport/layout measurements, rather than that stitching artifact, establish absence of clipping.

## Corrections, limits and warnings

- Initial Ruff checks found long lines/import-fixture lint; formatting and a reusable fixture alias corrected them.
- Initial pytest run: 130 passed, seven setup errors from fixture registration; final run: 137 passed.
- Browser testing found two real UI issues: deletion feedback disappeared when its local template vanished; empty-cart badges caused Saved/Cart overlap at 320px. Both were corrected and affected suites rerun successfully.
- Verification probes were corrected to distinguish the header combobox from the editor searchbox, match the existing checkout alert's appended text, and save from catalog cards (the unmerged product-detail save feature is outside main).
- The existing Starlette/AnyIO deprecation warning and Node module-type warning remain. Docker npm ci reported five existing high-severity dependency audit findings and an ESLint support warning; dependencies/lockfile were not upgraded in this feature.
- Guest history and personal templates do not synchronize across browsers/devices. Clearing browser storage removes local references/templates; order records remain in PostgreSQL. Lost order links cannot be reconstructed by phone/name without adding identity/auth.
- Stock/price preview is not a reservation. Existing checkout remains authoritative and handles concurrent stock/price changes.
- Order-journey and theme-wave branches need their own later integration; no merge was authorized in this task. No remaining functional blocker for this feature branch.
