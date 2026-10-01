# DAY 3 — COMPLETE

Verified 2026-10-01 in `C:\Workshop\Paykar\Test_Task_Paykar_Shop`. The final application is ready for technical-assignment submission. Feature scope is frozen after the complete final desktop/mobile regression; only P0/P1 regressions may be fixed. No commit, push, Git initialization, backend rewrite or new infrastructure was performed.

## Baseline inspected before editing

Read `AGENTS.md`, README, the three-day plan and Day 1/2 reports. The plan's original repository assessment is historical; the approved implementation stack is Python/FastAPI, not the original Phase 0 Go proposal.

The three existing services were running and healthy, with both health endpoints returning 200. Inspected homepage, catalog, product, empty and populated cart/checkout, and the retained Day 2 confirmation at 1440 px and 390 px before application edits. A single locally added demo apple was used for the populated baseline; no order was created during baseline inspection. Screenshots: [baseline directory](day-3-baseline).

Observed weaknesses: search required full results navigation; product pages lacked category orientation and related items; homepage presented one alphabetical collection without a distinct savings section; mobile product-card buttons measured 38 px high with 12 px product titles; quantity editing required the cart; failures offered limited navigation; confirmation 404/invalid UUID states were generic. The existing order/routing flow worked and was preserved.

## Improvements and concrete user benefit

| Area | Before | Final behavior / reason |
| --- | --- | --- |
| Header search | Submit to catalog only | 300 ms debounce, minimum two characters, up to six image/name/unit/price suggestions. Loading/empty/failure feedback, clear, Escape, arrow navigation, Enter and all-results link shorten the path to a product. Existing products API; no new endpoint. |
| Homepage | Hero, categories, one collection | Preserved green supermarket identity and original hero; added a separate savings collection with percentages derived from actual demo old/current prices, plus a distinct everyday collection. Benefits describe implemented guest shopping/routing, with no invented official offers. |
| Product cards | Add button with count | Shared minus/quantity/plus control after adding, removal at zero, known-stock/99 cap, consistent image ratio/card height and larger controls. No separate cart store. |
| Product page | Basic detail, root breadcrumbs | Linked parent/category breadcrumbs and up to four available same-category alternatives, excluding the current product. Clear price/SKU/unit/stock and package/delivery explanation. |
| Catalog | Existing filter/search/pagination | Preserved behavior; semantic breadcrumb navigation and product-grid skeletons make orientation/loading clearer. |
| Cart | Working cart, small controls | 44 px quantity/remove targets, improved mobile wrapping, immediate subtotal and readable summary. Unavailable/insufficient-stock items must be corrected before checkout. Empty cart provides catalog recovery. |
| Checkout | Correct routing/order safeguards | Preserved explicit quote, invalidation, abort/late-response guard, fitting/markers, refreshed-price review, duplicate-click guard and failure retention. Stable destination object prevents route redraw when name/comment changes. Stable phone/comment accessible names and associated phone/form-error descriptions. |
| Loading/errors | Generic messages | Lightweight static skeletons for product/grid loading; existing busy quote/order/confirmation states retained. Retry plus catalog navigation for failures; useful unknown order/invalid UUID states. Broken images use the original fallback without changing image dimensions. |
| Responsive/a11y | Baseline responsive | Mobile card names 14 px, controls at least 44 px high; quantity buttons 44 × 44 px; mobile form/search inputs 16 px. Tablet home grid uses three columns. Labeled controls, visible focus/skip link, semantic breadcrumbs, keyboard search and live delivery/error feedback. |
| Performance/security | Working Day 2 architecture | One bounded homepage product request feeds both collections; search aborts obsolete requests and debounces typing. Cart quantity edits reuse current product data. Stable map point avoids needless marker/polyline replacement. Mock browser fixture is excluded from the production API image. |

The recreated experience is browsing/searching supermarket products, a guest cart, map-selected delivery and a persisted order receipt. Improvements reduce navigation, show quantity/stock immediately and keep route/price visible before submission. They are assessed against the inspected local baseline, not unsupported claims about the original site's internal behavior.

