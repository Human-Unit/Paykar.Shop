# Paykar demo shop

A completed three-day technical assignment recreating the public supermarket shopping experience with our own application and demo catalog. This is not Paykar's official website or production dataset. **Browse/search → Cart → Checkout → Real delivery route → Atomic guest order → Persisted confirmation** works on desktop and mobile. Day 3 adds search suggestions, direct card quantities, category breadcrumbs/related products, discount merchandising and practical accessibility/recovery improvements. Final verification and screenshots are in [the submission report](docs/progress/day-3-submission.md).

## Store completion pass

**STORE COMPLETION PASS — IMPLEMENTED**

**VISUAL / INTERACTIVE ACCEPTANCE — PENDING**

The public UI now presents Paykar without prototype labels. It includes linked information pages, a complete responsive footer, branded HTTP 404 pages, actual discounted catalog products and four static RU/TJ/EN articles. Safe sandbox card payment is integrated alongside cash checkout. This remains an independent technical assignment with seeded demonstration data, no real acquiring or delivery dispatch. The latest automated/API evidence and pending manual checklist are in [the store completion report](docs/progress/store-completion-pass.md). Earlier browser acceptance covers earlier versions and does not certify these new pages/payment controls.

## Architecture

- `apps/api`: Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2.x async sessions, asyncpg, Alembic.
- `apps/web`: Next.js App Router, strict TypeScript, Tailwind CSS, npm. Catalog data is fetched in the browser. Dynamic entity routes first perform a server-only existence check; image builds do not require a live catalog.
- PostgreSQL 17: categories, products, UUID orders, order-item snapshots and sandbox payment sessions. Decimal/NUMERIC prices; money is serialized as strings.
- Docker Compose: one `postgres`, one `api`, one `web`. Alembic is the only migration authority; API runs `alembic upgrade head` before Uvicorn starts.
- Guest cart: localStorage stores only product IDs and integer quantities. Current products/prices are resolved through the API. Display uses integer cents; final totals use server-side Decimal arithmetic and current database prices.
- Routing: browser → FastAPI → lifespan-managed httpx client → openrouteservice driving-car GeoJSON. Leaflet displays the route with OpenStreetMap tiles. `OPENROUTESERVICE_API_KEY` remains API-only. `DELIVERY_FLAT_PRICE` is an independent demo fee, not a distance-based formula or official Paykar policy.
- Orders: obtain routing before transactions/stock locks, lock products in ID order, validate active state/stock/expected total, create UUID order and item snapshots, decrement stock and commit atomically. Cash creation and payment sessions accept UUID idempotency keys. Card confirmation consumes a verified server route snapshot with a 15-minute expiry and rechecks prices/stock/fee. A 409 requires customer review; failed requests retain the cart. No accounts or public order listing.

## Prerequisites and Docker startup

Install Docker Desktop with Linux containers and Docker Compose. No local PostgreSQL or Python installation is required for Docker development. Start Docker Desktop before these commands.

From the repository root in PowerShell:

```powershell
# First setup only; keep an existing local .env.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up --build -d --wait
docker compose exec api python /seed/seed.py
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
```

Open **http://localhost:3000**. Interactive API documentation: **http://localhost:8080/docs**.

The final migration, seed, backend/frontend checks, real ORS orders and fresh-volume startup were verified; see [Day 3 evidence](docs/progress/day-3-submission.md). First startup needs network access to fetch images/packages. Container startup precedes the seed; the initial catalog is empty until seeded. Running the seed again does not duplicate records or reset existing stock/catalog edits.

| Service | Host port | Container port |
| --- | --- | --- |
| Web | 3000 | 3000 |
| API | 8080 | 8080 |
| PostgreSQL | 5433 | 5432 |

Host 5433 avoids this machine's existing PostgreSQL service on 5432. Bindings are loopback-only. Change `POSTGRES_PORT`, `API_PORT`, or `WEB_PORT` in `.env` if needed. When changing web/API ports, also update `WEB_ORIGIN` and `NEXT_PUBLIC_API_URL`, then rebuild the web image: public Next.js variables are build-time configuration. The browser API URL must use a host the browser can reach, not Compose's `api` hostname.

