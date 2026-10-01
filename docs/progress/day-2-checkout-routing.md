# Day 2: checkout, delivery routing and guest orders

Date: 2026-10-01, Asia/Tashkent. Workspace: `C:\Workshop\Paykar\Test_Task_Paykar_Shop`.

## Status and acceptance gate

**DAY 2 — COMPLETE**

The previous ORS 403 blocker is resolved. A real quote through the rebuilt FastAPI backend and HeiGIT endpoint succeeded, the Docker browser displayed the real route, and a real guest order was persisted in the application PostgreSQL database. Confirmation survived reload. All 63 backend tests ran without skips, frontend checks passed, and all three Docker services are healthy. Earlier mocked-provider results remain identified separately below; final acceptance uses real ORS, without a production mock or fabricated response.

Day 3 has not started. No commit or push was performed. The directory still has no Git repository; `.env` is covered by `.gitignore` for future Git use and excluded from Docker build contexts. Existing data was preserved.

## Implemented functionality

- Guest checkout: name, phone, address, optional comment, cart items and amounts.
- Leaflet/OpenStreetMap map with attribution, verified configured store marker, customer marker, manual click selection and coordinate correction.
- Explicit delivery calculation, route fitting, human-readable distance/time, independent flat delivery fee.
- Coordinate/address edits invalidate the quote even when the customer restores an earlier point. Changed cart contents also invalidate it. In-flight location calculations are aborted on edits; late results cannot reactivate a stale quote.
- Disabled submission until current quote, valid customer details and available cart quantities; immediate duplicate-click guard and pending feedback.
- Useful provider/outside-area/stock/price/database error messages. Failed requests retain form and cart; successful order response clears cart and navigates to a UUID confirmation.
- Confirmation fetches persisted order-item snapshots and survives reload, with ID, name, address, items, amounts, distance, driving ETA, status and creation time. Phone is excluded from the public response. Unknown UUID has a useful not-found state.
- Responsive single-column checkout on mobile; sticky order summary on desktop; visible labels, focus styles and live delivery/error feedback.

No geocoding, authentication, payments, admin, account schema or additional infrastructure was introduced. Existing schema already supports all Day 2 fields; no new migration was necessary.

## Architecture and API contracts

```text
Browser / Next.js
  ├─ checkout and explicit quote/order requests → FastAPI
  │    ├─ reused lifespan httpx.AsyncClient → openrouteservice
  │    └─ short SQLAlchemy transaction → PostgreSQL
  └─ Leaflet → attributed OpenStreetMap tiles
```

`POST https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson` is server-only. The delivery service constant and the rebuilt container's runtime import both use this endpoint, and the provider unit test asserts this exact request URL. ORS/GeoJSON coordinates are `[longitude, latitude]`; map polylines explicitly convert to Leaflet `[latitude, longitude]`.

New endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/v1/delivery/config` | Safe public map configuration, configured availability, flat fee and service-area limit; no key |
| POST | `/api/v1/delivery/quote` | Address and coordinate input; reviewed route GeoJSON, positive distance/duration and decimal-string fee |
| POST | `/api/v1/orders` | Atomic server-authoritative guest order; 201 with UUID receipt |
| GET | `/api/v1/orders/{uuid}` | Persisted guest receipt; 404 for unknown UUID |

There is no public order list: GET `/api/v1/orders` returns 405.

The order request accepts `customer_name`, `phone`, `address`, optional `comment`, `latitude`, `longitude`, `items: [{product_id, quantity}]` and required advisory `expected_total`. Additional price/fee/subtotal fields are rejected. Integer quantities are bounded to 99 per product, including aggregated duplicate lines; at most 48 lines. Customer text is trimmed and bounded; phone must contain 7–15 ASCII digits with permitted formatting. Coordinates must be finite and within geographic bounds.

Provider handling validates GeoJSON collection/feature/LineString types, bounded finite geometry, at least two distinct points, positive finite metrics and the configured driving-distance limit. Only our own response contract is serialized; provider metadata/errors are discarded. Connect timeout 5s, read 12s, write/pool 5s and total deadline 20s. No implicit retries or secret logging.

Error classes: missing configuration 503; provider 401/403 → sanitized `provider_auth` 503; quota 429 → `provider_quota` 503; timeout 504; unavailable/network error 503/502; malformed successful response 502; no route/outside service area 422. CORS remains scoped to configured `WEB_ORIGIN`.

`DELIVERY_FLAT_PRICE` remains separate from provider metrics. `DELIVERY_MAX_DISTANCE_METERS=20000` is the demo default service-area rule, not an official Paykar policy. Store coordinates come from server configuration; an unconfigured map uses only a Dushanbe camera fallback, without inventing a store location.

Provider/map references consulted: [official ORS response formats](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types), [Leaflet reference](https://leafletjs.com/reference.html).

## Real ORS feasibility and browser result

The user configured an active key in ignored root `.env` and authorized this customer point: latitude **38.5750**, longitude **68.7800**. Acceptance was resumed on 2026-10-01 after the user verified provider access manually. No key was printed or placed in browser configuration.

Configured store point: latitude **38.562512**, longitude **68.791511**, address `Ayni Street 16B, Dushanbe, Tajikistan`. The real server-side request uses `[[68.791511,38.562512],[68.7800,38.5750]]`.

**Result: HTTP 200 through `POST /api/v1/delivery/quote`, using the rebuilt backend and HeiGIT endpoint.**

| Field | Verified result |
| --- | --- |
| Route | GeoJSON `FeatureCollection`, one `LineString`, **51 coordinate pairs** |
| Geometry validation | Finite geographic coordinates, nonempty valid route |
| Distance | **2,887 meters**, browser displays **2.9 km** |
| Duration | **273 seconds**, browser displays **5 min** |
| Independent delivery price | **`"20.00"` TJS** |
| Selected destination | **latitude 38.5750, longitude 68.7800**, preserved in response |
| Map | Real provider polyline, store/customer markers, OSM attribution |

The browser performed the real flow: cart → checkout → customer details → map selection/manual correction → calculate → real route/distance/ETA/fee → create order → confirmation → reload. The final rebuilt web image was also checked with a real quote after the responsive-map fix, followed by reloading the persisted receipt. No provider request/response was mocked during these acceptance checks.

Browser requests went only to FastAPI; no browser ORS/HeiGIT requests or Authorization headers were observed. Exact-match scanning of the configured ORS key and database password found **zero matches in 25 deployed browser static files and in the captured five API requests/five responses**. Network capture stays under ignored `.cache`; public evidence files contain only reviewed quote/receipt data, with no credentials.

**No remaining Day 2 acceptance blocker.** The earlier 403 was a historical failed verification attempt and is superseded by the successful real-provider evidence above. Real evidence: [quote JSON](day-2-real-quote.json), [receipt JSON](day-2-real-order.json), [desktop route](day-2-desktop-real-route.png), [mobile route](day-2-mobile-real-route.png), [mobile confirmation](day-2-mobile-real-confirmation.png).

Two narrowly scoped acceptance fixes were made: switch the provider URL to HeiGIT and include the route plus actual store/customer markers in map bounds, refitting without animation on resize. Provider endpoints may snap to roads; marker coordinates remain the selected/configured points. This prevents desktop-to-mobile resizing from clipping the store marker or route. After rebuilding, both marker rectangles were asserted inside the map at 1440px and 390px, with one route path and no horizontal overflow.

## Order transaction and PostgreSQL evidence

1. Pydantic validates input and item quantities are aggregated before routing.
2. A fresh authoritative provider quote is acquired before any order database query/transaction/row lock. Tests assert the request session is not in a transaction during provider work.
3. A short transaction selects products with `FOR UPDATE`, ordered by product ID.
4. Validate all products exist, are active and have enough stock.
5. Calculate line totals/subtotal/final total using database Decimal prices and the independent configured fee.
6. Compare advisory `expected_total`; mismatch returns 409 with refreshed items, totals and quote, with no order or stock change.
7. Insert order, item name/quantity/price/line-total snapshots and decrement stock in the same transaction.
8. Commit before returning success. Any validation/database failure rolls everything back.

Tests verified successful persistence and stock reduction; snapshot retrieval after changing live product name/price; missing/inactive/insufficient products; tampered client price fields; changed-price review/resubmission; no writes on provider timeout; rollback after order INSERT when item persistence raises a database error. Concurrent requests for the last item yield one 201 and one 409, with exactly one order and stock zero.

Automated browser fixture orders were independently queried through psql in `paykar_test`:

- `e44ee941-be5d-4632-990a-85790d2665be`: snapshot price 10.50, fee 20.00, total 30.50, quantity 1.000, stock 9.000.
- Final rebuilt-web run `c0af0264-bce1-494b-8d62-489a10348b1f`: snapshot price 12.50, total 32.50, stock 9.000; confirmation reloaded successfully.

These are test-only examples with mocked provider routes, not live customer orders. The temporary container was stopped gracefully, removing its owned fixture records. Final psql counts in `paykar_test`: **orders 0, items 0, products 0, categories 0**. The application catalog and production stock were not changed by these order tests.

### Real acceptance order in application database

Order **`2d7dbacf-56ad-4b91-ba9d-40555f322ca2`** was created through the real Docker browser/API with HTTP **201**, using real ORS. Created at **2026-10-01 21:59:28 Asia/Tashkent** (`16:59:28Z`). Independent `psql` queries against application database `paykar` confirmed exactly one order and its persisted item snapshot:

| Persisted field | Value |
| --- | --- |
| Customer | `Day 2 Acceptance` (test data) |
| Destination | latitude 38.5750, longitude 68.7800 |
| Item | Product 1, `Яблоки красные, 1 кг`, quantity **1.000** |
| Snapshot unit/line price | **18.00 / 18.00 TJS** |
| Subtotal / delivery / total | **18.00 / 20.00 / 38.00 TJS** |
| Distance / driving duration | **2887m / 273s** |
| Status | `pending` |
| Product stock before → after | **13.000 → 12.000** |

The test order is retained for review at `http://localhost:3000/order/2d7dbacf-56ad-4b91-ba9d-40555f322ca2`; its comment identifies it as a technical test with no actual delivery requested. No additional order was created during the final map regression.

