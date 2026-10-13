# Paykar.Shop

A grocery storefront with catalog discovery, a persistent guest cart, map-based delivery,
order confirmation and a personal shopping workspace. This is an independent technical
assignment, not the official Paykar website or a production payment/delivery service.

## Quick start

Install Docker with Linux containers and Docker Compose v2 with `--wait` support.
No host Node.js, Python packages or PostgreSQL installation is needed for this flow.

```sh
git clone https://github.com/Human-Unit/Paykar.Shop.git
cd Paykar.Shop
cp .env.example .env
docker compose up -d --build --wait
```

In Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env
```

Keep an existing `.env`; do not overwrite configuration when updating the checkout.
Startup waits for PostgreSQL, applies Alembic migrations, seeds an **empty catalog only**,
and starts the production frontend. Existing catalog data and orders are left intact.
The initial demo has seven categories, 40 products (two out of stock), promotions,
product connections and curated sets. Personal orders/templates start empty.

**Live checkout requires configuration:** set a server-side `OPENROUTESERVICE_API_KEY`
and both `STORE_LAT`/`STORE_LON` in `.env`. Without them, browsing, cart, templates and
the store locator work, but delivery quoting/final checkout cannot complete. There is
no fabricated routing fallback. Restart the API after changing routing configuration.

### Local URLs and readiness

| Service                     | Default URL                            |
| --------------------------- | -------------------------------------- |
| Storefront                  | http://localhost:3000                  |
| Backend                     | http://localhost:8080                  |
| Swagger                     | http://localhost:8080/docs             |
| OpenAPI JSON                | http://localhost:8080/openapi.json     |
| API health                  | http://localhost:8080/api/v1/health    |
| Database readiness          | http://localhost:8080/api/v1/health/db |
| PostgreSQL, for local tools | `localhost:5433`                       |

```sh
docker compose ps -a
docker compose logs --tail=100 api seed web
```

PostgreSQL, API and web should be **healthy**. `seed` normally shows **Exited (0)**:
it is a one-shot bootstrap job, not a failed server.

## Features

- URL-backed search, category/subcategory, stock/sale filters, sorting and pagination.
- Product detail, complementary suggestions, favorites and product-specific demo illustrations.
- Persistent guest cart with quantity limits and current server prices/stock.
- Leaflet delivery-point correction, server-side road route, distance/ETA and flat-fee quote.
- Atomic, idempotent guest orders and UUID confirmation pages.
- Cash payment or deterministic sandbox card scenarios; no real payments/card storage.
- My Shopping: remembered orders, repeat, browser-local templates, live stock/price previews,
  add-all, edit and curated sets. These are guest conveniences, not user accounts.
- Promotions, store locator and informational/editorial pages.
- Responsive RU/TJ/EN interface with dark/light themes and reduced-motion support.

## Tech stack

| Layer            | Technology                                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| Frontend         | Next.js App Router, React, TypeScript, Tailwind CSS, CSS Modules, Framer Motion |
| Frontend runtime | Node.js 24 in Docker                                                            |
| Backend          | FastAPI, Python 3.12, Pydantic                                                  |
| Database         | PostgreSQL 17                                                                   |
| ORM / driver     | SQLAlchemy async, asyncpg                                                       |
| Migrations       | Alembic                                                                         |
| Maps             | Leaflet + OpenStreetMap                                                         |
| Routing          | openrouteservice, called only by the backend                                    |
| Local runtime    | Docker Compose                                                                  |

## Environment configuration

`.env.example` contains development defaults, never a real external key. Keep `.env`
ignored. There is no application-environment/demo flag beyond the actual settings below.

| Variable                       | Required                 | Purpose                                                                     | Default                                    |
| ------------------------------ | ------------------------ | --------------------------------------------------------------------------- | ------------------------------------------ |
| `POSTGRES_DB`                  | Default supplied         | Database name                                                               | `paykar`                                   |
| `POSTGRES_USER`                | Default supplied         | Local database role                                                         | `paykar`                                   |
| `POSTGRES_PASSWORD`            | Default supplied         | Local-only development password                                             | `paykar_dev`                               |
| `POSTGRES_HOST`                | Native API only          | Database hostname; Compose enforces `postgres`                              | `localhost`                                |
| `POSTGRES_PORT`                | Default supplied         | Host database port; containers use `5432`                                   | `5433`                                     |
| `DATABASE_URL`                 | Optional, native API     | `postgresql+asyncpg` override; component settings escape credentials safely | Unset                                      |
| `API_HOST`                     | Native API only          | Bind address; Compose uses `0.0.0.0`                                        | `0.0.0.0`                                  |
| `API_PORT`                     | Default supplied         | Published API port; container listens on `8080`                             | `8080`                                     |
| `WEB_PORT`                     | Default supplied         | Published storefront port                                                   | `3000`                                     |
| `WEB_ORIGIN`                   | Default supplied         | Exact browser origin for CORS and administrative CSRF checks                | `http://localhost:3000`                    |
| `ADMIN_COOKIE_SECURE`          | Deployment dependent     | Secure admin cookies; false only for HTTP localhost                         | `false` in Compose, `true` in API settings |
| `ADMIN_SESSION_HOURS`          | Default supplied         | Absolute admin session expiration, bounded 1–24 hours                       | `8`                                        |
| `NEXT_PUBLIC_API_URL`          | Default supplied         | Browser API base, embedded at frontend build time                           | `http://localhost:8080/api/v1`             |
| `API_INTERNAL_URL`             | Optional, native Next.js | Server existence checks; Compose supplies its internal URL                  | `http://api:8080/api/v1` in Compose        |
| `OPENROUTESERVICE_API_KEY`     | For live delivery        | Directions API credential, backend only                                     | Empty                                      |
| `STORE_ADDRESS`                | Default supplied         | Checkout origin address                                                     | `Айни 16б, Душанбе, Таджикистан`           |
| `STORE_LAT` / `STORE_LON`      | Both, for delivery       | Verified origin coordinates; configure together                             | Empty                                      |
| `DELIVERY_FLAT_PRICE`          | Default supplied         | Fee independent of route distance/ETA                                       | `20.00` TJS                                |
| `DELIVERY_MAX_DISTANCE_METERS` | Default supplied         | Maximum driving-route distance                                              | `20000`                                    |
| `TEST_DATABASE_URL`            | Integration tests only   | Dedicated migrated database with an `_test` suffix                          | Generated by verification helper           |