`.env.example` contains local demo credentials, not production secrets. `.env` is ignored. Catalog/cart remain usable without routing configuration. For checkout set `OPENROUTESERVICE_API_KEY`, `STORE_ADDRESS`, `STORE_LAT`, `STORE_LON`, `DELIVERY_FLAT_PRICE` (default `20.00`) and `DELIVERY_MAX_DISTANCE_METERS` (default `20000`, driving route length). Never use a `NEXT_PUBLIC` variable for the key. `docker compose up -d api` applies changed API environment settings; `restart` alone does not. Settings safely construct the SQLAlchemy URL from PostgreSQL component variables, including passwords with special characters. An optional `DATABASE_URL` override for local development must use `postgresql+asyncpg://`.

Useful lifecycle commands:

```powershell
docker compose logs --tail 100 api web
docker compose stop
docker compose start
```

The named volume preserves data across stops/restarts. Do not run `down -v` or blindly stamp Alembic over an old schema. If you have an existing incompatible schema, inspect it and use a separate demo database/volume while preserving the original.

## Local development

The frontend can run locally against the Docker API:

```powershell
docker compose up -d postgres api
Set-Location apps/web
npm ci
# Optional override if the API host/port differs:
$env:NEXT_PUBLIC_API_URL = 'http://localhost:8080/api/v1'
npm run dev
```

Stop the Docker web container first if it already binds port 3000. Node 24 is the tested frontend runtime. Dependencies and the npm lockfile are pinned; the lockfile includes Linux and Windows optional native dependencies.

For a local API, use an explicitly selected Python 3.12 interpreter; the host's default Python may be another version. Stop the Docker API container first if it already binds 8080. From `apps/api`:

```powershell
py -3.12 -m venv .venv
.venv/Scripts/Activate.ps1
python -m pip install -r requirements.txt
alembic upgrade head
python ../../db/seed/seed.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

Settings read the root `.env` when run from `apps/api`, or explicit environment variables. If Python 3.12 is unavailable locally, use the Docker API instead. Python checks were verified in the Python 3.12 container, not with the host's default Python 3.14. Local virtualenv setup is an alternative recipe, not a claimed verification on this host.

## API and pages

Implemented API endpoints:

```text
GET /api/v1/health
GET /api/v1/health/db
GET /api/v1/categories
GET /api/v1/categories/{slug}
GET /api/v1/products
GET /api/v1/products/{slug}
GET /api/v1/delivery/config
POST /api/v1/delivery/quote
POST /api/v1/orders
GET /api/v1/orders/{uuid}
POST /api/v1/payments/sandbox/session
POST /api/v1/payments/sandbox/confirm
GET /api/v1/payments/{uuid}
```

Products support `q` (name/SKU), `category` (including descendants), `sort=name|price_asc|price_desc`, `in_stock`, `on_sale` (previous price greater than current price), `page`, `page_size` (maximum 48). An optional `ids=1,2,3` query resolves up to 48 cart products without persisting duplicate product records. Only active products are returned; absent/inactive product detail yields 404. User search is parameterized and `%`/`_` are treated literally. Stable ID tie-breakers keep pagination predictable. DB health uses timed `SELECT 1`; database failures are sanitized.

Pages: `/`, `/catalog`, `/catalog/[slug]`, `/product/[slug]`, `/cart`, `/checkout`, `/order/[id]`, `/how-to-buy`, `/payment`, `/delivery`, `/returns`, `/promotions`, `/blog`, `/blog/[slug]`, `/brands`, `/about`, `/contacts`, `/stores`. URLs remain stable across language changes. Blog slugs: `weekly-shopping`, `fruit-and-vegetables`, `delivery-guide`, `checkout-checklist`. Contacts/stores use `/delivery/config`, not invented phone/email/hours; brands honestly reports absent manufacturer data. Search/filter/sort/page state lives in the URL. The guest cart supports add/remove/increment/decrement/clear, item count, line totals, subtotal, refresh persistence and safe malformed-storage handling. Limit: 48 distinct products and 99 units per product, additionally bounded by known stock when adding/incrementing. If browser storage is disabled, an action reports that the cart lasts only for the current page session.

## Verification

With the stack running, backend commands from the repository root:

```powershell
docker compose exec api python -m compileall app
docker compose exec api ruff check .
docker compose exec api ruff format --check .
docker compose exec api alembic upgrade head
docker compose exec api alembic current
docker compose exec api alembic check
```

For real PostgreSQL integration tests, provision a **dedicated empty test database**, migrate it, and pass its URL. The following uses only local demo credentials and was executed against the provided demo configuration; replace the credentials if your local configuration differs. Create `paykar_test` only once:

```powershell
docker compose exec postgres psql -U paykar -d paykar -c 'CREATE DATABASE paykar_test;'
docker compose exec -e POSTGRES_DB=paykar_test api alembic upgrade head
docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
```

Do not seed `paykar_test` or point tests at the application database. Catalog fixtures roll back; order fixtures commit owned temporary records to exercise independent sessions/concurrent requests and remove those records afterwards. Missing `TEST_DATABASE_URL` fails the required order tests; catalog integration skips are not successful database verification. Unit tests can run without PostgreSQL using `pytest -m 'not integration'`. The current full suite runs 77 tests without skips: the existing 63 plus 13 sandbox/payment cases and a promotions-filter case.

Frontend checks from `apps/web`:

```powershell
npm ci
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Formatting: `ruff format .` in `apps/api`; `npm run format` in `apps/web`. Typecheck generates Next route types before `tsc --noEmit`. ESLint 9.39.5 is pinned because Next's included React plugin failed with ESLint 10; its upstream deprecation notice is documented, and no lint rules are suppressed.

