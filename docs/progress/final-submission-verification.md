# Final submission verification

Date: 2026-10-10. Checkout: `D:/Workshop/Paykar/Test_Task_Paykar_Shop-main`.
Branch: `main`. **READY FOR FINAL REVIEW / COMMIT.**
No commit, staging, push, reset, stash, or merge was performed.

## Scope and inspection

Read the root agent instructions, frontend instructions, testing/browser skills,
and `final-ui-consistency-audit.md`. Reviewed the complete tracked diff and the
new source files/tests/reports. Preserved all earlier intentional work.
The visual design is frozen: this pass made no frontend implementation changes.

No debug console calls, debugger statements, temporary fixtures or tracked logs
were found in application source. New scene/style/preview modules are referenced
by their consumers. Historical QA documents and tracked evidence were retained.
New screenshots, browser fixtures and verification scripts stayed outside Git in
the Windows Temp directory. No dependency or architecture changes were made.

### Corrections introduced by this pass

- `apps/api/app/models/product_connection.py`: describe the existing
  `ix_product_connections_source_active_position` index in SQLAlchemy metadata.
  The index already exists in migration `0003`; its missing model declaration
  made `alembic check` propose removing it. No migration, schema mutation,
  API contract, query logic or visual change is required.
- `README.md`: replace the stale 77-test claim with the observed 137-test result
  and link to this report.
- This report.

## Final quality checks

| Command                                                       | Actual result                           |
| ------------------------------------------------------------- | --------------------------------------- |
| `npm run format:check`                                        | PASS                                    |
| `npm run lint`                                                | PASS, zero allowed ESLint warnings      |
| `npm run typecheck`                                           | PASS                                    |
| `npm run build`                                               | PASS, 22 generated pages                |
| `node --test tests/*.test.mjs`                                | PASS: 39 tests, zero failures/skips     |
| `npm run test:catalog`                                        | PASS: 14                                |
| `npm run test:shopping`                                       | PASS: 6                                 |
| `npm run test:navigation`                                     | PASS: 4                                 |
| `npm run test:recommendations`                                | PASS: 3                                 |
| `npm run test:hero`                                           | PASS: 6                                 |
| Saved-shopping tests in the complete Node suite               | PASS: 6                                 |
| `python -m compileall -q app` inside API Docker container     | PASS                                    |
| `ruff check .` inside API Docker container                    | PASS                                    |
| `ruff format --check .` inside API Docker container           | PASS: 48 files                          |
| `pytest -q`, including PostgreSQL integration tests           | PASS: 137 tests, zero skips             |
| Fresh isolated DB: `alembic upgrade head`, `current`, `check` | PASS                                    |
| Demo DB: `alembic current`, `heads`, `upgrade head`, `check`  | PASS; current=head, upgrade was a no-op |
| Docker Compose `config --quiet`                               | PASS                                    |
| Docker production API/web build and recreation                | PASS                                    |
| `git diff --check`                                            | PASS                                    |

Backend tests ran against newly created `paykar_submission_20261010_1730_test`,
migrated from empty to `0003_product_connections`, without demo seed data.
The full suite exercised real PostgreSQL integration rather than skipping tests.
The test database was dropped afterward.

Initially `alembic check` failed on the missing index metadata; it passes after
the correction, both on the fresh database and rebuilt production API.
An attempted `npm run test:saved` failed because this script does not exist;
the actual `saved-shopping.test.mjs` tests all passed through the complete suite.
No package script was invented just to hide that command mistake.

Non-blocking existing warnings: Node MODULE_TYPELESS_PACKAGE_JSON in pure
TypeScript test imports, and Starlette TestClient's AnyIO BlockingPortal
deprecation in pytest. No dependency upgrades were introduced for these warnings.

## Exact production runtime

Rebuilt and recreated the actual services, with PostgreSQL retained:

```powershell
docker compose --project-directory 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main' -f 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/docker-compose.yml' -p test_task_paykar_shop --env-file 'D:/Workshop/Paykar/Test_Task_Paykar_Shop/.env' up -d --build --force-recreate --no-deps api web
```

