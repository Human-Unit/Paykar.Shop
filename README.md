# Paykar demo shop

A three-day technical assignment recreating the public supermarket shopping experience with our own application and demo catalog. This is not Paykar's official website or production dataset. Day 2 adds **Cart → Checkout → Delivery map/quote → Atomic guest order → Persisted confirmation**. Real routing requires a working openrouteservice Directions API key and verified store coordinates; see the current verification status in [the Day 2 report](docs/progress/day-2-checkout-routing.md).

## Architecture

- `apps/api`: Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2.x async sessions, asyncpg, Alembic.
- `apps/web`: Next.js App Router, strict TypeScript, Tailwind CSS, npm. API data is fetched in the browser, so image builds do not require a live catalog.
- PostgreSQL 17: categories, products, UUID orders and order-item snapshots. Decimal/NUMERIC prices; money is serialized as strings.
- Docker Compose: one `postgres`, one `api`, one `web`. Alembic is the only migration authority; API runs `alembic upgrade head` before Uvicorn starts.
- Guest cart: localStorage stores only product IDs and integer quantities. Current products/prices are resolved through the API. Display uses integer cents; final totals use server-side Decimal arithmetic and current database prices.
- Routing: browser → FastAPI → lifespan-managed httpx client → openrouteservice driving-car GeoJSON. Leaflet displays the route with OpenStreetMap tiles. `OPENROUTESERVICE_API_KEY` remains API-only. `DELIVERY_FLAT_PRICE` is an independent demo fee, not a distance-based formula or official Paykar policy.
- Orders: get a fresh provider route before opening a short transaction, lock product rows in ID order, validate active state/stock/expected total, create UUID order and item snapshots, decrement stock and commit atomically. A 409 requires customer review; failed requests retain the cart. No accounts or public order listing.

## Prerequisites and Docker startup

Install Docker Desktop with Linux containers and Docker Compose. No local PostgreSQL or Python installation is required for Docker development. Start Docker Desktop before these commands.

From the repository root in PowerShell:

```powershell
# First setup only; keep an existing local .env.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up --build -d
docker compose exec api python /seed/seed.py
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
```

Open **http://localhost:3000**. Interactive API documentation: **http://localhost:8080/docs**.

The migration, seed, backend and frontend checks have been run in this workspace; full-stack/browser outcomes are recorded in [the Day 1 report](docs/progress/day-1-commerce-core.md). First startup needs network access to fetch images/packages. Container startup precedes the seed; the initial catalog is empty until seeded. Running the seed again does not duplicate records or reset existing stock/catalog edits.

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
```

Products support `q` (name/SKU), `category` (including descendants), `sort=name|price_asc|price_desc`, `in_stock`, `page`, `page_size` (maximum 48). An optional `ids=1,2,3` query resolves up to 48 cart products without persisting duplicate product records. Only active products are returned; absent/inactive product detail yields 404. User search is parameterized and `%`/`_` are treated literally. Stable ID tie-breakers keep pagination predictable. DB health uses timed `SELECT 1`; database failures are sanitized.

Pages: `/`, `/catalog`, `/catalog/[slug]`, `/product/[slug]`, `/cart`, `/checkout`. Search/filter/sort/page state lives in the URL. The guest cart supports add/remove/increment/decrement/clear, item count, line totals, subtotal, refresh persistence and safe malformed-storage handling. Limit: 48 distinct products and 99 units per product, additionally bounded by known stock when adding/incrementing. If browser storage is disabled, an action reports that the cart lasts only for the current page session.

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

Do not seed `paykar_test` or point tests at the application database. Catalog fixtures roll back; order fixtures commit owned temporary records to exercise independent sessions/concurrent requests and remove those records afterwards. Missing `TEST_DATABASE_URL` fails the required order tests; catalog integration skips are not successful database verification. Unit tests can run without PostgreSQL using `pytest -m 'not integration'`. The current full suite runs 63 tests without skips.

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

Guest checkout, routing and order APIs are implemented. No authentication, payment gateway, favorites, comparison, admin, Redis, Kafka or microservices. The broader handoff is [the three-day plan](docs/THREE_DAY_PLAN.md); the latest flat-fee specification overrides its original pricing suggestion. Day 3 is reserved for the planned regression/submission work and has not been started.

## Checkout and routing

Open `/checkout` with a nonempty cart, enter name/phone/address, then click a road-adjacent point on the map or enter latitude/longitude. Press **Рассчитать доставку**. A successful quote displays route, distance, estimated driving time and the configured flat fee. Changing address, coordinates or cart invalidates the quote; a new explicit calculation is required. Then submit the order. Successful creation clears the cart and opens `/order/[id]`; refresh retrieves the persisted snapshots from PostgreSQL. Failed quotes/orders keep the cart and current form. Confirmation is a guest receipt accessible to anyone holding its UUID link; keep that link private.

`GET /delivery/config` returns safe map configuration and fee/service-area information, never credentials. Quote input is `{address, latitude, longitude}`. Order input additionally contains `customer_name`, `phone`, optional `comment`, `items: [{product_id, quantity}]` and advisory decimal-string `expected_total`. Client prices, subtotal, distance and delivery fee fields are rejected. There is no public order listing endpoint.

ORS receives `[longitude, latitude]`; Leaflet receives `[latitude, longitude]`. Only reviewed geometry and positive finite distance/duration are returned. Provider auth/quota/unavailable errors are sanitized; no-route and outside-area responses use 422, timeout 504, invalid response 502. HTTP timeouts: connect 5s, read 12s, write/pool 5s, total deadline 20s, no retries. Orders intentionally request a fresh route before locking stock, even when the browser already has a quote.

Routing sends server-side requests to `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`, using [the ORS GeoJSON response format](https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types); the map uses [Leaflet](https://leafletjs.com/reference.html) and attributed OpenStreetMap tiles. Automatic geocoding is outside Day 2 P0. Without verified store coordinates the map uses a Dushanbe camera fallback and shows no invented store marker.

The Day 2 report distinguishes real ORS checks from automated mocked-provider tests. `tests/browser_fixture.py` is an isolated browser-test app using a dedicated test database and mock transport; production never enables it or substitutes a fake provider route.
#   P a y k a r . S h o p  
 