## Final architecture

```text
Browser: Next.js + TypeScript + App Router + Tailwind + Leaflet
  ├── localStorage: product IDs and integer quantities only
  └── FastAPI: Pydantic + SQLAlchemy async + asyncpg
        ├── lifespan httpx client → HeiGIT openrouteservice GeoJSON
        └── PostgreSQL 17: categories/products/UUID orders/item snapshots
Docker Compose: postgres + api + web; Alembic is the only migration authority.
```

Backend business code and schema are unchanged during Day 3. Reviewed and preserved server Decimal/NUMERIC totals, active/stock checks, advisory expected total, provider request before transaction, deterministic row locks, atomic stock/order writes, rollback and item snapshots. No auth/admin/payment/geocoding/new services or caching infrastructure was added.

## Commands actually run on final application source

Backend in the rebuilt Python 3.12 API container:

| Command | Result |
| --- | --- |
| `docker compose exec api python -m compileall app` | PASS |
| `docker compose exec api ruff check .` | PASS |
| `docker compose exec api ruff format --check .` | PASS, 33 files formatted in image; excluded browser fixture remains in source |
| `docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q` | PASS, **63 tests, zero skips**, 40 unit + 23 PostgreSQL integration cases |
| `docker compose exec api alembic upgrade head` | PASS |
| `docker compose exec api alembic current` | PASS, `0001_foundation (head)` |
| `docker compose exec api alembic check` | PASS, no new upgrade operations |

The integration database is dedicated and unseeded. After tests, SQL counts were **0 categories / 0 products / 0 orders / 0 order_items**. Tests cover provider auth/quota/timeouts/invalid geometry/service area, monetary recomputation, stock/price conflicts, rollback, snapshots and concurrent last-stock orders. One upstream Starlette/AnyIO deprecation warning remains.

Frontend from `apps/web`, rerun after the final accessible-name/control-size fixes:

| Command | Result |
| --- | --- |
| `npm ci` | PASS, 375 packages installed, audit zero vulnerabilities; upstream ESLint 9 deprecation notice |
| `npm run lint` | PASS, no warnings/errors hidden |
| `npm run typecheck` | PASS, Next route generation + strict TypeScript |
| `npm run build` | PASS, production Next.js 16.3.8 build, all expected routes |
| `npm run format:check` | PASS |

`npm run format` was executed before these checks. No `any` types, lint/TypeScript suppressions or ignored build errors were introduced. The `step="any"` occurrences are numeric coordinate input attributes.

Docker: `docker compose config --quiet` and `docker compose up --build -d --wait` passed on final source; `docker compose ps` showed **postgres/api/web healthy**. Main API health and DB health returned **HTTP 200**. Health checks also passed on the separate fresh stack. Credentials were not printed through expanded Compose configuration.

## Final desktop browser regression — real provider

1440 × 1000 Chromium: homepage → catalog → header search → Enter to full results → product → add/edit card quantity → cart edit → reload → checkout → customer fields → map selection → coordinate correction → explicit real quote → order → confirmation → reload.

- Product/cart increments and decrements worked; cart reload retained quantity 1, subtotal 18.00 and count 1.
- Invalid phone disabled submission. Coordinate/map edits issued zero automatic quote calls.
- Deliberate **mocked browser provider-auth response (503)** displayed recovery text and retained cart/name. This is UI error evidence, not a live provider failure claim.
- Unmocked quote returned **200**, then changing the address invalidated it and disabled submission without automatically contacting the provider. Explicit recalculation returned another real 200.
- Changing customer/comment after quotation retained the existing route DOM node; route bounds included both actual markers.
- Actual backend **422** was exercised by modifying only the outgoing phone in the test request. No error response was fabricated. Cart, valid visible phone, name and address remained intact.
- Immediate double click produced **one successful order POST**, not two. The backend had returned real 201 while cart/storage still contained one apple; only forwarding the successful response to the UI cleared it.
- Final order **`386a229d-6c56-4885-b6ee-f00e5e78cc65`**, status pending, subtotal **18.00**, delivery **20.00**, total **38.00**. Confirmation content was identical after reload; cart count **0**.
- **Zero browser page exceptions.** Expected deliberately triggered failed HTTP requests are distinct from page exceptions.