The frontend build layer was reused from Docker cache for unchanged frontend
source; a separate fresh local production build also passed. Browser checks
below targeted the recreated production service at **http://localhost:3000**,
with its real API at **http://localhost:8080/api/v1**. No preview server was used.

- Web image: `sha256:6481660d7d473c0293b6931478d00349cd2d2e857a4a1a5d2dba0a7b8f2fcfba`.
- API image: `sha256:60a2e4090cd4a9622b4b49ada2d3c0ad139cbd6c5aa846241f6b74f12f457241`.
- Web, API and PostgreSQL: **healthy**.
- `GET /api/v1/health`: 200, status ok.
- `GET /api/v1/health/db`: 200, database connected.
- Database revision: `0003_product_connections` (head).

The demo database remained at **15 orders and 40 products** before/after tests
and after browser verification. Stock fingerprint remained
`823771a6c2c62c32fa5a3cf5e7929a95`. No new demo order or stock decrement occurred.

## Real shopping journey and delivery

Passed homepage Catalog navigation, Russian catalog query under English UI,
Bananas product detail, add/increment, Cart persistence after reload, Checkout,
map point selection, quote calculation and confirmation reload.

The real backend delivery quote, without interception, returned:

- Destination: latitude **38.5750**, longitude **68.7800**.
- GeoJSON FeatureCollection with a LineString, **51 route coordinates**.
- Distance: **2,887 m**.
- Travel time: **273 seconds**, displayed as **5 minutes**.
- Delivery price: **20.00 TJS**.
- Actual Leaflet route line and metrics visible; two bananas made checkout total
  **64.00 TJS**.
- Backend provider URL remains the HeiGIT
  `/openrouteservice/v2/directions/driving-car/geojson` endpoint.
- Address change invalidated quote, removed old metrics and disabled submission.
- Injected route failure retained form/cart; retry recovered real provider data.

Submission testing was explicitly **intercepted**:

- Two immediate form submissions produced only one pending order POST.
- Injected 503 creation failure preserved cart and entered details.
- A subsequent intercepted 201 returned an **existing** persisted order response
  to verify the success handler: cart cleared and confirmation navigation worked.
- Reload fetched the real persisted order
  `83643cfb-d126-4451-afec-777803c2f88b`, retaining **34.00 TJS**.
  Its historical total differs deliberately from the current test basket.
- This is not evidence of new production order creation. Real atomic creation,
  idempotency, stock checks and snapshots were exercised by the isolated backend
  integration suite.

Browser routing requests went to the current FastAPI backend, with
**no direct browser request to HeiGIT/ORS**. An exact-value secret scan against
all **45 production public static files** found **zero configured ORS key
matches**; the key value was never printed.

## Browser smoke coverage

The in-app Browser was unavailable: `No browser is available`.
Used Playwright Chromium against Docker, not automated in-app Browser or manual
Chrome sign-off.

**94 representative route/presentation cases passed**, without horizontal
document overflow, broken loaded product images, hydration/page errors or
unexpected console warnings/errors in normal journey/matrix checks.

- 66 core cases: 11 routes across desktop/mobile combinations
  RU-dark/1440, TJ-light/1440, EN-dark/1440, RU-light/390,
  TJ-dark/390, EN-light/390.
- Core routes: Home, Catalog, normal Product Detail, Cart, Checkout, My Shopping,
  curated template detail, Offers, Contacts, Stores, existing Confirmation.
- 28 additional English/light cases at 1440 and 390: How to Buy, Payment,
  Delivery, Returns, About, Brands, Blog, weekly-shopping article, dairy
  category, sale/out-of-stock products, Saved, zero-result Search and 404.
- Actual document languages ru/tg/en and dark/light surfaces were checked.
- Empty personal workspace shows useful curated sets and create access.
  Template create/edit/save/reload and add-all used actual catalog/preview data
  in disposable contexts; favorite state survived reload; repeat fetched the
  existing order and added its currently available products.
- Keyboard drawer open/Escape/focus restoration and reduced-motion carousel
  ArrowRight passed. Chromium touch emulation swiped the curated carousel.
