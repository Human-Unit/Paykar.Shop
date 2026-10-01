# Day 1 — commerce core

Date: 2026-10-01 (Asia/Tashkent).

**Status: Day 1 commerce acceptance passed on the running Docker stack.** Browse → Search → Product → Add → Edit → Reload was tested in a real browser. Day 2 checkout/routing/order functionality has not begun. No commit or push was performed; this workspace has no `.git` repository.

## Implemented files and features

| Area | Files / behavior |
| --- | --- |
| Instructions | `AGENTS.md`: corrected stack to Python/FastAPI/SQLAlchemy/Alembic, simple architecture, API-only ORS secrets, flat demo delivery price, Day 1 boundary, relevant checks and no commit/push. |
| API configuration | `apps/api/app/core/config.py`: Pydantic Settings; component PostgreSQL settings or async URL override, masked secrets, validated ports/coordinate pairs/finite coordinates, nonnegative Decimal flat delivery price. |
| API lifecycle/database | `apps/api/app/main.py`, `app/core/database.py`: lifespan-owned async engine/session factory, disposal, per-request sessions, bounded connection timeout, explicit web-origin CORS and sanitized database/driver errors. |
| API routes/schemas | `app/api/routes/{health,categories,products}.py`, router and output schemas: both health routes, stable categories, category/product detail, name/SKU search, descendant category filter, allowlisted sorts, in-stock filter, bounded pagination, batched cart-ID lookup, inactive exclusion and 404s. |
| Models | `app/models/{base,category,product,order,order_item}.py`: complete four-table schema, decimal amounts, UUID guest-order IDs, nullable comment; no order/checkout endpoints. |
| Alembic | `apps/api/alembic.ini`, `alembic/env.py`, `alembic/versions/0001_foundation.py`: initial PostgreSQL migration, constraints/indexes, product update trigger, explicit downgrade. |
| Backend checks | `apps/api/requirements.txt`, `pyproject.toml`, `tests/test_unit.py`, `tests/test_catalog.py`: pinned dependencies, Ruff, pytest unit and real PostgreSQL integration tests. |
| Demo data | `db/seed/products.json`, `seed.py`, README: idempotent inserts by slug/SKU; repeat runs preserve existing catalog changes and stock. |
| Frontend configuration | Existing Next/TypeScript/Tailwind/PostCSS/ESLint config completed, dependencies pinned, `package-lock.json` generated with native optional dependency entries for Windows/Linux, route type generation added to typecheck. |
| Frontend API/cart | `apps/web/src/lib/{api,format}.ts`, `src/context/cart.tsx`: typed browser client, abort/stale-response handling, retry, ID/quantity-only localStorage, safe malformed data, stock-aware controls, count and integer-cent display totals. |
| Frontend shell/pages | `src/components/*`, `src/app/*`: strip, placeholder branding, green header/search/catalog/cart/nav/footer, homepage hero/categories/API products, catalog/category/product routes, cart and safe checkout placeholder, loading/error/empty/not-found states and favicon. |
| Assets | `apps/web/public/images/products/*.svg`: six original generic demo category illustrations and fallback; no scraped catalog images. |
| Infrastructure/docs | Python 3.12 API Dockerfile, Next standalone Dockerfile including `public`, Docker ignores, Compose, `.env.example`, `.gitignore`, root README, this report and screenshots. |

The shopping UI uses Russian to follow the public storefront direction. All catalog content/prices are clearly demo data; the branding is a text placeholder and the site identifies itself as independent. Original generic SVGs are shared across products instead of sourcing 40 images.

## Architecture and scope decisions