Evidence: [desktop result](day-3-final/desktop-verification.json), [real route screenshot](day-3-final/desktop-checkout-real-route.png), [confirmation](day-3-final/desktop-confirmation.png).

## Final mobile regression and fresh-start acceptance — real provider

390 × 844 Chromium on the separate fresh stack, `http://localhost:3002`: homepage → catalog → clickable search suggestion → product add/edit → cart edit/reload → checkout/customer/map → real quote → actual stock conflict → successful order → confirmation reload.

- Mobile suggestions, quantity controls and summary were usable. Reload retained quantity 2; decrement restored one unit before checkout.
- Map click selected coordinates; manual correction used **latitude 38.5750 / longitude 68.7800**. No quote was made before pressing Calculate.
- Real quote returned **200**, **51-point GeoJSON LineString**, **2,887 m / 273 s / 20.00 TJS**. UI displayed **2.9 km / 5 min / 20 TJS**. Route and both store/customer markers were visible inside the **317.33 × 300 px** map. Document width **375 ≤ 390**, no horizontal overflow.
- An actual backend **409 insufficient_stock** was exercised by substituting a seeded zero-stock product (ID 9) into the outgoing test order request. The real API/provider handled the request; no synthetic response or stock mutation was used. No order was created; cart/name/phone/address were retained.
- Restoring the ordinary request created exactly one order: **`15745795-d930-41b4-b629-681c4df1d0db`**, subtotal **18.00**, delivery **20.00**, total **38.00**, distance **2,887**, duration **273**, selected coordinates preserved. Cart cleared to **0**; confirmation reload was identical.
- **Zero browser page exceptions.** This is responsive desktop Chromium testing at mobile size, not a physical phone or Safari certification.

Evidence: [mobile result](day-3-final/mobile-verification.json), [real route](day-3-final/mobile-checkout-real-route.png), [confirmation](day-3-final/mobile-confirmation.png).

## Real ORS and order persistence

The reviewed source constant and deployed runtime constant both use:

```text
POST https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson
```

Store **38.562512, 68.791511**; customer **38.5750, 68.7800**. Successful browser quotes went through FastAPI without route mocks. Provider distance **2,887 m**, duration **273 s**, 51 geometry points, independently configured fee **20.00**. The selected destination remains in the API quote/order even when routing snaps the road endpoint nearby. Orders obtain their own fresh real quote before their short database transaction.

Direct PostgreSQL joins confirmed both UUID orders, item name snapshots, quantity **1.000**, unit/line price **18.00**, total **38.00**, selected coordinates, distance and duration. Fresh product 1 stock fell **13 → 12**; zero-stock ID 9 remained **0**. Main product 1 stock fell **12 → 11** for the single Day 3 order. The initial two existing main orders were preserved, including the Day 2 receipt; main database ended with three orders. Existing user data was not reset.

Main and fresh seed commands were repeated after order creation. Counts remained **7 categories / 40 products**, receipts remained present and stock stayed **11** main / **12** fresh. All QA-created orders have Day 3 acceptance names and comments saying technical test/no actual delivery. Temporary local cart items used for screenshots were removed afterward. Both tested browser origins ended with empty carts.

## Responsive, recovery and accessibility checks