Browser acceptance: homepage → catalog → category → search → sorting → product → add → cart → increment/decrement → refresh → remove. Also test empty search/cart, missing product, API failure, malformed storage, image fallback, and desktop/mobile layout. See [the progress report](docs/progress/day-1-commerce-core.md) for actual outcomes.

## Demo data and remaining scope

The seed contains **7 categories** (6 main categories plus a nested fruit category) and **40 active products**, with 2 intentionally out of stock. Names, prices, descriptions and stock are demo content. Six original category illustrations and an original fallback SVG are shared across products. They are authored within this project, contain no proprietary reference images and require no external image service. See [seed notes](db/seed/README.md).

Guest checkout, routing, order APIs and Day 3 polish are implemented. No authentication, payment gateway, favorites, comparison, admin, Redis, Kafka or microservices. The broader handoff is [the three-day plan](docs/THREE_DAY_PLAN.md); its assessment is historical, and the subsequent flat-fee specification overrides its original pricing suggestion. Day 3 acceptance is historical; the later store completion brief explicitly authorizes the public pages and safe sandbox payment described here.

## Checkout and routing

Open `/checkout` with a nonempty cart, enter name/phone/address, then click a road-adjacent point on the map or enter latitude/longitude. Press **Рассчитать доставку**. A successful quote displays route, distance, estimated driving time and the configured flat fee. Changing address, coordinates or cart invalidates the quote; a new explicit calculation is required. Then submit the order. Successful creation clears the cart and opens `/order/[id]`; refresh retrieves the persisted snapshots from PostgreSQL. Failed quotes/orders keep the cart and current form. Confirmation is a guest receipt accessible to anyone holding its UUID link; keep that link private.

`GET /delivery/config` returns safe map configuration and fee/service-area information, never credentials. Quote input is `{address, latitude, longitude}`. Order input additionally contains `customer_name`, `phone`, optional `comment`, `items: [{product_id, quantity}]` and advisory decimal-string `expected_total`. Client prices, subtotal, distance and delivery fee fields are rejected. There is no public order listing endpoint.

