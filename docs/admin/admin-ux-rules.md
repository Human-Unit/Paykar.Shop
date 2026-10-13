# Paykar Admin UX rules

## Marketplace-style operational visual system — completed implementation sequence

1. Isolate light operational tokens from the existing dark Master tool. Refine
   the shared shell, sidebar, buttons, fields, badges, table and drawer primitives.
2. Add read-only, database-derived attention/today/status summaries and safe
   product-problem/measurement filters. Preserve mutations, schemas and lifecycle.
3. Apply one table family with product identity/units, URL-backed filters, grouped
   record forms, operational order detail and sanitized settings. Recompose rows
   on mobile and use an accessible modal sidebar; do not shrink desktop tables.
4. Verify real Docker routes/permissions/conflicts/design isolation, responsive
   geometry and storefront regressions. Run all existing frontend/backend checks.
   No commit/push, new order lifecycle, reservation model, uploader or bulk editor.

Design contract: the supplied Marketplace-Style Admin brief, supported existing
data, and a desktop Products concept at
`C:/Users/ahmad/.codex/generated_images/01a0f78e-1997-79a1-aef3-bd1ad354df66/exec-4c17b91c-f718-40da-94cc-0abca0f27875.png`.
Concept records are verified application data, not new fixtures. Reference chrome:
232px sidebar, 64px header, 28px page inset, 26px heading, white table, neutral
10px corners, compact controls and quiet badges. Actual pagination/data can exceed
the six illustrative concept rows; retain every real record and current page size.

Operational palette: `#F6F7F6` canvas, `#FFFFFF` surfaces, `#F8F9F8` secondary,
`#151715` text, `#6B706B` secondary text, `#E5E8E5` border, canonical `#00A82D`
green accent. Typography uses the existing font, 14px body, 13px tables/metadata,
16–18px section headings, 26px titles. Controls 38px desktop/44px touch, rows
48–60px, surfaces 16–20px padding with no decorative gradients/glow/glass.
Inline editor and full Design Console retain their dark professional appearance.
Public surfaces and persisted shopper theme/language are protected.

The operational workspace, advanced Design Console and inline storefront editor
serve different jobs. Storefront imagery/motion must not become administrative
chrome. Existing English administrative labels use `lang="en"`; shopper
RU/TJ/EN preferences remain independent.

## Resource workflow

Use index → detail → edit/create. Products, promotions and stores now have full
detail routes under `/admin/{resource}/{record}`. Product creation uses `new`.
Store creation remains unavailable because the existing API does not support it.
Order detail remains read-only; no status transitions were invented. Categories,
inventory adjustments and administrator edits use native modal drawers, including
focus containment, Escape and unsaved-change confirmation.

Large forms retain current measurement controls, validation, stock-conflict
checks and role safeguards. Cancel/discard is separate from Save. Do not add
delete, order cancellation or account-disable shortcuts as primary green actions.
If adding a destructive action later, use a named danger section/menu and an
explicit confirmation; retain backend invariants.

## Lists and primitives

Shared primitives: `AdminHeader`, `DataTable`, `FilterBar`, `StatusBadge`, `SaveBar`
and `AdminDrawer`. Keep title/action → search/filter/sort → table → pagination.
Use meaningful primary-column links and explicit row actions. Desktop tables use
an internally scrolling region and sticky header where helpful. Mobile tables
recompose into labeled stacked records without document overflow. Mouse clicks
on non-interactive row cells open the primary detail/edit
action; links/buttons, text selection and modified clicks keep native behavior.
Keyboard users retain explicit links/buttons. Do not rely on row-click alone.
Primary create actions sit beside the page title, above list filters. Drawers
restore focus to their initiating button after close/discard.

Search, filters, sorting and pagination belong in the URL. `admin-list-state.ts`
normalizes allowed values; backend queries independently validate them. Resource
endpoints perform filtering/counting/sorting/pagination before returning rows.
Product/inventory/promotion lists retain existing category/stock/sale filtering
and add bounded sorting. Orders add UUID search, existing-status filtering and
date/total sorting; the item count is a correlated query, not one request per row.
Categories, stores and administrators accept optional paged views, search and
ID/name sort; their no-page array responses remain compatible with older consumers
and category-option loading.

Grouped navigation: Operations (Overview, Orders), Catalog (Products, Categories,
Inventory, Promotions), Locations (Stores), MASTER-only Master (Design,
Administrators), System (Settings), then Back to storefront. Backend permissions
remain authoritative; the sidebar is a convenience, not a security boundary.

## Feedback and future boundaries

Retain loading, retryable API failures, useful successful-empty states, pending
guards and saved feedback. Dashboard counts come from database records. No fake
revenue/growth/customer metrics.

Future bulk actions should operate on stable selected IDs, show contextual
actions, report per-row failures and retain failed selections. Future grid edits
should preserve stock conflict checks and explicit commit/cancel boundaries.
Future shell search should call bounded resource-search endpoints rather than
download all records. Selection, grid editing and a global-search UI are not
implemented in this pass; do not imply that preparatory boundaries are features.

