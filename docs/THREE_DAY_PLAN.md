# Paykar.shop recreation: three-day execution plan

Assessment date: 2026-10-01 (Asia/Tashkent). Workspace: `C:\Workshop\Paykar\Test_Task_Paykar_Shop`.

This document is the implementation handoff. This turn performs inspection and planning only. No application features, dependency installation, backend replacement, commits, or pushes are part of this turn.

The latest specification explicitly replaces Go/Gin with **Python, FastAPI, Pydantic, SQLAlchemy 2.x, Alembic, asyncpg, and httpx**. Next.js, TypeScript, App Router, Tailwind CSS, PostgreSQL, Docker Compose, openrouteservice, Leaflet, and OpenStreetMap remain the target. Existing Go instructions are obsolete and must be corrected at the start of Day 1.

Day 1 handoff correction: the subsequent implementation request requires `DELIVERY_FLAT_PRICE`, with no distance-based pricing formula. It also schedules the ORS risk probe after the commerce foundation. Those explicit instructions override the original pricing/probe suggestions below. See `docs/progress/day-1-commerce-core.md` for the implementation status; the assessment in this plan is the pre-implementation snapshot.

## 1. Current repository assessment

All 29 existing files were inspected, including hidden configuration files. There is no existing knowledge graph to consult. Source files and actual command output are the basis of this assessment.

```text
.
├── .env.example
├── .gitignore
├── AGENTS.md
├── docker-compose.yml
├── apps/
│   ├── api/
│   │   ├── .dockerignore
│   │   ├── Dockerfile
│   │   ├── go.mod
│   │   ├── cmd/api/main.go
│   │   └── internal/
│   │       ├── category/doc.go
│   │       ├── config/{config.go,config_test.go}
│   │       ├── database/database.go
│   │       ├── delivery/config.go
│   │       ├── http/{router.go,router_test.go}
│   │       ├── order/doc.go
│   │       └── product/doc.go
│   └── web/
│       ├── .dockerignore
│       ├── .prettierignore
│       ├── Dockerfile
│       ├── eslint.config.mjs
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       └── tsconfig.json
└── db/
    ├── migrations/{001_foundation.up.sql,001_foundation.down.sql}
    └── seed/README.md
```

`docs/THREE_DAY_PLAN.md` is added by this planning turn; it is not preexisting Phase 0 work.

| Area | Observed state | Implication |
| --- | --- | --- |
| Git | `git status --short` reports that the directory is not a Git repository; no `.git` is present | No tracked/untracked status or history can be assessed. Do not initialize, commit, or push during this turn. |
| Backend | Go source for configuration, lazy pgxpool setup, HTTP shutdown, two health routes, CORS, and tests | Incorrect target stack; replace rather than finish it. Product/category/order packages only contain package comments. |
| Go dependencies | `go.mod` contains only the module name and Go version; no `require` entries or `go.sum` | Backend cannot currently compile as a complete application. API Dockerfile also copies a nonexistent `go.sum`. |
| Python | No `.py`, requirements, SQLAlchemy models, Alembic configuration, Python tests, or lint config | FastAPI foundation must be implemented from scratch. Python 3.14.3 is available through `python`; `py --list` also lists 3.9 and 3.10. |
| Frontend | npm scripts, strict TypeScript configuration, Tailwind PostCSS config, ESLint config, standalone Next config, Dockerfile | Reuse configuration intent. `package.json` declares no dependencies or devDependencies, and there is no lockfile, `node_modules`, `src`, `app`, page, component, stylesheet, or image asset. No route is implemented. |
| Database | SQL for categories, products, orders, order_items, indexes, checks, and product timestamp trigger | Useful design, unverified on PostgreSQL. No Alembic history. `orders.comment` is missing from the corrected requirements. |
| Seed | README only, explicitly no seed records | No categories, products, or representative images exist. |
| Infrastructure | Three Compose services, loopback ports, named PostgreSQL volume, health dependencies | YAML/interpolation validates with `.env.example`. API image targets Go. Web image requires missing lockfile/dependencies/pages. No stack is runnable yet. |
| Migrations in Compose | Original SQL mounted into Postgres first-initialization directory | Only runs for an empty volume; replace automatic SQL initialization with Alembic to avoid two migration authorities. |
| Environment | Demo PostgreSQL values, API/web ports, public API URL, allowed origin, blank ORS key/store coordinates, address | Reuse names where meaningful. Replace Go settings/URL handling; credentials and store coordinates remain runtime configuration. No real `.env` exists. |
| Documentation | AGENTS.md and seed README only | Root README and `docs/progress` reports do not exist. AGENTS.md still mandates Go and refers to keys in Go. |
| Tests | Two Go test files covering config and health behavior | Reuse their scenarios in Python tests, not the Go implementation. No browser, frontend, or database integration tests. |