ORS receives `[longitude, latitude]`; Leaflet receives `[latitude, longitude]`. Only reviewed geometry and positive finite distance/duration are returned. Provider auth/quota/unavailable errors are sanitized; no-route and outside-area responses use 422, timeout 504, invalid response 502. HTTP timeouts: connect 5s, read 12s, write/pool 5s, total deadline 20s, no retries. Cash orders and new card sessions request a fresh route before locking stock. Card confirmation uses the verified session route within its 15-minute lifetime and never requests routing inside a transaction.

Routing sends server-side requests to `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`, using [the ORS GeoJSON response format](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types); the map uses [Leaflet](https://leafletjs.com/reference.html) and attributed OpenStreetMap tiles. Automatic geocoding is outside Day 2 P0. Without verified store coordinates the map uses a Dushanbe camera fallback and shows no invented store marker.

The reports distinguish real ORS checks from mocked-provider tests. `tests/browser_fixture.py` is an isolated browser-test app using a dedicated test database and mock transport; it is explicitly excluded from the production API image. Production always uses the real provider.

## Reviewer demo (2–4 minutes)

1. Open `http://localhost:3000`. Inspect categories and the **Сейчас выгоднее** section; inspect current/previous prices; public prototype labels have been removed, while this README documents the seed boundary.
2. Type **Яблоки** in the header. Suggestions show image/name/unit/price after a 300 ms pause. Arrow keys + Enter select a suggestion; Enter without a selection opens all results. Escape closes the list, and the clear button resets search.
3. Open **Яблоки красные, 1 кг**. Follow the category breadcrumbs or inspect the related products. Add one unit; the button becomes minus/quantity/plus. Increasing is capped by known stock.
4. Open the cart. Increase/decrease quantity, then reload to demonstrate persistence. Keep one unit and select **К оформлению**.
5. Enter a demo name, a phone such as `+992900000000`, a full delivery address and an optional comment saying this is a technical test.
6. Select a road-adjacent map point, then correct the coordinate fields to latitude **38.5750**, longitude **68.7800**. Press **Рассчитать доставку**. With the verified store at **38.562512, 68.791511**, the acceptance route returned **2,887 m / 273 s / 20.00 TJS**, displayed as **2.9 km / 5 min / 20 TJS**. Provider results may change. A store marker, destination marker and green route should all be visible.
7. Changing the point/address invalidates the quote; recalculation is explicit. Restore the test point and calculate again if you demonstrate this.
8. Press **Оформить заказ**. The server checks current route/prices/stock, persists the order and item snapshots, then the browser clears the cart. Reload the confirmation to demonstrate that it comes from PostgreSQL.

For this route, first configure the ignored root `.env` with a valid `OPENROUTESERVICE_API_KEY` and the verified store coordinates, then run `docker compose up -d api`. The default fee is `20.00`; the service-area cap is `20000` driving meters. The ETA is driving time, excluding picking/packing. Test orders remain labeled technical acceptance records; this demo dispatches no deliveries and takes no real payments; sandbox status changes never move money.

## Fresh-volume startup rehearsal

From the repository root, with Docker Desktop running and root `.env` configured:

```powershell
# Choose an unused project name. Existing volumes are deliberately rejected.
powershell -NoProfile -ExecutionPolicy Bypass -File docs/rehearse-start.ps1 -ProjectName paykar_submission_review1
```

This starts the same three services on **web 3002 / API 8082 / PostgreSQL 5434** using a separate named volume and database. It validates Compose, builds images, waits for health, runs Alembic current/check, seeds twice, checks both health endpoints and asserts 40 products. Run the reviewer flow at `http://localhost:3002`; the browser API URL and CORS origin are built/configured for these ports. It needs these alternate ports free. The script restores process environment overrides and never resets any database. The recorded final rehearsal used project `paykar_submission_final` and successfully created a real routed order. Its containers were stopped after verification; its volume remains preserved.

To stop only your rehearsal services while preserving their data:

```powershell
docker compose -p paykar_submission_review1 stop
```

For a subsequent fresh rehearsal use a different `paykar_submission_...` name. The normal project remains at `http://localhost:3000`. Existing acceptance receipts and stock remain intact after repeat seeding; do not delete volumes to remove test orders.

## Submission limitations

- 40 demo products, 7 categories and shared original SVG illustrations; no production dataset or official offers.
- Manual map selection/coordinates; no address geocoding. Routes/tiles depend on ORS/OSM access and provider quota. Store coordinates and the fee are configuration, not official delivery policy.
- Guest UUID receipts are readable by anyone holding the link. No account management, real acquiring, fulfilment/admin workflow, SMS or server-side order listing.
- Cart persists locally. Quantities are whole packages, limited to 48 distinct products and 99 units per item, with current stock rechecked by the server.
- Immediate duplicate clicks are guarded in the browser. Server UUID idempotency and row locks return the original order for repeated confirmations; a successful payment cannot create another order. The frontend retains attempt/session IDs while checkout stays open; a full checkout reload resets that in-memory attempt and customer form. This is a local sandbox, not a hardened public payment service.
- Earlier responsive Chromium checks cover earlier shopping versions. Visual/interactive acceptance of the new footer, pages and sandbox is pending because no Codex Browser is connected. Missing page/blog/product/category/order resources now return branded HTTP 404; recoverable API failures retain retry UI. Physical-device, Safari/Firefox and formal accessibility certification were not performed.
- Upstream ESLint 9 and Starlette/AnyIO deprecation notices remain. Checks pass without suppressions; npm ci reported zero vulnerabilities. The local database password in `.env.example` is intentionally a public demo default; private ORS credentials remain server-only.

The daily reports and [final screenshots](docs/progress/day-3-final) provide the handoff evidence.

## Safe sandbox card payment

Choose **Банковской картой** after entering customer details and calculating delivery. The card panel prominently says **Тестовая оплата — Не вводите данные настоящей банковской карты**. Click a synthetic scenario to fill the form. Do not enter any real banking information.

| Number field | Backend result |
| --- | --- |
| `SUCCESS` | Finalizes exactly one paid order |
| `DECLINED` | Declined; no order, cart/form/point/quote remain |
| `INSUFFICIENT` | Insufficient funds; no order, retry allowed |
| `ERROR` | Processing error; no order, retry allowed |

The other synthetic fields must be expiry `12/99`, CVV `000`, and holder `SANDBOX`. These UI fields are never sent to the API, stored or logged. The confirmation request carries only the UUID payment ID and a whitelisted scenario. There is no real bank, payment SDK or external payment request.

`POST /payments/sandbox/session` validates a card checkout, current products and Decimal totals, obtains a real route outside the transaction, and persists a server-owned payment/checkout/quote snapshot. The amount/currency are authoritative (`NUMERIC(12,2)`, `TJS`). `POST /payments/sandbox/confirm` locks that record, validates fingerprint/amount/currency/status/expiry and delegates its deterministic outcome to `SandboxPaymentProvider`. Success rechecks stock/current prices and commits the payment, paid order, item snapshots and stock together. Failure commits only payment status. Concurrent/repeated successful confirmation returns the original order. The session can be retried after decline/error and expires after 15 minutes; stock is not reserved at session creation.

Cash retains the same guest order behavior and is marked `cash / due_on_delivery`. Card confirmation is marked `card / paid`; these values persist on the receipt. A method or theme/language change does not request routing. Address/point/cart changes still invalidate the delivery quote.

No new sandbox environment variables or credentials are required. Configure the existing API-only ORS/store/flat-fee values for routing. `API_INTERNAL_URL` is optional and server-only in local Next development; Compose supplies `http://api:8080/api/v1` for missing-entity checks. `NEXT_PUBLIC_API_URL` remains the browser-reachable API base.

Sandbox payment UUID detail endpoints and order receipts are guest bearer links. This assignment has no real bank integrations, account authorization, fraud controls, payment reconciliation, automated cancellation/refund or shipping workflow. No card values appear in payment/order metadata. PostgreSQL integration tests verify successful, failed, concurrent, tampered, expired and rollback cases separately from real-provider/API smoke checks.