- Homepage/catalog/product/cart/checkout/confirmation inspected at **390, 768, 1024, 1440 px**. No document overflow or page exceptions; mobile product-card buttons measured **44 px** high. Final 390 px full shopping regression is recorded above; intermediate widths were layout smoke checks, not additional order creation.
- Search: debounce confirmed one request for six rapidly typed characters; at most six suggestions. Image/name/price, empty suggestions, clear, arrow selection, Escape, selected Enter, unselected Enter/full results and clicking suggestions checked.
- Catalog price-descending ordering, in-stock filter, second-page navigation and nested fruit category were checked against rendered results. Price-descending first page ran from 35.00 down to 18.00; child category showed four fruit products.
- Final negative states repeated: empty cart/checkout, empty search, unknown product/category/UUID/invalid UUID/page with catalog navigation. Unknown page carried HTTP 404. Client-fetched detail pages provide not-found UI rather than server-rendered HTTP 404 metadata.
- Aborted catalog/product API request showed a readable failure plus Retry/catalog navigation; removing interception and Retry loaded the product. Failed demo image used `/images/products/fallback.svg`. These are deliberately simulated connectivity/image failures.
- Product/grid loading skeletons, quote pending, order pending and receipt loading feedback are present; quote/order buttons prevent duplicate pending actions. Auth/quota/outside-zone provider cases are covered by the required automated backend tests; stale quote behavior was verified in the real desktop browser flow, and abort/late-response guards were reviewed in source. Provider-error UI was separately exercised with a labeled mock.
- Checkout fields have labels; phone hint and form error are associated. Stable comment accessible name fixed a regression discovered when entering text. Keyboard Tab exposes the skip link at top 10 px with a visible focus outline. Search uses combobox/listbox state and active-descendant selection. Quantity/remove buttons name their product. Map has numeric-coordinate alternatives and Leaflet/OSM attribution.
- Meaningful product alt text, decorative hero/category illustrations, readable green/white controls and disabled/live-feedback states reviewed visually. No formal assistive-technology or complete WCAG audit was performed.

## Security and credential scan

Read configured credentials only inside the local scanning script; values were never printed. Scanned **52 deployed static files** across main/fresh web images, the two full checkout API network captures, the browser request URL log and documentation. The final count is recorded in [security verification](day-3-final/security-verification.json).

- Private **ORS key: zero matches in assets/network/reports**.
- Configured PostgreSQL password: **zero matches in browser assets/network**. Four README/progress files intentionally use the same public local demo default as `.env.example` in testing command examples; this is explicitly classified, not a hidden credential finding. Non-demo password matches would fail the scan.
- **40 captured API requests**, **zero browser Authorization headers**, **zero direct browser provider requests**. Browser traffic uses the local FastAPI endpoints plus local assets/OSM tiles.
- No public ORS-key variable or secret storage. `.env` is ignored; `.env.example` contains no private key. SecretStr config and sanitized backend errors remain intact.
- CORS allowed `http://localhost:3000`; a request from `https://untrusted.example` received no allow-origin header. Fresh CORS is independently configured for port 3002.
- Production API image does not contain `tests/browser_fixture.py`, and production imports never select mock transport. Source test harness remains available for explicit isolated testing.

## Clean-start rehearsal

