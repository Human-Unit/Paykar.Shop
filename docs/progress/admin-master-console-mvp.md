# Admin Panel + Master Design Console MVP

Verified on 2026-10-12 in `D:/Workshop/Paykar/Test_Task_Paykar_Shop-main`.
Branch remains `main`, HEAD `639772bc84f6b01ca19b6735c95035315c799c24`.
No staging, commit or push. Existing uncommitted setup/masthead work was preserved.

## Implemented

- Independent administrative shell, login and operational pages with real PostgreSQL data.
- ADMIN/MASTER enforced by FastAPI, Argon2id passwords, hashed opaque sessions,
  HttpOnly/SameSite cookies, absolute expiry, origin/CSRF validation, login budgets,
  logout/session revocation and last-active-MASTER protection.
- Product/category creation and editing, existing product-price promotions, inventory
  adjustment with expected-stock conflict protection, read-only order list/detail,
  persisted store directory and sanitized read-only settings.
- MASTER administrator creation, role/active-state editing, deliberate password reset,
  audit access and typed Design Console.
- Local preview; independent saved drafts; explicit atomic publication; immutable
  version history; restore to a new draft; canonical Paykar Default.
- One central public design consumer with safe local fallback. Default emits no CSS
  overrides; high-value token adoption is incremental and preserves local breakpoints.

Migration `0004_administration` introduces six tables: users, sessions, login budgets,
audit, design versions and stores. The eight store records retain original addresses,
IDs and coordinates. Existing commerce tables/contracts, guest checkout and personal
template storage were not changed. Store directory coordinates remain separate from
the environment-managed checkout origin; map component implementation is untouched.

Full endpoints/roles/models/routes/bootstrap are documented in
[admin architecture](../admin/admin-architecture.md). Token ranges, consumer scope,
draft/publication/cache/fallback rules are documented in
[Master Design Console](../admin/master-design-console.md).

## Verification

Commands ran against Compose project `test_task_paykar_shop`, using the existing
external env file `D:/Workshop/Paykar/Test_Task_Paykar_Shop/.env` without printing it.

| Command / check                                                                                        | Result                                                                                                      |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                                                 | PASS                                                                                                        |
| `npm run lint`                                                                                         | PASS, zero lint warnings                                                                                    |
| `npm run typecheck`                                                                                    | PASS                                                                                                        |
| `npm run build`                                                                                        | PASS, including Docker production build                                                                     |
| `node --test tests/*.test.mjs`                                                                         | **48 passed**, no failures/skips; six new design utility tests                                              |
| `docker compose -p test_task_paykar_shop --env-file <existing-env> exec -T api python tools/verify.py` | **151 passed**, no skips; fourteen new administration test cases                                            |
| Backend helper: `compileall`, `ruff check .`, `ruff format --check .`                                  | PASS                                                                                                        |
| Backend helper: owned fresh PostgreSQL DB, Alembic upgrade/current/check                               | PASS, `0004_administration`, no drift; owned DB removed                                                     |
| Temporary Alembic autogeneration in an owned test DB                                                   | PASS: empty upgrade/downgrade, generated revision Ruff check/format compliant, temporary file removed       |
| `0004` downgrade → `0003` → upgrade/head/check on owned test DB                                        | PASS; application DB never downgraded                                                                       |
| Frontend/backend canonical defaults deep comparison                                                    | MATCH                                                                                                       |
| Forty approved image choices vs seed/real repository assets                                            | MATCH; invalid/missing asset rejected by API                                                                |
| `docker compose … run --rm --no-deps --build web-checks`                                               | PASS: formatting/lint/typecheck/build/all 48 frontend tests inside Docker                                   |
| `docker compose … up -d --build --wait`                                                                | PASS: actual API/web rebuilt, three long-running services healthy; automatic seed skipped populated catalog |
| `git diff --check`                                                                                     | PASS                                                                                                        |

Known non-blocking dependency warnings: Node `MODULE_TYPELESS_PACKAGE_JSON` and
Starlette/AnyIO `BlockingPortal` deprecation. No unrelated package/type changes were
made just to suppress them.