- Real out-of-stock Kefir disabled Add; zero-result Search exposed recovery.
- Offers injected 503 -> visible retry -> real products; successful empty Offers
  -> Catalog recovery; delayed Contacts -> visible loading -> real address.
- Stores marker address tooltip, zoom and resize passed; all 12 sampled OSM
  tiles loaded, with no failed requests. Contacts has no map and links to Stores.
- Normal desktop hero WebGL state was running. Forced WebGL initialization
  failure retained the loaded photo/CTA, state fallback, no errors. Reduced motion
  retained the photo, state static; mobile also used the static scene.

Screenshots were captured and representative desktop/mobile homepage,
fresh/personal My Shopping and real-route Checkout compositions were inspected.
No visible regression warranted unfreezing the design. Full-page captures can
place fixed headers/navigation at the capture boundary; this is a screenshot
artifact, not document overflow. Initial ambiguous QA selectors/touch coordinates
were corrected and rerun without application changes.

Evidence outside the repository:
`C:/Users/ahmad/AppData/Local/Temp/paykar-submission-browser-results.json`,
`paykar-submission-{home|my-shopping|checkout}-*.png`,
`paykar-submission-personal-shopping-390.png`,
`paykar-submission-real-route-1440.png`,
`paykar-submission-hero-{fallback|reduced}.png`.

## Submission/demo limitations

No blocking check remains. Chromium automation does not replace physical
mobile/Safari/Firefox verification. ORS and OSM still require network access.
Products/prices and sandbox payments remain explicitly educational/demo data;
some demo items share representative imagery. No actual payment gateway was
added. Existing browser-local templates/history belong to that browser profile;
a fresh profile intentionally shows curated sets rather than fabricated history.

Earlier progress reports retain their historical test counts, formatting
failures and image IDs. This report is the current verification result.
Do not claim new live order creation, manual Chrome acceptance or exhaustive
retesting of every previous matrix. The existing pre-submission changes still
need human diff review before a separately authorized commit.

## Final Git status and intentionally pending files

All files below are intentionally left modified/untracked for final review:
earlier accepted frontend changes and reports, plus the narrowly scoped index
metadata correction, README accuracy fix and this report. Nothing staged.

```text
 M README.md
 M apps/api/app/models/product_connection.py
 M apps/web/package.json
 M apps/web/src/components/cart-page.tsx
 M apps/web/src/components/catalog.tsx
 M apps/web/src/components/checkout.tsx
 M apps/web/src/components/delivery-page.tsx
 M apps/web/src/components/home-hero.tsx
 M apps/web/src/components/home.tsx
 M apps/web/src/components/my-shopping.module.css
 M apps/web/src/components/my-shopping.tsx
 M apps/web/src/components/not-found-view.module.css
 M apps/web/src/components/order-confirmation.tsx
 M apps/web/src/components/product-detail.tsx
 M apps/web/src/components/saved-items-page.module.css
 M apps/web/src/components/shopping-actions.tsx
 M apps/web/src/components/shopping-assistance.module.css
 M apps/web/src/components/shopping-carousel.module.css
 M apps/web/src/components/shopping-carousel.tsx
 M apps/web/src/components/shopping-workspace-cards.tsx
 M apps/web/src/components/states.tsx
 M apps/web/src/components/store-pages.tsx
 M apps/web/src/lib/translations.json
 M apps/web/src/styles/home.css
?? apps/web/src/components/catalog.module.css
?? apps/web/src/components/checkout-workspace.module.css
?? apps/web/src/components/hero-visual-scene.tsx
?? apps/web/src/components/home-template-preview.tsx
?? apps/web/src/components/product-detail.module.css
?? apps/web/src/components/states.module.css
?? apps/web/src/components/support-workspace.module.css
?? apps/web/src/lib/hero-scene-policy.ts
?? apps/web/tests/hero-scene-policy.test.mjs
?? docs/progress/final-ui-consistency-audit.md
?? docs/progress/my-shopping-premium-workspace.md
?? docs/progress/final-submission-verification.md
```