### Commands actually executed during assessment

| Command / inspection | Result |
| --- | --- |
| `Get-Location`, `Get-ChildItem -Force`, `rg --files`, recursive file reads | Completed; inspected repository and confirmed missing artifacts above. |
| `git status --short` | **FAILED:** not a Git repository. |
| `go version` | Available: Go 1.25.6. This is not the target backend runtime. |
| `node --version`, `npm --version` | Available: Node 24.13.0 and npm 11.6.2. |
| `python --version`, `py --list` | Completed; Python availability described above. |
| `go test -mod=readonly ./...` in `apps/api` | **FAILED overall:** Gin and pgxpool modules undeclared. `internal/config` tests passed; health tests could not run. Readonly mode deliberately avoided repairing the obsolete backend. |
| `npm run lint` in `apps/web` | **FAILED:** `eslint` executable unavailable. |
| `npm run typecheck` in `apps/web` | **FAILED:** `tsc` executable unavailable. |
| `npm run build` in `apps/web` | **FAILED:** `next` executable unavailable. |
| `docker compose --env-file .env.example config --quiet` | **PASSED**, exit 0. Valid configuration does not prove images build or services start. |
| `docker version` | Client 29.5.3 present; **FAILED** to connect to Docker Desktop Linux engine named pipe. |
| `docker compose --env-file .env.example ps` | **BLOCKED/FAILED**, exit 1: same unavailable Docker engine. |

No Docker build/up, PostgreSQL migration, live health endpoint, Python application check, or browser flow was run. No running stack or existing data volume was established. Do not claim Phase 0 complete.

## 2. Completed work that can be reused

- Keep the monorepo boundaries `apps/api`, `apps/web`, `db/seed`, and root Compose configuration.
- Carry the four-table SQL design into SQLAlchemy/Alembic: category self-reference, unique slugs/SKUs, decimal money, order item product-name/price snapshots, quantity checks, foreign keys, indexes, and timestamp behavior.
- Retain PostgreSQL 17, loopback development ports (5432, 8080, 3000), named volume, and health-based startup sequencing.
- Retain npm as the package manager. Complete the existing scripts and strict Next/Tailwind/ESLint setup rather than scaffold a second frontend.
- Retain `.env.example` placeholders and the secret boundary. Retain `.gitignore` and Docker ignore concepts, adding Python artifacts where needed.
- Translate health, coordinate-validation, timeout, and safe-error test scenarios into pytest.
- Keep the agent rules about the deadline, simplicity, guest checkout, testing, secret handling, and no commits/pushes; correct their stack references.