Before successful creation, an automated browser test deliberately changed only the outbound phone to an invalid value; the real backend returned 422 (not a mocked response). The cart remained at one item, the original valid name/phone/address stayed in the form, and retry was available. Before forwarding the real 201 acknowledgement to the browser, the cart was independently observed still containing product 1 × 1. Only after success did it become count **0**, stored items **[]**, and navigate to confirmation. Two immediate submit clicks produced exactly **one successful POST/order**. Confirmation reloaded with identical persisted contents, including after the final web rebuild. No page exceptions were observed in this acceptance flow.

## Automated checks actually executed

| Command | Final result |
| --- | --- |
| `docker compose exec api python -m compileall app` | PASS |
| `docker compose exec api ruff check .` | PASS |
| `docker compose exec api ruff format --check .` | PASS, 34 files already formatted |
| `docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q` | PASS, **63 tests, no skips** (40 unit and 23 PostgreSQL integration cases) |
| `docker compose exec api alembic upgrade head` | PASS |
| `docker compose exec api alembic current` | PASS, `0001_foundation (head)` |
| `docker compose exec api alembic check` | PASS, no new upgrade operations |
| `npm run lint` from `apps/web` | PASS, no rule suppression |
| `npm run typecheck` | PASS, generated Next route types + strict tsc |
| `npm run build` | PASS, including `/checkout` and `/order/[id]` |
| `npm run format:check` | PASS |
| `docker compose config --quiet` | PASS; no secret-expanded configuration printed |
| `docker compose up --build -d` | PASS; both Day 2 images rebuilt, including a final rebuild after quote-invalidation changes |
| `docker compose ps` | PASS; postgres/api/web healthy, loopback 5433/8080/3000 |
| GET `/api/v1/health`, `/api/v1/health/db` | PASS, 200 running/connected after final rebuild |
| Public-asset credential scan | PASS, 25 deployed static files, zero matches for configured ORS key or database password |

Other executed commands: `npm install --save-exact leaflet@1.9.4`, `npm install --save-dev --save-exact @types/leaflet@1.9.21`, Linux lockfile resolution with Node 24 container, `npm run format`, container `ruff format .` and `ruff check --fix --no-cache`. Docker npm ci succeeded with the cross-platform lockfile.