- One FastAPI backend. Read routes use SQLAlchemy sessions directly; no unused repositories or empty service layers.
- Alembic is the sole schema authority. Removed standalone SQL migrations and their PostgreSQL init mount. No `create_all` startup schema creation.
- API startup migrates before serving. Uvicorn is executed as the container process for graceful signal handling; lifespan disposes the engine.
- Decimal/NUMERIC monetary fields; JSON money values have two decimal places as strings. Frontend line/subtotals use cents, not accumulated floating-point prices.
- Category schema supports nesting; seed has one child category. Descendant filtering uses a parameterized recursive CTE with `UNION` so it terminates even if existing category data contains a cycle.
- Product queries exclude inactive records and have a stable ID tie-breaker. Search escapes literal wildcard characters. Optional `ids` query serves at most 48 cart products.
- Cart stores only `{product_id, quantity}`; product details/current prices come from the API. `useSyncExternalStore` provides a stable empty server snapshot, avoiding hydration mismatch. Unknown products remain removable; changed stock displays a warning.
- Cart supports up to 48 distinct items, at most 99 pack/item units each, and caps add/increment against fetched stock. Existing invalid persisted quantities are filtered/capped; malformed JSON is safe. Browser storage failure falls back to an explicitly reported in-memory session cart.
- The newest Day 1 request overrides the earlier proposed distance-based formula: only `DELIVERY_FLAT_PRICE=20.00` is configured. No routing/delivery price calculation is implemented today.
- PostgreSQL host port is **5433** because unrelated existing services bind 5432 and 55432 on this machine. Their processes/data were untouched. Containers still use `postgres:5432`.
- SQLAlchemy URL construction escapes credentials. Compose provides component variables rather than concatenating passwords into an unescaped URL.
- Only public API base enters the frontend build. ORS key/address/coordinates/flat fee stay in API configuration. Frontend source/built chunks were searched for the ORS key variable with no matches.

## Removed obsolete implementation

Removed these 11 Go source/module files:

```text
apps/api/go.mod
apps/api/cmd/api/main.go
apps/api/internal/category/doc.go
apps/api/internal/config/config.go
apps/api/internal/config/config_test.go
apps/api/internal/database/database.go
apps/api/internal/delivery/config.go
apps/api/internal/http/router.go
apps/api/internal/http/router_test.go
apps/api/internal/order/doc.go
apps/api/internal/product/doc.go
```

Replaced `apps/api/Dockerfile` with Python, corrected environment/Compose/instructions, and removed `db/migrations/001_foundation.up.sql` and `.down.sql` after translating their design into Alembic. File inspection found **zero `.go` files**. No Go dependencies were installed/repaired.

Optional removal of now-empty legacy directories was rejected by automatic approval review with only `blocked by policy` as the stated reason. They remain empty; they contain no alternate backend or migration implementation. This does not block the application.

## Database, migration and seed status

- Docker Desktop started successfully with Linux containers.
- The Compose PostgreSQL volume was newly created during this task; initial migration applied to the fresh `paykar` database.
- `alembic upgrade head` passed; `alembic current` reports **`0001_foundation (head)`**.
- `alembic check` passed: **No new upgrade operations detected.** Models and live schema agree for Alembic's comparison.
- Four application tables are present, including UUID `orders.id`/`order_items.order_id`, nullable comment, numeric/check/FK/index definitions and timestamp trigger.
- Created a separate empty **`paykar_test`** PostgreSQL database, applied the same Alembic migration and ran all integration tests there. No SQLite substitute.
- Seed repeated multiple times, including twice consecutively after the final build. Each run reported **7 categories, 40 products**; no duplicates. Six root categories plus nested fruit; 40 active products, 38 in stock and 2 intentionally unavailable.
- Final SQL counts in the application DB: **categories 7, products 40, orders 0**. After fixture rollback, test DB counts are **categories 0, products 0**.
- No real ORS secret was created. Local ignored `.env` was copied from the demo example.

## Actual verification results

All final required Day 1 checks below passed. Tests used Python **3.12.14** inside Docker; frontend host Node **24.13.0** and npm **11.6.2**. Docker Linux Node 24 also built the production frontend.