## Actual Docker browser QA

Used Playwright Chromium at **localhost:3000**, not a temporary preview. Browser
plugin/browser skill was not available, so the recorded Playwright fallback was used.
Tests used isolated browser contexts; the user's normal browser storage was untouched.

- Unauthorized admin entry redirects to login; invalid login gives the same generic
  message. Valid ADMIN and MASTER login, mobile navigation and logout verified.
- ADMIN Master links are absent; direct Master API returns **403**. After logout,
  protected API returns **401**.
- Real product search returns the matching record. Product/store/inventory edit forms
  saved existing values successfully; live catalog/stock/location data was not altered
  for a demo. Actual changed values/conflicts are covered in the owned integration DB.
- Existing order list and order detail opened; no new order was submitted.
- MASTER administrator creation and disabling verified; subsequent reload confirmed
  disabled state. Demoting the sole MASTER produced **409** and preserved the account.
- Brand edit changes preview; Save draft persists after reload. Public config remains
  byte-equivalent before publication. Publish changes the actual catalog's brand token;
  publishing defaults clears the override. Historical restore creates a draft and
  leaves the public default active.
- Invalid design values disable Save; visible validation, keyboard focus and intercepted
  503 → Reload recovery verified. The expected intercepted 503 network console message
  was distinguished from runtime errors; normal flows had no page errors.
- Preview matrix: **390/768/1024/1440 × RU/TJ/EN × dark/light = 24 combinations**.
  Correct preview language (`ru/tg/en`), visible product/buttons and no document overflow.
- Public regression: **32 rendered routes** across representative RU-dark 1440,
  EN-light/touch 390, TJ-dark/reduced-motion 768 and RU-light 1024. Covered homepage,
  catalog, product detail, cart, checkout, promotions, stores and My Shopping.
  Cart remained present; no runtime errors, broken visible images or document overflow.
- Store map: eight locations; list click opens/selects matching marker; marker click
  selects matching row; one settled popup; no console errors/warnings. Existing label,
  popup and gesture code remains unchanged.
- After QA cleanup: `/admin` still redirects to login; storefront uses public version
  **0**, original `#00a82d`, empty override payload and no mobile overflow.
- Additional 768/1024 screenshots waited for theme transitions to settle. These
  visual-only captures intercepted identity/history after QA account deletion; they
  are not authentication evidence. Real login/authorization/publication checks above
  used database sessions. Settled secondary/input surfaces were `rgb(17,17,17)` with
  `rgb(245,245,245)` text, not the gray mid-transition frames sampled in the fast matrix.

Physical-device/other-browser checks and a new live ORS order were not performed.
Checkout/routing regression coverage includes the existing automated provider/transaction
tests and rendered checkout; no mocked route result is claimed as a live ORS result.

## Cleanup and data preservation

Initially the newly added admin/design tables were empty. Three explicitly temporary
QA accounts and their sessions/audit/budgets/design versions were removed after checks.
Their credentials are not persisted or provided as usable accounts. Both temporary
verification databases and the temporary generated migration were removed.

Final live counts: **0 admins/sessions/design versions/audit/budgets; 40 products;
15 pre-existing orders; 8 stores**. No customer order was created or application DB
reset. No screenshots, browser scripts, test credentials, dependency caches or env
secrets were added to the repository. Screenshots remain outside the checkout in Temp.

## Visual mismatch ledger and limits

- Admin is a compact English operational workspace, not another marketing redesign.
  Public languages/preferences/font coverage remain unchanged.
- Preview is a representative showcase, not a full storefront render. Some layout,
  typography/effect tokens have intentionally limited initial consumer coverage;
  bespoke scenes/local measurements are not universally configurable.
- Defaults preserve local design values and responsive geometry rather than forcing
  every component to one radius/blur/width. No new WebGL or phone/map motion controls.
- Existing open storefront tabs refresh the published design on focus (30-second
  throttle) or reload; no live broadcast/polling infrastructure.
- No MFA/email recovery/customer accounts/media upload/real payment gateway/warehouse.
  HTTPS deployment requires Secure cookies, correct origin and appropriate credentials.