Acceptance rerun after the HeiGIT change: API `compileall`, Ruff check/format, full `pytest` (**63 passed, no skips**) and Alembic current all passed. After the map-bounds change, `npm run lint`, `typecheck`, `build`, `format:check` all passed. `docker compose config --quiet`, `docker compose up --build -d api` and `docker compose up --build -d web` succeeded; final `docker compose ps` showed all three services healthy, and both health endpoints returned 200. No frontend checks are inferred from the earlier build: they were rerun on the final map source. Final deployed static files were copied and rescanned after the final web rebuild.

The test fixture used a temporary loopback-only container and a real dedicated PostgreSQL database:

```powershell
docker compose run --rm -d --no-deps --name paykar-day2-browser-fixture `
  --volume "${PWD}/apps/api:/app:ro" --publish 127.0.0.1:8081:8080 `
  -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test `
  api uvicorn tests.browser_fixture:app --host 0.0.0.0 --port 8080
# Playwright forwards API requests to 8081 for this isolated automated test only.
docker stop --timeout 10 paykar-day2-browser-fixture
```

`tests/browser_fixture.py` requires a `_test` database, owns/cleans its rows, and uses httpx MockTransport; the production app never imports it. Do not run the catalog suite while this fixture is active: catalog test assertions expect only their own two categories. The final full pytest suite ran after fixture teardown.

## Browser and mobile checks

Playwright controlled the real Docker-built web UI. Day 1 regression before implementation: health/database health, catalog SKU search `DEMO-001`, product detail, add to cart, cart page and persistence after reload all passed.

| Scenario | Result and scope |
| --- | --- |
| Production quote with configured key/customer point | **PASS**, real HeiGIT provider, API 200, 51-point route, 2887m/273s/20.00TJS |
| Catalog → product → cart → checkout → route → order → confirmation → reload | **PASS on production Docker API/web with real ORS and application PostgreSQL**; earlier isolated mock run remains separate evidence |
| Map click and manual coordinates | PASS, selected coordinate fields/marker update |
| Route polyline and metrics | **PASS with real ORS**, one route path, both markers visible, formatted 2.9km/5min/20.00TJS; earlier mock metrics were synthetic |
| Change location after quote | PASS, route removed, order disabled, explicit re-quote required |
| Restore an earlier point after editing | PASS on final rebuilt web, old quote remains invalid, zero stale route paths |
| Empty checkout | PASS, useful empty-cart state |
| Invalid name/phone/address, missing location | PASS, actions disabled and useful guidance |
| Outside-area error | PASS, deliberately intercepted 422 response; cart retained |
| Order API unavailable | PASS, deliberately intercepted 503 response; name/address/cart retained and retry available |
| Changed database product price after quote | PASS, real test-API 409, refreshed total shown, re-quote/review required |
| Stock becomes unavailable after quote | PASS, real test-API 409, cart/form retained, refreshed stock disables submission |
| Immediate duplicate submit clicks | PASS, exactly one POST and one test order |
| Real backend rejects invalid outbound phone | PASS, actual 422, cart/name/phone/address preserved, retry succeeds |
| Cart clearing timing | PASS, one stored item before real 201 acknowledgement; count zero/items empty after success |
| Unknown UUID confirmation | PASS, useful 404 state |
| 390×844 mobile checkout/route/confirmation | PASS with real route and real persisted receipt, single-column form/map/summary, both markers inside map, no horizontal overflow |
| 1440px desktop checkout | PASS with real route; desktop-to-mobile resize refits route and both markers without clipping |

Successful fixture flow reported no JS errors or warnings. Negative scenarios produced expected HTTP error console entries (403 mapping/422/409/503/404), not unhandled application exceptions. Playwright selectors were corrected after initial exact-phone-label and generic-alert matches were ambiguous; those were test-script issues, not application failures.

Screenshots were captured and desktop/mobile checkout images visually inspected:

- [Real production route, desktop](day-2-desktop-real-route.png)
- [Real production route, mobile](day-2-mobile-real-route.png)
- [Real persisted order confirmation, mobile](day-2-mobile-real-confirmation.png)
- [Real quote JSON](day-2-real-quote.json)
- [Real receipt JSON](day-2-real-order.json)

Historical initial-run screenshots, retained only as earlier failure/mock evidence:

- [Production mobile provider error](day-2-mobile-checkout.png)
- [Production desktop provider error](day-2-desktop-live-provider-error.png)
- [Mocked route, desktop](day-2-desktop-route-fixture.png)
- [Mocked route, mobile](day-2-mobile-route-fixture.png)
- [Persisted test confirmation, mobile](day-2-mobile-confirmation-fixture.png)

Fixture geometry/metrics are synthetic automated-test data. Screenshots labeled fixture must not be presented as evidence of real ORS coverage.

## Failures corrected and remaining warnings

- Initial feasibility helper had a Python syntax error before any HTTP request; corrected helper then made the real request and obtained 403.
- Initial bind-mounted Ruff run could not write its cache as the container user; used task-scoped root formatting/no-cache for the mount. Final checks passed as the normal image user.
- Initial pytest: 58 passed, 2 failed. Fixed stable three-decimal quantity serialization across POST/GET and isolated settings-unit-test environment from the newly configured store variables. Final suite passes all 63.
- Ruff initially reported formatting/line-length errors; formatted sources. An intermediate image retained a pre-format test file; final image was rebuilt and final format check passed.
- Dependency notices remain: pinned ESLint 9 upstream deprecation and Starlette/AnyIO BlockingPortal deprecation warning. They did not cause final checks to fail. No TypeScript/lint suppression was added.
- **Resolved:** initial real ORS HTTP 403. Updated credentials and the HeiGIT endpoint now pass real quote/order acceptance; there is no remaining provider blocker.
- Acceptance browser-capture helpers initially assumed VM globals/imports persist across tool calls; corrected to an in-call capture and Playwright download. These test-script limitations did not cause application failures or leak credentials.
- Real mobile review found route/marker clipping after viewport resize; fixed bounds to include both markers and refit on resize. Final desktop/mobile browser assertions pass.

## Files created/changed

```text
.env.example                         # service-area limit and ORS guidance
docker-compose.yml                   # API-only service-area setting
AGENTS.md                            # authorized Day 2 rules, transaction/verification boundaries
README.md                            # routing configuration, checkout, orders, test/start instructions
apps/api/
  app/main.py                        # managed httpx lifetime, sanitized delivery/database errors
  app/core/config.py                 # bounded fee and service-area configuration
  app/api/router.py
  app/api/routes/{delivery,orders}.py # new
  app/schemas/{delivery,order}.py     # new
  app/services/{delivery_service,order_service}.py # new
  tests/__init__.py                  # new
  tests/test_delivery.py             # new
  tests/test_orders.py               # new
  tests/browser_fixture.py           # new, isolated verification only
  tests/test_unit.py                 # settings-environment isolation