Executed on final application source:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File docs/rehearse-start.ps1 -ProjectName paykar_submission_final
```

The script first proved `paykar_submission_final_postgres_data` absent, then created the separate project/network/volume/database. Default working volume was untouched. Alternate loopback ports: **3002 web / 8082 API / 5434 PostgreSQL**. Browser public API URL and API CORS origin were correctly configured for these ports.

Executed `config --quiet`, `up --build -d --wait --wait-timeout 180`, Alembic current/check, seed **twice**, service health and catalog assertion. Results: **all three healthy**, migration head/no pending operations, **7 categories / 40 products** on both seed runs, both health endpoints **200**, initial fresh orders **0**. The final mobile real-provider shopping flow then created the single persisted order and confirmation above. A third seed preserved that receipt/stock.

The script rejects existing rehearsal volumes instead of deleting them and restores temporary process environment variables. Earlier exploratory projects `paykar_submission_day3` and `paykar_submission_verified` retain their volumes and are stopped. The final rehearsal services were also stopped after verification, preserving their volume and freeing alternate ports; the normal stack remains healthy on port 3000.

## Failures found and resolved

- Initial rehearsal used a missing-volume inspect with PowerShell `ErrorActionPreference=Stop`; replaced it with checked volume listing. Windows PowerShell 5.1 `Invoke-WebRequest` needed `-UseBasicParsing`; final script completed successfully.
- Initial checkout regression exposed the controlled textarea value entering its nested label's accessible name. Added a stable accessible name, rebuilt both final images and reran all frontend checks plus the complete live flows.
- Initial broad password/document scan correctly matched public demo defaults in historical command examples. Classified these only when equal to `.env.example`; browser assets/network and private-key documentation still require zero matches.
- A few exploratory browser locators were too strict for route-announcer alerts/nested select labels; scoped selectors to main content or the observed label. Final checks passed. One shell edit/read used the wrong relative path, and one read targeted an absent conftest; corrected navigation without changing unrelated files.

**No unresolved required failures or blockers.** Deprecation notices are documented and do not suppress failed checks.

## Final screenshot index

All screenshots below show the final application source; real routes are unmocked. Credentials are absent. Viewed representative desktop/mobile images for layout and readable route/receipt evidence.

| View | Desktop | Mobile |
| --- | --- | --- |
| Homepage | [desktop](day-3-final/desktop-home.png) | [mobile](day-3-final/mobile-home.png) |
| Catalog | [desktop](day-3-final/desktop-catalog.png) | Covered by responsive/browser checks |
| Product | [desktop](day-3-final/desktop-product.png) | [mobile](day-3-final/mobile-product.png) |
| Cart | [desktop](day-3-final/desktop-cart.png) | [mobile](day-3-final/mobile-cart.png) |
| Checkout real route | [desktop](day-3-final/desktop-checkout-real-route.png) | [mobile](day-3-final/mobile-checkout-real-route.png) |
| Order confirmation | [desktop](day-3-final/desktop-confirmation.png) | [mobile](day-3-final/mobile-confirmation.png) |

## Reviewer startup and demo

The [README](../../README.md) is the self-contained setup/testing/reviewer guide. From the repository root:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Configure private ORS key and verified store coordinates in .env before route demo.
docker compose config --quiet
docker compose up --build -d
docker compose exec api python /seed/seed.py
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
```

Open **http://localhost:3000**. Reviewer path: homepage → search Яблоки → product/category links → add/edit quantity → cart/reload → checkout/name/phone/address → map/coordinates **38.5750,68.7800** → calculate delivery → inspect route/distance/ETA/fee → order → reload persisted confirmation. Expected single-apple demo total **38.00 TJS** with configured fee 20.00 and unchanged seed price 18.00. See README for local development, ports, migrations, dedicated-test-DB commands and fresh rehearsal.

## Limitations / final Definition of Done

Demo dataset/illustrations, configurable flat fee, manual coordinates, third-party routing/tile availability and quota remain deliberate limits. Guest UUID receipt links are bearer access; no accounts/payments/admin/real dispatch. Frontend duplicate-click protection is not server-side idempotency for ambiguous disconnected retries. Physical-device/Safari/Firefox/formal accessibility audits are outside the verified set. Historical plan/report snapshots remain historical. At Day 3 completion, the workspace had no Git metadata; the later GitHub handoff is recorded with the submitted revision.

| Required acceptance | Final status |
| --- | --- |
| Visibly polished shopping UI and useful UX improvements | PASS |
| Complete shopping flow and real ORS | PASS, final desktop + mobile |
| Atomic persisted order / failed cart retention / receipt reload | PASS, actual 201/422/409 and PostgreSQL joins |
| Backend checks including required database tests | PASS, 63 tests / zero skips |
| Frontend clean install/lint/typecheck/build/format | PASS |
| Compose and healthy services | PASS |
| Fresh-volume reproducible startup, migration and seed | PASS, final source and real mobile order |
| Credential/CORS/mock-fixture checks | PASS, documented public demo defaults |
| README, agent instructions, evidence and demo path | COMPLETE |
| Scope freeze / no commit / no push | HONORED |

**DAY 3 — COMPLETE. Ready for submission within the stated technical-assignment scope.**

## GitHub handoff

Added the completed project and Day 3 evidence to the existing `Human-Unit/Paykar.Shop` repository on its `main` branch at the user's request. The GitHub handoff follows the Day 3 scope completion above.