- Orders/settings are read-only; no unsupported order transitions or secret settings UI.
- Colors are typed/bounded; MASTER must still inspect contrast before publishing.
- Stock edits detect concurrent stock changes. Other administrator field edits use
  last completed write; full optimistic revision conflict UI is not part of this MVP.
- The shared proxy login budget can temporarily throttle multiple administrators.
- Version/audit lists show the latest 100 entries; records are not destructively pruned.

## Evidence

Screenshots were captured and visually inspected outside the repository, including:

- `Temp/paykar-admin-products-mobile.png`
- `Temp/paykar-design-master-ready-1440.png`
- `Temp/paykar-design-preview-390.png`, `-768.png`, `-1024.png`, `-1440.png`
- `Temp/paykar-admin-regression-390-product.png`, `-1440-product.png`
- `Temp/paykar-admin-regression-390-catalog.png`, `-1440-catalog.png`
- `Temp/paykar-admin-map-regression.png`
- `Temp/paykar-design-settled-768.png`, `-1024.png` (visual-only interception noted above)

## Files

The following list identifies this task's files, including shared setup files extended
without discarding their prior work. Unrelated prior files are listed separately below.

```text
.env.example
README.md
apps/api/alembic/versions/0004_administration.py
apps/api/app/api/router.py
apps/api/app/api/routes/admin.py
apps/api/app/core/config.py
apps/api/app/data/product_assets.json
apps/api/app/main.py
apps/api/app/models/__init__.py
apps/api/app/models/administration.py
apps/api/app/models/store.py
apps/api/app/schemas/admin.py
apps/api/app/schemas/design.py
apps/api/app/services/admin_auth.py
apps/api/requirements.txt
apps/api/tests/test_admin.py
apps/api/tools/create_admin.py
apps/web/src/app/admin/categories/page.tsx
apps/web/src/app/admin/inventory/page.tsx
apps/web/src/app/admin/layout.tsx
apps/web/src/app/admin/login/page.tsx
apps/web/src/app/admin/master/administrators/page.tsx
apps/web/src/app/admin/master/design/history/page.tsx
apps/web/src/app/admin/master/design/page.tsx
apps/web/src/app/admin/orders/[id]/page.tsx
apps/web/src/app/admin/orders/page.tsx
apps/web/src/app/admin/page.tsx
apps/web/src/app/admin/products/page.tsx
apps/web/src/app/admin/promotions/page.tsx
apps/web/src/app/admin/settings/page.tsx
apps/web/src/app/admin/stores/page.tsx
apps/web/src/app/api/admin/[...path]/route.ts
apps/web/src/app/globals.css
apps/web/src/app/layout.tsx
apps/web/src/components/admin/admin-login.tsx
apps/web/src/components/admin/admin-shell.tsx
apps/web/src/components/admin/admin-workspace.tsx
apps/web/src/components/admin/admin.module.css
apps/web/src/components/admin/design-console.tsx
apps/web/src/components/catalog.module.css
apps/web/src/components/home-hero.tsx
apps/web/src/components/home-store-network.tsx
apps/web/src/components/product-detail.module.css
apps/web/src/components/shell.tsx
apps/web/src/components/shopping-assistance.module.css
apps/web/src/components/storefront-design.tsx
apps/web/src/lib/admin-api.ts
apps/web/src/lib/design-config.ts
apps/web/src/lib/store-directory.ts
apps/web/src/styles/design-bindings.css
apps/web/src/styles/home.css
apps/web/src/styles/shop.css
apps/web/tests/design-config.test.mjs
docker-compose.yml
docs/admin/admin-architecture.md
docs/admin/master-design-console.md
docs/progress/admin-master-console-mvp.md
scripts/dev.py
```

Prior work left intact (not introduced by this task):

```text
apps/api/alembic/script.py.mako
apps/api/tools/verify.py
apps/web/src/app/my-shopping/page.module.css
apps/web/src/components/my-shopping.tsx
apps/web/src/lib/translations.json
db/seed/seed.py
```
