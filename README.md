<div align="center">

<img src="apps/web/public/images/paykar/logo.png" alt="Paykar" width="320" />

# Paykar.Shop

### Full-stack grocery storefront built with Next.js, FastAPI and PostgreSQL

A polished ecommerce recreation focused on a complete shopping journey: catalog discovery, persistent guest cart, map-based delivery, real road routing, safe sandbox payments and persisted order confirmation.

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/tests-77_passing-00a82d)](#verification)

</div>

> **Note**
> This repository is an independent technical assignment inspired by the public Paykar shopping experience. It is not the official Paykar website, production dataset, payment system or delivery service.

---

## Highlights

- **Responsive grocery storefront** with a dark-first Paykar design system, light theme, RU/TJ/EN localization and a responsive catalog mega-menu.
- **Catalog discovery** with URL-backed search, recursive categories/subcategories, exact prices and catalog-derived presets, stock/sale/discount/unit filters, sorting, pagination, active chips and curated product connections.
- **Persistent guest cart** stored locally with stock-aware quantity controls and server-resolved prices.
- **Map-based checkout** using Leaflet + OpenStreetMap with manual delivery-point correction.
- **Real road routing** through server-side openrouteservice integration: route geometry, distance, ETA and configured delivery fee are returned before order confirmation.
- **Atomic order creation** with stock locks, server-authoritative totals, item snapshots and UUID confirmation pages.
- **Safe sandbox card flow** with deterministic success/failure scenarios, idempotency and persisted payment state. No real card data is sent to the API or stored.
- **Cash checkout** with idempotent guest-order creation.
- **Polished content pages** for delivery, payment, how to buy, returns, promotions, blog, about, contacts and stores.
- **Branded recovery states** including a custom 404, loading states, empty states and retryable API failures.
- **Docker-first setup** with PostgreSQL, FastAPI and Next.js in one Compose stack.

## Shopping flow

```text
Browse / Search
      ↓
Product / Quantity
      ↓
Persistent Guest Cart
      ↓
Checkout + Delivery Point
      ↓
Real Route / Distance / ETA
      ↓
Cash or Sandbox Card
      ↓
Atomic Order + Stock Update
      ↓
Persisted Confirmation
```

## Architecture

```mermaid
flowchart LR
    B[Browser] --> W[Next.js App Router]
    W --> A[FastAPI API]
    A --> P[(PostgreSQL 17)]
    A --> O[openrouteservice]
    W --> M[Leaflet + OpenStreetMap]

    subgraph Backend
      A
      P
    end

    subgraph External
      O
      M
    end
```

### Backend

`apps/api` uses **Python 3.12**, FastAPI, Pydantic Settings, SQLAlchemy 2 async sessions, asyncpg and Alembic.

Important backend properties:

- Decimal / `NUMERIC` money calculations
- server-authoritative product prices and totals
- deterministic stock locking
- atomic order + order-item snapshot persistence
- guest-order idempotency keys
- sandbox payment sessions with 15-minute expiry
- server-only ORS credentials
- sanitized provider/database errors

### Frontend

`apps/web` uses **Next.js App Router**, strict TypeScript and the project's shared Paykar design system.

The frontend includes:

- dark / light themes
- RU / TJ / EN presentation
- responsive header and burger drawer
- catalog mega-menu
- debounced search suggestions
- accessible keyboard interactions
- product cards with direct quantity controls
- polished checkout, confirmation and informational pages

### Data

The seeded catalog contains:

- **7 categories** — 6 roots + 1 nested fruit category
- **40 active products**
- **2 intentionally out-of-stock products**
- discounted products used by the promotions experience

The seed is idempotent and does not reset existing stock/catalog edits when run again.

---

## Quick start with Docker

### Requirements

- Docker Desktop with Linux containers
- Docker Compose
- an openrouteservice API key if you want live delivery routing

### 1. Configure environment

From the repository root in PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

For live checkout routing, set these values in the ignored `.env` file:

```env
OPENROUTESERVICE_API_KEY=your_key_here
STORE_ADDRESS=Айни 16б, Душанбе, Таджикистан
STORE_LAT=38.562512
STORE_LON=68.791511
DELIVERY_FLAT_PRICE=20.00
DELIVERY_MAX_DISTANCE_METERS=20000
```

Never expose `OPENROUTESERVICE_API_KEY` through a `NEXT_PUBLIC_*` variable.

### 2. Start the stack

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose exec api python /seed/seed.py
docker compose ps
```

### 3. Open the application

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API | http://localhost:8080 |
| Swagger / OpenAPI | http://localhost:8080/docs |
| PostgreSQL | localhost:5433 |

Health checks:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
Invoke-RestMethod http://localhost:8080/api/v1/health/db
```

The PostgreSQL host port is intentionally `5433` to avoid conflicts with a common local PostgreSQL installation on `5432`.

---

## Delivery routing

Checkout uses a server-mediated routing flow:

```text
Browser
  → FastAPI
    → openrouteservice driving-car GeoJSON
  ← reviewed route / distance / duration
Browser
  → Leaflet renders the route
```

Coordinate order is handled explicitly:

- ORS: `[longitude, latitude]`
- Leaflet: `[latitude, longitude]`

A verified smoke route from the configured store to the acceptance point returned:

| Metric | Result |
| --- | ---: |
| Geometry | 51 LineString coordinates |
| Distance | 2,887 m |
| Driving time | 273 s |
| Display ETA | ~5 min |
| Delivery fee | 20.00 TJS |

Provider values may change over time. The delivery fee is configured independently of route distance.

Changing the cart, address or destination invalidates the previous quote and requires an explicit recalculation.

---

## Sandbox payment

The card flow is deliberately local and synthetic. It **does not contact a bank and does not move money**.

Supported deterministic scenarios:

| Scenario | Result |
| --- | --- |
| `SUCCESS` | Payment succeeds and one order is finalized |
| `DECLINED` | Payment fails; cart/order are preserved |
| `INSUFFICIENT` | Insufficient-funds result; no order is created |
| `ERROR` | Processing-error result; retry remains available |

Synthetic form helpers use values such as `12/99`, `000` and `SANDBOX`. **Do not enter a real card.** Card number/CVV/cardholder form values are not persisted and are not sent in API requests; only the selected sandbox scenario reaches the backend provider abstraction.

The payment flow also protects against duplicate confirmation and reuses the verified server route snapshot while it is valid.

---

## Main routes

### Storefront

- `/` — home
- `/catalog` — full catalog
- `/catalog/[slug]` — category
- `/product/[slug]` — product detail
- `/cart` — guest cart
- `/checkout` — delivery + payment + order creation
- `/order/[id]` — persisted guest confirmation

### Information and editorial

- `/how-to-buy`
- `/payment`
- `/delivery`
- `/returns`
- `/promotions`
- `/blog`
- `/blog/[slug]`
- `/brands`
- `/about`
- `/contacts`
- `/stores`

Unknown resources use the branded custom 404 experience.

---

## API overview

```text
GET  /api/v1/health
GET  /api/v1/health/db

GET  /api/v1/categories
GET  /api/v1/categories/{slug}
GET  /api/v1/products
GET  /api/v1/products/{slug}

GET  /api/v1/delivery/config
POST /api/v1/delivery/quote

POST /api/v1/orders
GET  /api/v1/orders/{uuid}

POST /api/v1/payments/sandbox/session
POST /api/v1/payments/sandbox/confirm
GET  /api/v1/payments/{uuid}
```

Product listing supports:

```text
q
category
sort=name|price_asc|price_desc
in_stock
on_sale
page
page_size
ids
```

Search is parameterized and only active products are returned.

---

## Project structure

```text
.
├── apps/
│   ├── api/                  # FastAPI application
│   │   ├── app/
│   │   │   ├── api/          # HTTP routes
│   │   │   ├── models/       # SQLAlchemy models
│   │   │   ├── payments/     # sandbox provider/service
│   │   │   ├── schemas/      # Pydantic schemas
│   │   │   └── services/     # delivery/order business logic
│   │   ├── migrations/       # Alembic migrations
│   │   └── tests/
│   └── web/                  # Next.js frontend
│       └── src/
│           ├── app/
│           ├── components/
│           └── lib/
├── db/seed/                  # idempotent demo seed
├── docs/                     # implementation and verification reports
├── docker-compose.yml
└── .env.example
```

---

## Local development

### Frontend against Docker API

```powershell
docker compose up -d postgres api
Set-Location apps/web
npm ci
$env:NEXT_PUBLIC_API_URL = 'http://localhost:8080/api/v1'
npm run dev
```

Node 24 is the tested frontend runtime.

### Local API

From `apps/api` with Python 3.12:

```powershell
py -3.12 -m venv .venv
.venv/Scripts/Activate.ps1
python -m pip install -r requirements.txt
alembic upgrade head
python ../../db/seed/seed.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8080
```

If ports differ from the defaults, update the matching `.env` values. `NEXT_PUBLIC_API_URL` is build-time configuration for the production Next.js image.

---

## Verification

### Backend

```powershell
docker compose exec api python -m compileall app
docker compose exec api ruff check .
docker compose exec api ruff format --check .
docker compose exec api alembic current
docker compose exec api alembic check
```

The latest full suite runs **77 tests with zero skips** against a dedicated PostgreSQL test database.

Example test-database setup:

```powershell
docker compose exec postgres psql -U paykar -d paykar -c 'CREATE DATABASE paykar_test;'
docker compose exec -e POSTGRES_DB=paykar_test api alembic upgrade head
docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
```

Do not point integration tests at the application database.

### Frontend

```powershell
Set-Location apps/web
npm ci
npm run lint
npm run typecheck
npm run build
npm run format:check
```

All of the above passed on the latest full-site polish source.

### Current verification snapshot

- **77 pytest tests passed, 0 skipped**
- Ruff clean
- Alembic at `0002_sandbox_payments (head)` with no pending migration
- frontend lint / typecheck / production build / formatting passed
- Docker Compose production stack healthy
- real ORS smoke passed
- sandbox payment success/failure/idempotency smoke passed
- credential scan found no ORS key or database password in deployed browser assets
- latest full-site visual/interactive browser acceptance is still documented as **pending** because the automated browser connection was unavailable

Detailed evidence lives in [`docs/progress/full-site-polish.md`](docs/progress/full-site-polish.md), with earlier implementation history under [`docs/progress/`](docs/progress/).

---

## Security boundaries

- ORS key stays server-side.
- `.env` is ignored by Git.
- Browser assets contain no database password or provider credential.
- Payment schema contains no PAN/CVV/cardholder columns.
- Sandbox provider has no external payment client.
- Order totals are recalculated server-side.
- Guest receipt UUIDs are bearer links; keep them private.
- No public order-listing endpoint exists.

---

## Known limitations

This is intentionally a focused technical assignment, not a production supermarket platform.

Not implemented:

- customer accounts / OTP authentication
- admin dashboard
- real card acquiring or refunds
- loyalty / bonus program
- real dispatch and courier tracking
- CMS
- manufacturer directory data
- fraud/reconciliation systems
- automatic address geocoding

The project favors a complete, verifiable core commerce flow over breadth.

---

## Reviewer walkthrough

A short end-to-end demo:

1. Open the home page and browse the catalog mega-menu, categories and promotions.
2. Search for `Яблоки`, use keyboard suggestions and open a product.
3. Add the item, change quantity and reload the cart to show persistence.
4. Continue to checkout and choose a road-adjacent destination.
5. Calculate delivery to display the real route, distance, ETA and fee.
6. Choose cash or one of the synthetic sandbox card scenarios.
7. Submit once; duplicate actions remain idempotent.
8. Reload the order confirmation to show persisted PostgreSQL snapshots.

For the verified route smoke, the destination used was `38.5750, 68.7800` with the configured store at `38.562512, 68.791511`.

---

## Documentation

Key reports:

- [`docs/THREE_DAY_PLAN.md`](docs/THREE_DAY_PLAN.md) — original delivery plan
- [`docs/progress/day-1-commerce-core.md`](docs/progress/day-1-commerce-core.md) — catalog/cart foundation
- [`docs/progress/day-2-checkout-routing.md`](docs/progress/day-2-checkout-routing.md) — checkout + real routing
- [`docs/progress/day-3-submission.md`](docs/progress/day-3-submission.md) — original submission hardening
- [`docs/progress/store-completion-pass.md`](docs/progress/store-completion-pass.md) — informational pages + sandbox payments
- [`docs/progress/delivery-page-redesign.md`](docs/progress/delivery-page-redesign.md) — delivery-page visual benchmark
- [`docs/progress/catalog-mega-menu.md`](docs/progress/catalog-mega-menu.md) — catalog mega-menu
- [`docs/progress/full-site-polish.md`](docs/progress/full-site-polish.md) — earlier full-site visual polish and verification boundary
- [`docs/progress/diyor-ui-integration.md`](docs/progress/diyor-ui-integration.md) — Diyor UI integration, preservation audit and current verification boundary

---

<div align="center">

**Built as a three-day technical assignment, then iteratively hardened for UX, routing, payments, accessibility and verification.**

</div>

## Repeat shopping and reusable baskets

Open `/my-shopping` directly from the compact **My Shopping** homepage block or the burger menu. Personal history and templates appear when data exists; new shoppers see curated Paykar baskets and a create-template action. Save the current cart or a confirmed order as a template; edit its name/products/quantities and add available items together. Repeat operations check current catalog prices and stock and preserve the original order.

Follow the reusable [design principles](docs/design-principles.md): never show emptiness without purpose. Keep errors and important system states visible.

The menu links directly to history, personal templates and curated baskets. The compact homepage My Shopping block opens the overview. Section links support keyboard navigation and reloadable anchors below the sticky header. Combined feature integration and browser evidence: [integration report](docs/progress/main-feature-integration.md).

Guest history contains only order UUID references created or opened in this browser. Personal templates use versioned localStorage (up to 20 templates, 48 lines each); clearing storage removes local templates/references, not PostgreSQL orders. There is no account or cross-device synchronization.

Curated definitions live in `db/seed/shopping_templates.json`. Run the existing seed command after startup (`docker compose exec api python /seed/seed.py`); it rejects unknown product slugs and is idempotent. The API resolves slugs to current database products. No new migration is required.

New endpoints: `POST /api/v1/shopping/preview`, `GET /api/v1/shopping/templates`, and `GET /api/v1/shopping/templates/{template_id}`. Existing order endpoints are unchanged; there is no public order-history enumeration API.

Frontend logic tests: `cd apps/web` then `npm run test:shopping`. Use the existing dedicated `*_test` database for backend tests. Full implementation, actual commands, real checkout evidence and browser checks: [repeat-shopping report](docs/progress/repeat-orders-and-templates.md).