Compose constructs its database connection from PostgreSQL settings; it does not forward
a host `DATABASE_URL`. Changing published API/web ports also requires updating
`NEXT_PUBLIC_API_URL`/`WEB_ORIGIN` and rebuilding web. Never expose the ORS key in a
`NEXT_PUBLIC_*` variable. ETA is a route estimate, not a delivery promise.

## Developer commands

These Docker commands work in PowerShell and Unix-like shells:

```sh
docker compose up -d --build --wait
docker compose down
docker compose logs --tail=100 api
docker compose exec api alembic upgrade head
docker compose run --rm seed python /seed/seed.py
docker compose up -d --build --force-recreate --no-deps web
```

Optional cross-platform wrappers need **Python 3 only**, without host packages:

| Command                                             | Operation                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `python scripts/dev.py up`                          | Build/start and wait for readiness                                      |
| `python scripts/dev.py down`                        | Stop/remove containers; retain database volume                          |
| `python scripts/dev.py rebuild`                     | Rebuild/recreate services; retain data                                  |
| `python scripts/dev.py logs --service api --follow` | Follow API logs; omit `--follow` for a bounded view                     |
| `python scripts/dev.py migrate`                     | Apply Alembic migrations                                                |
| `python scripts/dev.py seed`                        | Insert missing demo rows without overwriting existing rows              |
| `python scripts/dev.py test`                        | Backend tests/sanity checks in a disposable DB, then all frontend tests |
| `python scripts/dev.py verify`                      | Full backend and frontend static/build/test checks                      |

`test`/`verify` require running API/PostgreSQL. The frontend tool image uses the build
stage with development dependencies; the production runtime does not. Backend verification
creates a unique `paykar_verify_*_test` database, migrates it and removes **that database
only** in cleanup. It never runs integration tests against application data. The local
PostgreSQL role needs database-creation permission.

Global helper options precede the action:

```sh
python scripts/dev.py --project paykar_demo --env-file .env up
```

### Destructive local reset

**This deletes this Compose project's PostgreSQL volume, including orders and catalog edits.**
Use only for an expendable local database after normal migration/recovery has failed:

```sh
python scripts/dev.py reset --confirm-delete-local-data
```

Without the confirmation flag, the helper refuses to run. Normal `down`, `up`,
`rebuild`, `migrate`, `seed` and `verify` do not delete the application volume.

## Database workflow

Alembic is the sole schema authority. API startup runs `alembic upgrade head` before
Uvicorn. Seed starts after API/database readiness; web waits for successful seeding.
A failed migration/seed prevents ready frontend startup.

```sh
docker compose exec api alembic current
docker compose exec api alembic heads
docker compose exec api alembic upgrade head
docker compose exec api alembic check
docker compose run --rm seed python /seed/seed.py
```

Automatic seed skips any database already containing products **or categories**.
Use explicit seed to fill a partial catalog. Manual seed uses conflict-do-nothing
inserts and never resets existing prices, stock or image references. Older image URLs
need an explicit image-only update; see [the image report](docs/progress/catalog-image-upgrade.md).

For schema development, use an API virtual environment with `apps/api/requirements.txt`,
a separate development database and the existing `apps/api/alembic.ini`:

```sh
cd apps/api
alembic revision --autogenerate -m "describe_change"
```

Review generated files under `apps/api/alembic/versions/` before applying them. Generating
migrations in an ephemeral container does not save them in the checkout. Review destructive
schema changes separately; this Compose workflow is for local development.

## Testing

After startup, the complete check is:

```sh
python scripts/dev.py verify
```

Equivalent Docker commands without host Python:

```sh
docker compose exec api python tools/verify.py
docker compose run --rm --no-deps --build web-checks
```

Backend verification covers `compileall`, Ruff check/format, test-database
`alembic current`/`check` and all pytest tests. Provider tests are mocked, not live ORS verification.

Frontend development commands, with Node.js 24 installed:

```sh
cd apps/web
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run build
node --test tests/*.test.mjs
```

Focused npm suites: `test:catalog`, `test:shopping`, `test:navigation`,
`test:recommendations`, `test:hero`. The complete suite also includes locator tests.
Repository whitespace check: `git diff --check`.

## Recommended demo flow

1. Open the storefront; browse categories, search and filter the catalog.
2. Open a product, save/add it, change cart quantity and reload.
3. Start checkout, provide contact/address details and correct the map point.
4. With ORS configured, review route, distance, ETA, fee and total.
5. Choose cash or a sandbox scenario and confirm once.
6. Reload the UUID confirmation; use My Shopping to repeat or save a template.
7. Explore Promotions, Stores, Saved items and curated/personal templates.

Changing cart, address or point invalidates the quote. Stock is revalidated transactionally.
Sandbox scenarios: `SUCCESS`, `DECLINED`, `INSUFFICIENT`, `ERROR`. No money moves or bank
is contacted; real card data must not be entered. Failed checkout preserves the cart.
Order URLs are guest capability links; keep them private. Local favorites, templates and
remembered order IDs do not sync between devices. Clearing browser storage removes these
local conveniences, not database orders.

## Project structure

```text
Paykar.Shop/
├── apps/api/
│   ├── app/                 # API, models, services and sandbox payments
│   ├── alembic/versions/    # Schema migrations
│   ├── tests/              # Backend unit/integration tests
│   └── tools/verify.py     # Disposable test-database verification
├── apps/web/src/           # App Router, components, contexts and libraries
├── apps/web/tests/         # Node frontend tests
├── db/seed/                # Demo data, curated sets and seed CLI
├── scripts/dev.py          # Optional standard-library Docker helpers
├── docs/                   # Design contracts and historical QA reports
├── docker-compose.yml
└── .env.example
```

## Troubleshooting