Public reference inspected: [Paykar.shop](https://paykar.shop/) shows the supermarket catalog/search/cart structure and Russian-language storefront. Its public HTML identifies a green theme value `#08a826`. Use that direction with our own layout, assets, and demo catalog. Do not copy production source or bulk scrape the catalog; do not imply that demo prices, delivery rules, or contacts are official.

## 3. Incorrect and outdated work to replace

Do not install Gin/pgx or spend time making the Go backend green. On Day 1, replace the following **12 files** in the same `apps/api` boundary:

```text
apps/api/go.mod
apps/api/Dockerfile                          # replace contents with Python image
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

Remove Go source/module files once their behavior has been accounted for; do not keep a second backend or create an archival Go application in this repository. Adapt `apps/api/.dockerignore` for Python.

Also update:

- `AGENTS.md`: FastAPI/SQLAlchemy/Alembic stack, server-only secrets, Python checks.
- `.env.example`: remove `GIN_MODE` and `API_ADDR`; use `API_HOST`/`API_PORT`, an async SQLAlchemy URL or safely constructed component settings, and `DELIVERY_FLAT_PRICE`.
- `docker-compose.yml`: Python API startup, `GET, POST, OPTIONS` CORS capability in the application, Python healthcheck, and Alembic migration startup.
- `db/migrations/*.sql`: preserve their design in the first Alembic revision, then retire the standalone scripts and their Compose mount. Do not apply both systems to the same database.
- `apps/web/Dockerfile`: existing stages are reusable, but add copying `public/` once local product images exist; otherwise standalone runtime would lose them. Add dependencies and `package-lock.json` before relying on `npm ci`.

## 4. Remaining work and scope priorities

Almost all user-facing behavior remains. Foundation configuration exists; a working application does not.

| Priority | Scope |
| --- | --- |
| **P0: required for submission** | FastAPI/PostgreSQL/Alembic foundation; Docker startup; health endpoints; 6 categories and 40 representative products; useful product images; homepage and responsive shell; catalog/category/search/product routes; basic sort, in-stock filter, bounded pagination; persistent guest cart; checkout validation; coordinate selection; real ORS distance/ETA/GeoJSON through FastAPI; Leaflet route map; independent demo delivery pricing; transactional order creation, stock validation, confirmation; basic loading/error/empty states; relevant tests/checks; reproducible README. |
| **P1: after P0 is secure** | Address geocoding convenience; expand dataset toward 10 categories/100 products; deeper category UI; additional price/category filters; richer promotional presentation; fractional shopping quantities; broader browser regression coverage. Two-level category support and integer pack/item quantities suffice for P0. |
| **P2: optional polish** | Additional visual refinements, subtle motion, extra banner variations and accessibility polish beyond usable P0 basics. |

Favorites, comparison, full authentication, admin dashboard, reviews, loyalty/bonus systems, SMS OTP, payment integration, and a promotion engine are **out of the three-day plan**. Do not begin them even if a small polish window appears. No extra infrastructure.

## 5. Final target architecture and contracts

```text
Browser / Next.js (guest cart in localStorage)
    ├── public API requests → FastAPI :8080
    │       ├── SQLAlchemy async sessions → PostgreSQL :5432
    │       └── httpx.AsyncClient → openrouteservice
    └── Leaflet → OpenStreetMap tiles (attribution visible)

Alembic → PostgreSQL schema
Idempotent Python seed command → PostgreSQL demo catalog
Docker Compose → postgres + api + web
```

Keep one application backend. Straightforward routes may use SQLAlchemy directly for catalog reads; add `delivery_service.py` and `order_service.py` because provider handling and transactional checkout have real shared rules. Do not build generic repositories, CQRS, event buses, or dependency-injection frameworks. Use FastAPI's normal session/config dependencies.

```text
apps/api/
  app/
    main.py
    core/{config.py,database.py}
    api/router.py
    api/routes/{health.py,categories.py,products.py,delivery.py,orders.py}
    models/{category.py,product.py,order.py,order_item.py}
    schemas/{category.py,product.py,delivery.py,order.py}
    services/{delivery_service.py,order_service.py}
  alembic/env.py
  alembic/versions/0001_foundation.py
  tests/
  alembic.ini
  requirements.txt
  pyproject.toml                         # Ruff and pytest configuration
  Dockerfile
apps/web/
  src/app/{page.tsx,layout.tsx,globals.css}
  src/app/catalog/{page.tsx,[slug]/page.tsx}
  src/app/product/[slug]/page.tsx
  src/app/cart/page.tsx
  src/app/checkout/page.tsx
  src/app/order/[id]/page.tsx
  src/components/                        # shell, product cards, cart, delivery map
  src/lib/                               # typed API contracts/client, formatting
  src/context/                           # guest cart provider
  public/images/products/
db/seed/{seed.py,products.json,README.md}
docs/progress/
docs/THREE_DAY_PLAN.md
README.md
AGENTS.md
.env.example
.gitignore
docker-compose.yml
```

Add normal Python package files where needed. Only create directories when their first implementation exists.

### Contracts to settle before UI wiring

Use the following endpoints, not competing variants:

| Endpoint | Contract |
| --- | --- |
| `GET /api/v1/health` | Process liveness, no database dependency. |
| `GET /api/v1/health/db` | Timed `SELECT 1`; 200 connected or sanitized 503 unavailable. |
| `GET /api/v1/categories` | Stable ordered category list with `parent_id`; frontend derives a small tree. |
| `GET /api/v1/categories/{slug}` | Category details or 404. |
| `GET /api/v1/products` | `q`, `category`, `sort`, `in_stock`, `page`, `page_size`; `{items,total,page,page_size}`. Sort allowlist: `name`, `price_asc`, `price_desc`. Cap page size at 48; validate bounds. Search name/SKU using parameterized SQLAlchemy expressions. Category includes descendants; seeded hierarchy is at most two levels. |
| `GET /api/v1/products/{slug}` | Full active product or 404; inactive items excluded from public reads. |
| `POST /api/v1/delivery/quote` | Require either a coordinate pair or an address; coordinate selection is P0, geocoding is P1. Return normalized address, coordinates, `distance_meters`, `duration_seconds`, `delivery_price`, GeoJSON `route`. |
| `POST /api/v1/orders` | Customer name/phone/address/comment, coordinates, `{product_id,quantity}` items, and advisory `expected_total` last reviewed by the customer. Return persisted order summary and confirmation ID. Client prices, totals, route distance, and fees are never authoritative. |
| `GET /api/v1/orders/{id}` | Confirmation summary for an unguessable UUID order ID; no public order listing, no sequential-ID exposure. Return only fields needed for confirmation. |

Money is Decimal/NUMERIC with explicit two-place rounding; serialize amounts as decimal strings. Keep display math separate from authoritative server totals. Seed prices and units use TJS and clearly represent demo data. P0 cart quantities are positive integers for each sold pack/item; decimal database columns leave room for later weight-based items.

### Database and migration decisions

- Translate existing SQL into a single reviewed Alembic revision; retain constraints/indexes and correct downgrade ordering. Include nullable `orders.comment`.
- Keep category/product/item IDs numeric; change `orders.id` and `order_items.order_id` to UUID in the initial migration to support guest confirmation without a new account system. Generate UUIDs server-side. Do not expose an order-list endpoint.
- Preserve product `updated_at` behavior with the existing trigger represented in the migration, so updates outside the ORM also work.
- Models and Alembic metadata must agree; do not use `metadata.create_all()` as a competing startup migration.
- API container runs `alembic upgrade head` once before Uvicorn, after PostgreSQL health succeeds; use one API process for the deadline. A failed migration prevents the API from serving.
- Original SQL might have been manually applied outside observed evidence. Check actual schema and Alembic state once Docker runs. Never blindly stamp an existing database or delete a volume. If an incompatible development schema exists, use a new explicitly named demo database/volume and preserve the original; record the choice.
- Seed is a separate explicit command after migrations, repeatable by SKU/slug and not run on every API startup. Rerunning must not duplicate records or overwrite order history. Product images live in `apps/web/public` with a documented source/license or are clearly marked demo illustrations.

### Routing and checkout decisions

- Use one lifespan-managed `httpx.AsyncClient`, explicit connect/read timeouts, and sanitized provider errors. No secret in `NEXT_PUBLIC_*`, client code, URLs returned to browsers, or logs.
- Call `POST /v2/directions/driving-car/geojson` server-side. ORS uses `[longitude, latitude]`; Leaflet lat/lng APIs use `[latitude, longitude]`. Convert at explicit boundaries and test with asymmetric coordinates.
- The store address is supplied, but store coordinates and an authorized working key are not. Confirm coordinates instead of inventing them. Test a real route near the store early on Day 1.
- Route quote is an explicit user action, not a request on every keystroke/map drag. Discard obsolete responses when the location changes; disable order submission until the current location is quoted.
- Keep pricing separate from routing. Use configurable `DELIVERY_FLAT_PRICE` (demo value 20 TJS), independent of route distance and ETA. This is our assignment rule, not a claimed Paykar policy. Do not add distance-based pricing without a later explicit instruction.
- P0 location input is map click plus numeric coordinate fields, with the entered address as delivery text. Device geolocation is optional, not a dependency. If geocoding is added, let users correct its point on the map.
- For order creation, validate customer/cart, obtain an authoritative route/fee for the submitted coordinates, then open a short database transaction. Do not hold row locks while waiting for ORS. Re-read/lock product rows in deterministic ID order, validate active state/stock, compute server prices, decrement stock, insert order/item snapshots, commit atomically. Any unavailable product or insufficient stock yields a clear conflict and no partial order.
- Do not accept the displayed quote's fee from the browser. Recalculate server-side on submission for P0; two explicit provider calls per successful checkout avoid inventing quote-storage infrastructure. Compare the server total with advisory `expected_total` before inserting/decrementing stock; on mismatch return 409 with refreshed summary/quote, roll back, and require customer review/resubmission. The advisory amount is never used to calculate a charge.
- Disable repeated submission while pending, preserve the cart after failed requests, clear it only after confirmed creation, and show the persisted confirmation. Keep automatic retries off order POST; handle ambiguous network outcomes through the confirmation returned when available.
- Missing key, provider timeout/quota error, invalid coordinates, unroutable point, or service-area rejection must produce useful error states. Mock responses are for tests only; they cannot satisfy the live ORS requirement.

## 6. Day 1 — commerce core

**Primary goal:** replace the incomplete foundation and deliver **Browse → Search → Product → Cart**. Budget: approximately 10 focused hours including 1 hour contingency. Treat time boxes as limits, not guarantees; record overruns immediately.

| Order / budget | Work and owner boundary | Verification / output |
| --- | --- | --- |
| 1 — 0.5 h | Correct AGENTS.md stack references first. Inventory current files again, preserve non-Go config/schema design, replace Go files in `apps/api`. Check Docker Desktop/Linux engine availability; identify usable Python runtime. | Corrected instructions; no parallel backend. Infrastructure blocker recorded immediately. |
| 2 — 1.5 h | Backend: minimal FastAPI app, Pydantic settings, SQLAlchemy async engine/session dependency, health routes, allowed web origin with GET/POST/OPTIONS, safe errors, lifespan cleanup. Pin compatible Python dependencies and add pytest/Ruff. Use Python 3.12 container as proposed baseline; verify/install a matching local interpreter or run checks in that container, rather than assuming the host default launcher is suitable. | Health handler and configuration tests; `compileall`, Ruff, pytest. Do not recreate Go abstractions. |
| 3 — 1 h | Database/infrastructure: four ORM models, initial async Alembic revision, comment/UUID decisions above, Python Dockerfile, migration-first API startup, update Compose/environment/ignores. Start PostgreSQL and API. | `alembic upgrade head`, `alembic current`, DB health; migration works on a fresh test database. Remove old init-SQL mount. |
| 4 — 0.5 h | Integration risk probe: validate supplied store point/key and make one server-side ORS request using a temporary local diagnostic if needed. Check a second plausible delivery point and returned geometry; establish whether geocoding is useful. Never persist key/output containing secrets. | Record actual route/coverage result or explicit BLOCKED credential/runtime dependency. No full routing feature yet. |
| 5 — 1.5 h | Backend/database: build categories/product endpoints, search/sort/stock filter/pagination; seed 6 categories and 40 products across at most two levels with owned/licensed/demo assets. | API tests for search/category/sort/page bounds/inactive products/404; repeat seed safely; check counts, SKU uniqueness, images. |
| 6 — 1.5 h | Frontend: complete existing npm manifest with compatible pinned packages and lockfile; shell with strip/branding/search/catalog/cart/footer, Tailwind styles; homepage/category/catalog/product routes. Typed client and agreed response shapes. | Lint/typecheck early, then build. All six base routes render, including checkout empty state until Day 2. |
| 7 — 1.5 h | Frontend/integration: guest cart context, localStorage hydration, add/remove/increment/decrement/count/subtotal, cart page. Link real seeded categories and products; URL reflects search/sort/page. | Browser flow from homepage through search/product to cart; reload retains cart; absent/malformed storage is safe; stock feedback appears. |
| 8 — 0.5 h | Verification/doc: complete backend checks, frontend lint/typecheck/build; Docker configuration and full build/up; initial README and Day 1 progress record. | Evidence for Day 1 gate and command outcomes; no claim that checkout is complete. |
| Reserve — 1 h | Fix critical contract/build/runtime issues only. | Drop P1/P2 before consuming the next day's routing budget. |

**Expected deliverable:** runnable FastAPI + Postgres + Next.js, representative catalog, working search/product/cart path, seed command, initial README, `docs/progress/day-1-commerce-core.md`, and an early ORS feasibility result.

**Explicit stop condition:** on a running stack, a user browses seeded products, searches, opens a product, edits the cart, and reloads without losing it; daily checks pass. At the time box, stop visual polish and expansion. If P0 remains broken, record the specific failing gate and spend the next block fixing it; do not claim Day 1 done or start optional work.

## 7. Day 2 — checkout, delivery, and orders

**Primary goal:** deliver **Cart → Delivery → Real ORS route/map → Persisted Order → Confirmation**. Budget: approximately 10 focused hours including 1 hour contingency.

| Order / budget | Work and owner boundary | Verification / output |
| --- | --- | --- |
| 1 — 0.5 h | Re-run Day 1 smoke gate and resolve contract issues; check ORS key/coverage blocker status before UI work. | Core path still works; no deferred unbounded backend conversion. |
| 2 — 1.5 h | Backend/integration: delivery service using httpx, coordinate validation, GeoJSON/metrics normalization, service-distance limit, separate pricing function, quote endpoint. Prefer coordinate input first; geocoding only if time remains. | Mocked provider tests for success/timeout/403/429/no-route/malformed response; pricing boundaries; one real quote through our API. |
| 3 — 1.5 h | Frontend: checkout form with name/phone/address/optional comment; cart summary and validation; browser-only Leaflet component with OSM attribution, map point selection and numeric fallback, route layer and bounds, distance/estimated duration. | No server-rendering `window` errors; correct coordinate order; current quote only; mobile controls usable. |
| 4 — 2 h | Backend/database: order schemas/service/routes; server authoritative totals/route fee, stock locking/decrement and atomic snapshots; UUID lookup with minimal confirmation data. No accounts. | Integration tests on PostgreSQL for successful transaction, stale price, duplicate item normalization, out-of-stock/inactive product, rollback, invalid customer and concurrent stock contention. |
| 5 — 1.5 h | Frontend/integration: connect quote and order creation, actionable API errors, pending state, totals-review behavior, clear cart only on success; `/order/[id]` persisted confirmation. | Complete flow and confirmation reload; failed checkout preserves cart; duplicate click disabled; no client-supplied price accepted. |
| 6 — 1 h | Error hardening: changed coordinates invalidate quote; provider failure and invalid location feedback; cart stock changes; route/pricing display consistency. Check secrets never enter browser payloads/bundles. | Provider-error tests and browser negative-path smoke tests. |
| 7 — 1 h | Run daily backend/frontend/build/migration/Docker checks and a real end-to-end checkout. Update README and `docs/progress/day-2-checkout-routing.md`. | Order record and items verified in DB; store/destination/fee/ETA/map match the route. |
| Reserve — 1 h | Fix blockers to this whole flow; skip geocoding and further catalog filtering. | Critical path completed before Day 3 polish. |

**Expected deliverable:** complete guest shopping path with real provider route/distance/ETA, visible map, persisted guest order and confirmation, tested authoritative pricing/stock behavior.

**Explicit stop condition:** one real order completes through the UI on Docker, persists correctly, and loads confirmation after refresh; provider errors remain actionable and checks pass. If the key/provider is unavailable, report the integration gate BLOCKED, keep testing using mocks, and prioritize restoring live routing. Mock-only routing is not Day 2 completion.

## 8. Day 3 — presentation and submission hardening

**Primary goal:** make the already working core flow submission-ready. Budget: approximately 9 focused hours including 2 hours contingency. No new architecture.

| Order / budget | Work and owner boundary | Verification / output |
| --- | --- | --- |
| 1 — 0.5 h | Reproduce the full Day 2 flow immediately. If broken, use polish time for repairs. | Stable starting point; known blockers listed. |
| 2 — 1.5 h | Frontend: green Paykar-inspired hierarchy, header/search/catalog entry, purposeful demo banner, category presentation, product cards, cart/checkout clarity, responsive spacing. | Desktop (~1440 px) and mobile (~390 px) screenshots; no overflow; no fake official offers/contacts. |
| 3 — 1 h | Frontend/backend: loading/empty/error/not-found states, keyboard labels/focus, readable contrast, checkout field messages, unavailable images. Improve seed descriptions/assets within existing 40-product minimum. | Empty catalog/search/cart; API down; unknown slug; invalid form; image fallback; keyboard flow. |
| 4 — 1 h | Database/infrastructure: clean startup rehearsal on a new named test volume/database, Alembic head, repeat seed, restart persistence. Verify final image contents and secret separation. | Fresh Docker build/up and healthy services; products and order survive normal restart. Preserve existing volumes. |
| 5 — 1.5 h | Integration/verification: run all checks and browser regression from homepage to confirmation; review price/quantity calculations, routing error handling, map, order records. Only fix discovered P0 bugs. | Final acceptance evidence including live provider success and responsive flow. |
| 6 — 1.5 h | Documentation/demo: finalize README with Windows/local/Docker commands, env/ports/provider prerequisites, migration/seed instructions, tests, demo limitations and data provenance; record `docs/progress/day-3-submission.md`. Prepare concise demo steps. | Reviewer can follow startup without prior chat; all verification results accurately labeled. |
| Reserve — 2 h | Final clean build/smoke after fixes, startup problems and P0 regression repairs. P1/P2 only if every P0 gate is already satisfied. | No unfinished feature detours or architecture experiments. |

**Expected deliverable:** reproducibly startable, presentable submission, final README/progress evidence and a demonstrated complete path.

**Explicit stop condition:** Definition of Done below passes on the submitted files with no unreported blocker. Freeze scope; run final checks after the last fixes. If a required gate remains blocked/failed at the deadline, report it as incomplete and identify the exact external input or code issue; do not relabel it optional.

## 9. Verification strategy

Run verification at each boundary, not only on Day 3. Commands below are **future target commands**, not checks that currently pass. Keep outcomes in each daily progress report with date, command, working directory, result, and relevant evidence.

### Backend

From `apps/api`, in the configured Python environment/container:

```text
python -m compileall app
ruff check .
ruff format --check .
pytest
alembic upgrade head
alembic current
```

Use the Alembic async template with SQLAlchemy's async engine and asyncpg. [Alembic's asyncio cookbook](https://alembic.sqlalchemy.org/en/latest/cookbook.html#using-asyncio-with-alembic) documents this arrangement. Pin dependencies at Day 1 install and verify them against the selected Python version. Do not add mypy merely for this deadline; if it is configured later, `mypy app` becomes a required check.

Separate unit tests from real PostgreSQL integration tests. An integration suite must not silently skip in the final verification run. Use a dedicated test database, apply Alembic, isolate fixtures, and never mutate the demo/order database for tests. Exercise actual decimal constraints, transaction rollback and concurrent stock updates on PostgreSQL rather than assuming SQLite matches.

Unit tests cover health timeout/sanitized errors; settings/coordinate validation; delivery pricing/coordinate ordering; mocked httpx provider responses. Integration tests cover catalog filters/pagination, schema/seed consistency and successful/failed transactional orders. Record real-provider verification separately from mocked tests.

### Frontend

From `apps/web` using npm and its lockfile:

```text
npm ci
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Use current compatible Next/React/ESLint/Tailwind packages and keep strict TypeScript checks. No suppressed build errors or blanket `any`. If Next's generated route types are needed before standalone typecheck, add the appropriate type-generation step in the script rather than rely on a developer's existing `.next` directory. Do not count a production build as a successful lint command; run both.

### Infrastructure and startup

Planned target startup after Day 1 implements the Python/migration/seed setup:

```powershell
# From the project root; copy only when no local .env already exists.
Copy-Item .env.example .env
# Edit .env: authorized ORS key, verified store coordinates, origin/URL/ports.
docker compose config --quiet
docker compose up --build -d
docker compose exec api python /seed/seed.py
docker compose ps
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
# Open http://localhost:3000
```

Implement read-only Compose mount `./db/seed:/seed:ro` into the API container and make the Python seed runnable via `python /seed/seed.py` with import/data paths independent of the current directory. These seed/start commands **do not work against the current Go scaffold**. Docker must be started and missing build files/dependencies completed first.

Use `postgresql+asyncpg://...` for the app's SQLAlchemy URL, `postgres` hostname inside Compose and `localhost` locally. Correctly construct/escape credentials rather than string-concatenate arbitrary passwords. Align `WEB_ORIGIN` and `NEXT_PUBLIC_API_URL` with configured ports; public API base is a frontend build-time value. Browser requests use a browser-reachable host, not Compose's `api` service name. Server-side fetches, if introduced, use a separate nonpublic `API_INTERNAL_URL=http://api:8080/api/v1`; never fetch live catalog data during image build.

Verify clean startup on a fresh explicitly named demo/test volume without deleting existing data. Confirm migration runs before API accepts traffic, API/web healthchecks use tools actually installed in their runtime images, static `public` images are served, and a normal stop/start retains data. Full Compose validation alone is insufficient.

### Browser and application smoke test

Use Playwright if its browser bridge/runtime is available. If unavailable, perform manual browser QA and record the limitation. At desktop and mobile sizes:

1. Health and DB health return expected statuses.
2. Homepage loads; catalog and seeded category links work.
3. Search finds a seeded SKU/name; empty results render clearly.
4. Sorting/filtering/pagination change results correctly without losing URL state.
5. Product detail shows image/price/unit/stock; unknown/inactive product returns useful not-found behavior.
6. Add/edit/remove cart items; count/subtotal update; reload preserves items.
7. Checkout validates customer data and rejects empty cart.
8. Select/enter destination; a real API quote supplies geometry/distance/ETA/fee; map renders the route with attribution.
9. Change destination and verify old quote is invalidated; invalid or unroutable location and provider timeout produce an actionable error.
10. Submit order; server rechecks stock/prices/fee, database order/items are persisted, success clears cart, confirmation survives refresh.
11. Insufficient stock/tampered totals/provider outage cannot create a partial order; failed submission preserves the cart.
12. Inspect browser network/assets to confirm ORS credentials are absent. Store only guest cart IDs/quantities in localStorage, not API secrets.

ORS route endpoint/GeoJSON format is documented in the [official directions reference](https://giscience.github.io/openrouteservice/v9.10.0/api-reference/endpoints/directions/requests-and-return-types). API access requires an authorized key as described by the [official API entry point](https://api.openrouteservice.org/). Consult the account's current quotas during implementation; this plan does not assume a quota or confirm Tajikistan coverage.

## 10. Deadline risks and fallbacks

| Risk / current evidence | Trigger / priority | Fallback and completion impact |
| --- | --- | --- |
| Unfinished Phase 0; zero UI pages and undeclared dependencies | Immediate P0 | Reuse configuration/schema design, complete the smallest foundation, start the vertical browse/cart flow within Day 1. Do not treat scaffolding as a working base. |
| Go replacement and stale AGENTS.md | First implementation step; 2–3 hour foundation budget | Correct instructions, replace in place, use only P0 FastAPI routes/models. No parallel Go support or generic framework. |
| Docker Desktop engine stopped | Day 1 first 30 minutes | Start/configure Linux engine; if unavailable, use an already available PostgreSQL instance only if verified, or an agreed working Docker host. Continue independent UI/unit tests, but migration/live stack checks remain BLOCKED. Do not substitute SQLite and claim PostgreSQL verified. |
| Host Python launcher differs from target runtime | Day 1 dependency install | Use explicit version/venv or Python container; pin compatible dependencies once. Avoid losing hours debugging launcher ambiguity. |
| Missing ORS key and blank store coordinates | Day 1 risk probe | Request/provide an authorized key and verified store point early. Continue mocked tests; never fabricate live route/ETA. This remains a submission blocker if unresolved. |
| Poor address geocoding in Tajikistan | First few real address probes | Coordinate fields and manual map point selection are the P0 location path; drop automatic address lookup. Routing still uses real ORS. |
| Unroutable point or provider outage/quota | Day 1 probe / Day 2 quote | Try another real routable point, show actionable retry/change-location errors, avoid calls on keystrokes. Do not replace with straight-line distance and call it a route. Persistent outage is a live-integration blocker. |
| Leaflet SSR or unavailable tiles | Day 2 map rendering | Isolate map as client-only component, test GeoJSON layer, keep numeric coordinates/metrics usable while fixing map. Map is still required for final completion; metrics-only is temporary degradation. |
| Frontend/backend contract drift | Before wiring each endpoint | Keep one endpoint/field contract in this document and typed frontend client/Pydantic schemas; test an API response before building UI around it. No generated-client framework needed. |
| SQL init conflicts with Alembic or existing volume | First schema inspection | Remove old init mount; migrate a fresh named demo DB. Preserve any existing volume; never blindly stamp or reset it. |
| Dataset/assets take too long | Day 1 seed time box exceeded | Use 6 categories and 40 products, with a small set of clearly labeled reusable demo illustrations where needed. Do not compromise the complete path to reach 100 products. Document asset provenance. |
| Client total tampering, stale price, stock races | Day 2 order tests | Server recomputation and short row-lock transaction; deterministic lock order, validation, rollback. Cut optional UI work instead of cutting order integrity. |
| Excessive pixel polishing / agent overengineering | Any P0 gate unfinished | Stop polish, repositories/services without concrete use, optional features and new infra. Day 3 starts with functional smoke, not architecture design. |
| Time box overruns | Day-end acceptance gate missed | Remove geocoding/extra filters/dataset expansion first; use reserve for P0 repairs and report slippage. Do not hide missed gates or spend reserve on P2. |

## 11. Definition of Done

The project is complete when a reviewer can start the documented Docker stack and perform:

```text
Homepage → Catalog → Search/category → Product → Add to cart
→ Edit cart → Checkout → Specify location
→ Real openrouteservice route/distance/ETA → Route on map
→ Create order → Persisted confirmation
```

All of the following must also be evidenced:

- FastAPI is the sole application backend; no remaining Go implementation or instructions directing agents to Go.
- PostgreSQL connects, Alembic upgrades a fresh database and models match the schema, repeat seed works.
- Backend compile/tests/lint/format checks and frontend lint/typecheck/production build pass on final files.
- Compose validates, all three images build, stack starts, health endpoints pass, restart preserves data.
- Real ORS integration succeeds with an authorized key; route map works; automated mocked provider tests are separately identified.
- Order amounts/stock are validated server-side and persisted atomically; guest confirmation works without accounts.
- Representative dataset has at least 6 categories and 40 products, useful images and correct unit/stock display.
- Desktop/mobile shopping path and essential empty/error/validation states are checked.
- README reproduces environment, migration, seed, startup, ports, checks, and demo limitations; daily progress reports state actual outcomes.
- No real secrets are committed or included in browser assets. No commit/push is made without subsequent explicit authorization.

Unrun, skipped, blocked, or failed required checks prevent a full completion claim. Report them explicitly rather than treating them as passed.

## 12. Final pre-submission checklist

These are future acceptance items; they are intentionally unchecked today.

- [ ] AGENTS.md reflects FastAPI and this plan, with no obsolete Go guidance.
- [ ] `.env.example` covers PostgreSQL/API/web/ORS/store coordinates/address/demo pricing; contains no real secrets.
- [ ] Local `.env`, Python virtualenv/cache and Next output are ignored; secrets absent from browser bundles and logs.
- [ ] Go application files are replaced; one backend remains.
- [ ] SQLAlchemy models and Alembic head agree, including order comment and guest UUID confirmation.
- [ ] Migration upgrade succeeds on a fresh test database; no competing SQL init runs.
- [ ] Seed command works twice, with at least 6 categories/40 products and usable images.
- [ ] Backend starts and health/database health pass.
- [ ] Frontend starts; all base routes and confirmation render.
- [ ] Docker Compose validates and full stack builds/starts with healthy services.
- [ ] Catalog/category/search/sorting/stock filtering/pagination work.
- [ ] Product page/image/unit/price/stock/404 states work.
- [ ] Cart add/remove/increment/decrement/count/subtotal/reload persistence work.
- [ ] Checkout fields/comment/validation/summary/error states work.
- [ ] Real openrouteservice quote works through FastAPI; no key in browser.
- [ ] Destination changes invalidate stale quotes; routing errors are actionable.
- [ ] Leaflet/OSM map and route render with correct coordinates and attribution.
- [ ] Server calculates final amounts, stock checks and order/item persistence correctly.
- [ ] Confirmation reload works; failed order keeps cart; successful order clears it.
- [ ] Responsive desktop/mobile UI and keyboard basics checked.
- [ ] Empty/loading/error/not-found/provider-failure states checked.
- [ ] Backend compile/tests/Ruff and frontend lint/typecheck/build/format checks pass.
- [ ] Real PostgreSQL integration tests actually ran; no hidden skip treated as success.
- [ ] README startup/migration/seed/check commands reproduced from a fresh setup.
- [ ] Final clean image build and complete live browser smoke pass after last changes.
- [ ] Remaining limitations and verification evidence recorded in `docs/progress/day-3-submission.md`.
- [ ] No commit or push performed without explicit instruction.