| Command (root unless noted) | Final outcome |
| --- | --- |
| `docker desktop start` | Passed; engine available. |
| `docker compose config --quiet` | Passed. |
| `docker compose up --build -d --wait` | Passed; postgres, api, web all healthy. Both application images built. |
| `docker compose ps` | Passed; web 3000, API 8080, Postgres host 5433, all loopback-bound. |
| `docker compose exec api python -m compileall app` | Passed in Python 3.12. |
| `docker compose exec api ruff check .` | Passed. |
| `docker compose exec api ruff format --check .` | Passed; 24 files already formatted. |
| `docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q` | **18 passed**, no skips; 14 unit cases and 4 PostgreSQL integration tests. |
| `docker compose exec api alembic upgrade head` | Passed. |
| `docker compose exec api alembic current` | Passed; `0001_foundation (head)`. |
| `docker compose exec api alembic check` | Passed; no new operations. |
| `docker compose exec -e POSTGRES_DB=paykar_test api alembic upgrade head` | Passed on dedicated test DB. |
| `docker compose exec api python /seed/seed.py` (twice consecutively) | Passed; 7/40 on both runs. |
| `Invoke-RestMethod http://localhost:8080/api/v1/health` | Passed: status ok, service paykar-api. |
| `Invoke-RestMethod http://localhost:8080/api/v1/health/db` | Passed: status ok, database connected. |
| SQL counts through `docker compose exec postgres psql ...` | Passed; 7 categories, 40 products, no orders; test fixture records rolled back. |
| `npm ci` in `apps/web` | Passed on Windows with final cross-platform lockfile; also passed in Linux image build. |
| `npm run lint` in `apps/web` | Passed with maximum warnings 0; no lint rule suppression. |
| `npm run typecheck` in `apps/web` | Passed, including generated Next route types and strict tsc. |
| `npm run build` in `apps/web` | Passed; all six required page routes and icon generated/compiled. |
| `npm run format:check` in `apps/web` | Passed. |
| Playwright MCP browser checks | Passed on actual Docker stack, detailed below. |
| Source inspection for `.go`, competing schema creation, `any`, build-error suppression and ORS key variable in browser code/chunks | No Go files, competing schema code, blanket any, suppression or ORS key variable in browser code/chunks found. |

Formatting was also applied through Ruff to API/seed source and through Prettier to frontend source/config. Seed lint/format checks passed against the same Ruff config using a temporary writable verification mount; the application's normal seed mount remains read-only.

One third-party pytest deprecation warning remains: Starlette's TestClient references AnyIO's deprecated `BlockingPortal` alias. Tests all pass; no warning filter was added. npm reports the pinned ESLint 9 version as deprecated. ESLint 10 was attempted but incompatible with Next's included React lint plugin; final lint uses the working pinned 9.39.5. npm install/ci audit output reported zero vulnerabilities; that output is not an independent security audit.

## Failures encountered and corrected

| Initial failure | Correction / final status |
| --- | --- |
| PostgreSQL publish on host 5432 denied because existing services bind it | Verified 5433 available, updated example/default and ignored local config; stack starts without touching unrelated services. |
| Ruff found line lengths/import ordering before initial format | Applied formatter/import fixes; final checks pass. |
| Attempted format of normal read-only `/seed` mount failed | Used a separate temporary writable verification mount for source formatting; normal seed mount remains read-only. |
| Initial seed evaluated an invalid `/seed` parent index in Docker | Made container/local import path branches lazy; repeated seed now passes from `/seed` and is cwd-independent for imports/data. |
| ESLint 10 crashed with `contextOrFilename.getFilename is not a function` in React plugin | Pinned compatible ESLint 9.39.5; final lint passes. |
| PostCSS anonymous default export triggered lint warning (warnings are errors) | Named the exported config; final lint passes. |
| API Ruff cache permission error under nonroot runtime user | API image now assigns `/app` ownership to its nonroot user; normal `exec api ruff ...`, compileall and pytest pass without root. |
| Linux `npm ci` rejected Windows-generated lockfile, missing `@emnapi/runtime`/`core` entries | Regenerated lockfile using Node 24 Linux in an isolated clean directory; Windows and Linux `npm ci` now both pass. |
| Browser initially requested nonexistent favicon | Added original `src/app/icon.svg`; final document references the valid icon. |
| First mobile smoke timed out while API containers were being rebuilt | Waited for healthy services, reran complete mobile flow; passed with no page errors. No final smoke overlaps a rebuild. |
| `git status --short` | Still fails because workspace is not a Git repository. No Git setup/commit/push attempted; not an application blocker. |
| Empty legacy-directory cleanup | Automatic approval review rejected optional removal; empty folders left in place, all implementation files removed. |