apps/web/
  package.json, package-lock.json    # Leaflet and type dependencies
  src/lib/{api,format}.ts
  src/app/globals.css
  src/app/checkout/page.tsx
  src/app/order/[id]/page.tsx         # new
  src/components/{checkout,delivery-map,order-confirmation}.tsx # new
  src/components/{cart-page,shell}.tsx
docs/progress/
  day-2-checkout-routing.md           # this report
  day-2-*.png                        # five historical failure/mock screenshots
  day-2-{desktop,mobile}-real-route.png # real-provider acceptance screenshots
  day-2-mobile-real-confirmation.png
  day-2-real-{quote,order}.json       # reviewed public evidence, no credentials
```

## Startup and Day 3 boundary

```powershell
Set-Location C:\Workshop\Paykar\Test_Task_Paykar_Shop
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Preserve the existing .env; set active ORS key and verified store coordinates privately.
docker compose config --quiet
docker compose up --build -d
docker compose exec api python /seed/seed.py
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
# Open http://localhost:3000
```

The configured key and verified store coordinates now work; no blocker-recovery action is pending. Future API environment changes require `docker compose up -d api` to recreate the container. Keep credentials out of chat, browser code, docs and logs. Do not overwrite `.env` with the example or reset data volumes.

Remaining Day 3 work, once separately authorized: planned full regression, presentation/accessibility polish within existing scope, clean setup rehearsal, documentation/demo preparation and final submission evidence. Optional geocoding must not delay P0. **The Day 2 live gate is satisfied; DAY 2 — COMPLETE.** No Day 3 implementation was undertaken here. No commit or push was made.