Use controlled-token editing rules in `inline-master-design-mode.md` for design,
not operational resource forms. No unrequested commits or pushes.

## Marketplace redesign delivery report — 2026-10-13

### Implemented surfaces

| Area                                | Result                                                                                                                                                                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Design system                    | Light operational shell with semantic tokens, white surfaces, neutral borders, compact typography and controls. Dark tool fallbacks remain intact.                                                                                                  |
| 2. Shell/sidebar                    | 232px desktop sidebar, 64px utility header, grouped icon navigation, separate role badge and accessible tablet/mobile navigation drawer. MASTER links remain role restricted.                                                                       |
| 3. Overview                         | Attention links lead to real filtered resources. Today shows actual non-cancelled order count/value/average in UTC+05:00; zero orders has no fictional average. Latest five orders open their real snapshots.                                       |
| 4. Products                         | Actual thumbnails, name/SKU, humanized measurement, price/stock units, all applicable problem badges, URL-backed views/filters, server pagination, detail and six grouped editor sections.                                                          |
| 5. Inventory                        | Compact available-stock table with units, active/low/empty filters and existing absolute-stock drawer. 409 conflict is displayed inside the drawer; Reload discards the stale edit and fetches fresh data.                                          |
| 6. Orders                           | Only existing lifecycle statuses with real query-relative counts, UUID search, customer details and sorting. Read-only two-column detail keeps requested pieces/weight, estimates, monetary snapshots and absent packed weight explicit.            |
| 7. Promotions/Stores/Administrators | Promotions remain product discounts. Stores show actual names/addresses/city/status, without maps in rows or invented service metadata. Administrator rows show real roles, enabled state, creation and last login. Settings groups sanitized data. |
| 8. Shared primitives                | Reused/refined header, table, filter, badge, save bar and native drawer; added section, grouped fieldset, practical empty state, loading rows and display-only resource views/helpers. No parallel admin system.                                    |
| 9. Responsive behavior              | Desktop tables; tablet modal sidebar and lower-priority column suppression; mobile labeled stacked records, two-column filters, full-width record action and 44px controls.                                                                         |
| 10. Accessibility                   | Explicit links/buttons, field labels, textual statuses, visible focus, semantic headings/fieldsets, keyboard sidebar focus containment, Escape and focus restoration. Reduced motion preserves state feedback.                                      |
| 11. Frontend tests                  | 64 passed, zero skipped. Four new focused cases cover bounded URL state, status mapping, precise grocery display and product warnings.                                                                                                              |
| 12. Backend tests                   | 198 passed, zero skipped. Two new integration tests cover problem/measurement reads and real overview/status aggregates.                                                                                                                            |
| 13. Docker                          | Rebuilt/recreated actual `test_task_paykar_shop` services. Web serves localhost:3000; API and PostgreSQL healthy; seed completed successfully.                                                                                                      |
| 14. Limitations                     | Existing English admin, supported statuses and models only. No new warehouse/reservations, picking/packing workflow, media uploader, scheduled promotions, bulk editor, customer accounts or payments.                                              |
| 15. Files                           | Exact paths are listed below. Public source, dependency manifests, models, migrations and storage schemas are unchanged. No commit/push.                                                                                                            |

Low stock means **positive stock sufficient for five minimum purchase quantities
or fewer**. Convert gram-based minimums to kg before comparison; preserve piece
stock precision. This is a disclosed attention heuristic, not a configured
reorder/reservation policy. `today.order_value` is not paid revenue. New backend
work is additive authenticated GET parameters/derived fields only; all mutation
contracts, deterministic stock locking and expected-stock guards are preserved.

### Verification commands and results

| Command                                                                                                                                                | Result                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `npm run format:check` in `apps/web`                                                                                                                   | PASS                                                                                 |
| `npm run lint`                                                                                                                                         | PASS, zero ESLint warnings                                                           |
| `npm run typecheck`                                                                                                                                    | PASS                                                                                 |
| `node --test tests/*.test.mjs`                                                                                                                         | PASS, 64/64, zero skips                                                              |
| `npm run build`                                                                                                                                        | PASS, production Next.js build                                                       |
| `docker compose -p test_task_paykar_shop run --rm --no-deps -v D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/apps/api:/app api python tools/verify.py` | PASS: compileall, Ruff check/format, migration verification and 198/198 pytest tests |
| `docker compose -p test_task_paykar_shop exec -T api alembic current`                                                                                  | `0005_grocery_measurement (head)`                                                    |
| `docker compose -p test_task_paykar_shop exec -T api alembic check`                                                                                    | PASS, no new upgrade operations                                                      |
| `docker compose -p test_task_paykar_shop up -d --build --wait web`                                                                                     | PASS; dependencies rebuilt/recreated as needed, actual web healthy                   |
| `git diff --check`                                                                                                                                     | PASS                                                                                 |