No required Day 1 application/check failure remains unresolved.

## Browser smoke evidence

Executed through the available Playwright browser against **http://localhost:3000** and real FastAPI/PostgreSQL, not mocked successful catalog data.

| Scenario | Result |
| --- | --- |
| Homepage | 8 seeded API products, 6 main category cards; images loaded. |
| Catalog/categories | 40 total products; produce category returned 7 including nested fruit products. |
| Search | Header search for `DEMO-001` found exactly the red-apple product; live API name search for lowercase `молоко` found `DEMO-008`. |
| Sorting | Price ascending and descending verified numerically across visible card prices. |
| Stock filter | `in_stock=true` returned 38 products. |
| Pagination | Page 2 worked and retained sorting/filter URL state. |
| Product | Correct product heading, SKU/price/unit/stock/description and add control. |
| Add/count | Add changed header count to 1; cart opened through navigation. |
| Edit/math | Quantity 2 produced subtotal 36.00 TJS for 18.00 TJS apples; decrement restored quantity 1. |
| Reload | Quantity 2 survived a full page reload; stored object keys were only `product_id,quantity`. |
| Remove/empty | Remove displayed appropriate empty cart. |
| Checkout placeholder | Both nonempty safe placeholder and empty-cart state rendered; no delivery/order requests. |
| Empty search | Unknown query rendered `Ничего не найдено`. |
| Missing resources | Unknown product/category rendered useful not-found states; backend responses are 404. |
| Malformed storage | Invalid JSON yielded safe empty cart, no crash. |
| API failure/retry | Deliberately aborted API requests produced actionable retry UI; removing fault and retrying restored products. |
| Stock state | In-stock yogurt add enabled; unavailable kefir add disabled. |
| Image failure | Deliberately blocked apple illustration switched to local fallback SVG. |
| Desktop | 1440×1000; no horizontal overflow; zero broken homepage images. |
| Mobile | 390×844; homepage/catalog/product/cart, increment, reload and remove passed with no page errors/overflow. |
| Final rebuilt-stack recheck | Search → product → add → edit → reload → decrement/remove passed; no JavaScript page errors. |

Screenshots were generated and visually inspected:

- [Desktop homepage](day-1-desktop.png)
- [Mobile homepage](day-1-mobile.png)
- [Mobile cart](day-1-mobile-cart.png)

Expected console network errors during deliberately injected outage/image failure and missing-resource tests were kept separate from successful-flow page errors. Final successful desktop/mobile paths reported no JavaScript page errors. This is Day 1 smoke coverage, not Day 2 checkout/order acceptance or an exhaustive accessibility audit.

## ORS feasibility and Day 2 blockers

After commerce verification, inspected only configuration presence inside the API (never printed keys). Result:

```text
BLOCKED: missing OPENROUTESERVICE_API_KEY, STORE_LAT, STORE_LON
```

No live provider request was made. Store coordinates were not invented, and distance/ETA/geometry were not fabricated. ORS service/account access and Dushanbe routing coverage remain **unverified**. Before Day 2 live routing, supply an authorized key and verified store coordinates, then use a controlled server-side test route to a known destination. The address remains `Айни 16б, Душанбе, Таджикистан`.

No additional environment blocker remains for Day 1. Day 2 must implement checkout validation, httpx provider service, coordinate/map selection, real route metrics/geometry, independent configured flat fee, server-authoritative order/stock transaction and confirmation. These features are absent intentionally; the schema/config are prepared only.

## Reproduced startup

From `C:\Workshop\Paykar\Test_Task_Paykar_Shop`, with Docker Desktop running:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up --build -d
docker compose exec api python /seed/seed.py
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
```

Web: **http://localhost:3000**. API/docs: **http://localhost:8080/docs**. PostgreSQL: **localhost:5433**. All three containers are left running and healthy for review. Full developer/check instructions are in [README.md](../../README.md).