| Problem                         | Check / recovery                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port in use                     | Inspect `docker ps`; Windows: `Get-NetTCPConnection -LocalPort 3000,8080,5433`; Unix: `ss -ltn`. Change published ports and matching API URL/origin, then rebuild. Do not stop an unrelated stack.                                |
| Old database schema             | Inspect API logs and `alembic current`; run `alembic upgrade head` first. Do not reset valuable data because a container is old.                                                                                                  |
| Old frontend still visible      | Confirm checkout/project, then `docker compose up -d --build --force-recreate --no-deps web`. An `npm run dev` preview does not update Docker on port 3000.                                                                       |
| API cannot reach PostgreSQL     | `docker compose ps -a` and `docker compose logs --tail=100 postgres api`. Container address is `postgres:5432`, not host `localhost:5433`. An `.env` password change does not update credentials already initialized in a volume. |
| Empty/partial catalog           | Inspect `docker compose logs seed`; repair configuration, migrate and run explicit seed.                                                                                                                                          |
| Routing unavailable             | Verify key/both coordinates server-side, restart API, inspect `/api/v1/delivery/config` and sanitized API logs. Provider failures remain explicit errors.                                                                         |
| Unhealthy service               | `docker compose ps -a`, `docker compose logs --tail=100 api seed web`; database health is independent of external routing.                                                                                                        |
| Verification cannot create a DB | Use the local Docker PostgreSQL role with database-creation permission. Never substitute application data as the test database.                                                                                                   |

Public map tiles/live routing and first Docker image/dependency downloads need internet
access. Real payment gateways and customer accounts are not implemented features.

## Administration setup

The public store normally starts without an administrator. Create the first MASTER explicitly:

```bash
python scripts/dev.py admin:create
# Equivalent:
docker compose exec api python tools/create_admin.py
```

Enter an email, display name and a password of at least 12 characters (twice,
without echo). Passwords are hashed; no default account or committed credentials.
Use the helper's `--project`/`--env-file` before `admin:create` when using a different
Compose project. Direct CLI accepts optional `--email`, `--name` and `--role`;
passwords are never command-line arguments.

### Presentation startup

To have Docker create the first MASTER automatically, set these values in your
ignored local `.env` before starting the project:

```dotenv
PRESENTATION_ADMIN_ENABLED=true
PRESENTATION_ADMIN_EMAIL=presenter@paykar.local
PRESENTATION_ADMIN_NAME=Presentation Master
PRESENTATION_ADMIN_PASSWORD=<your own password, at least 12 characters>
```

Then run `python scripts/dev.py up` (or `docker compose up -d --build --wait`).
For an alternate environment file/project, use the same `--env-file` and `--project`
options as above. The API migrates first, then creates this account before serving
requests. The operation is serialized and skips creation if **any administrator
already exists**, including disabled accounts. Restarts never reset passwords,
roles or other data. Changing these environment values does not change an existing
account; use the MASTER administrator page for deliberate edits instead.

No default password is shipped. Enabled but invalid configuration stops API startup
with a credential-free error. Keep this mode disabled outside a local presentation.
The password is server-only and available to people with Docker/environment access;
never commit `.env` or share resolved Compose configuration. After initial creation,
you can disable the flag and remove the password from `.env`; the account persists.

- Sign in: <http://localhost:3000/admin/login>
- Operations: <http://localhost:3000/admin>
- MASTER design: <http://localhost:3000/admin/master/design>

ADMIN manages products, categories, product-price promotions, stock and the real
store directory, and reads orders/settings. MASTER also manages administrators
and typed design versions. Sessions use HttpOnly cookies with server-side role/CSRF
checks. For HTTPS deployments set `ADMIN_COOKIE_SECURE=true` and the exact
`WEB_ORIGIN`; Compose defaults are explicitly for HTTP localhost.

Design workflow: edit → local preview (RU/TJ/EN, dark/light, viewport) → save draft
→ explicit publish. Drafts do not affect shoppers. History restoration creates a
new draft; Paykar Default can be saved/published to restore the approved baseline.
Published global tokens load without redeploy, with local defaults on API failure.
Token adoption is incremental; bespoke hero/phone/map behavior is protected.

Store-directory coordinates are separate from the environment-managed checkout
origin (`STORE_LAT`/`STORE_LON`). Editing a location does not silently reroute orders.
Orders are read-only in this MVP; no new status transitions or real payment flow.

Architecture and endpoint details: [administration](docs/admin/admin-architecture.md),
[Design Console](docs/admin/master-design-console.md).

Historical evidence: [submission verification](docs/progress/final-submission-verification.md),
[UI audit](docs/progress/final-ui-consistency-audit.md),
[catalog imagery](docs/progress/catalog-image-upgrade.md). These describe the recorded
checkout/runtime, not a guarantee for a new machine.