Existing Node module-type warnings and one Starlette/AnyIO deprecation remain;
neither is an application failure or a reason to change dependencies here.

### Actual browser evidence

Playwright Chromium checked the rebuilt Docker application, not a separate
preview. The Browser skill required by the preferred plugin workflow was not
available, so ordinary local Playwright was used. Artifacts and credential-reading
QA scripts remain outside the repository in
`C:/Users/ahmad/AppData/Local/Temp/paykar-marketplace-qa/`.

- Main run: 79 structured assertions passed; supplemental run: 11 passed.
- Twelve surfaces at 390/768/1024/1440: Overview, Products, product detail,
  Categories, Inventory, Promotions, Orders, order detail, Stores, Settings,
  Administrators and Design Console. No document overflow or broken visible
  product assets; no uncaught application/hydration errors.
- Real API: login/role isolation, existing overview/orders/products/store data,
  URL filter reload, pagination, DUAL unit rendering, MASTER/ADMIN navigation and
  authorization. A uniquely owned temporary ADMIN account was removed after
  checking denied MASTER access; no existing account was edited.
- Intercepted cases: product-save success/payload, pending guard, stock-conflict
  409/reload, list 503/retry/loading, and DUAL estimated order snapshot. These
  verify frontend feedback, not real product/order writes. The two backend
  integration cases use a disposable test database.
- Sidebar keyboard containment/Escape/restoration, reduced-motion navigation,
  and touch-emulated product/cart access passed. All six grouped editor sections
  and reachable save/cancel controls were checked at each width.
- Full dark Design Console/history and private Inline Master preview remained
  dark. Preview did not change the published public configuration. No draft was
  saved/published and no real checkout order was created.
- Public Home, Catalog, bananas detail, Cart, Checkout, My Shopping, Promotions
  and Stores were smoke-checked at 390 and 1440. Public source and persisted
  shopper theme/language/cart/template logic were not changed.

Console warnings comprised intentionally intercepted 409/503 failures and a
Next.js CSS preload warning. They are distinct from uncaught runtime errors.
Physical devices, Firefox/Safari, real ORS routing, real checkout submission and
every public locale/theme combination were not retested in this admin-only pass.

### Reference comparison and mismatch ledger

The supplied brief is authoritative. The Products concept is a preview-only
composition aid, not an application asset. Compared the actual rendered Products
screen at the concept's native **1487×1058** dimensions, plus all requested widths.

| Comparison                         | Outcome / deliberate difference                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Light canvas / white surfaces      | Matches the quiet operational palette; no marketing gradients/glass.                                                                          |
| Sidebar and title hierarchy        | 232px sidebar and 26px/700 title follow the brief; denser than the raster concept.                                                            |
| Filters and table rhythm           | Search → views → labeled filters → table → pager; loading rows remain below filters.                                                          |
| Product identity / numeric columns | Real 40px application assets and measurement labels; prices/stock right aligned.                                                              |
| Rows / pagination                  | Retained 25 actual records per page rather than the six illustrative raster rows; internal scroll and sticky header keep the pager reachable. |
| Green primary / secondary actions  | Canonical green uses dark readable text; public Preview action retained as an icon link rather than removed to match the concept.             |
| Mobile composition                 | Stacked labeled records and reachable actions replace desktop table shrinking; no clipped columns or document overflow.                       |
| Master/public separation           | Dark Master tools and expressive public surfaces remain intentionally different from light operational Admin.                                 |

Final representative screenshots: `final--admin-products-1440.png`,
`final--admin-products-390.png`, `products-native-concept-1487.png`,
`verified--admin-products-768.png`, `verified--admin-products-1024.png`,
`final-product-editor-390.png`, `final-dark-console-1440.png` and
`final-dark-inline-1440.png`. Before evidence includes `before--products.png`.
No blocking visual mismatch remained in the inspected surfaces. Minor font/asset
differences from the generated concept are deliberate; no pixel-perfect claim.

### Exact changed files

- `AGENTS.md`
- `apps/api/app/api/routes/admin.py`
- `apps/api/tests/test_admin.py`
- `apps/web/src/components/admin/admin-drawer.tsx`
- `apps/web/src/components/admin/admin-primitives.tsx`
- `apps/web/src/components/admin/admin-shell.tsx`
- `apps/web/src/components/admin/admin-workspace.tsx`
- `apps/web/src/components/admin/admin.module.css`
- `apps/web/src/components/admin/admin-resource-views.tsx` (new)
- `apps/web/src/lib/admin-list-state.ts`
- `apps/web/src/lib/admin-presentation.ts` (new)
- `apps/web/tests/admin-list-state.test.mjs`
- `apps/web/tests/admin-presentation.test.mjs` (new)
- `docs/admin/admin-architecture.md`
- `docs/admin/admin-ux-rules.md`
