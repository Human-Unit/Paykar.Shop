# Phase 2 — Curated Product Connections

## Architecture and data

Product pairings are explicit, directed rows in PostgreSQL. The feature reuses the existing FastAPI product routes and `ProductOut` schema; it adds no recommendation scoring, category fallback, personalization, or inference. Migration `0003_product_connections` follows `0002_sandbox_payments` and adds a single `product_connections` table. Its constraints prevent self-links, duplicate pairs, negative positions, and unsupported relation types; both product references use `ON DELETE RESTRICT`.

The seed catalog defines 34 curated directed relationships across 13 actual product slugs. Seed insertion resolves IDs by slug and is idempotent. Reverse links are present only when explicitly seeded.

## API and storefront

- `GET /api/v1/products/{slug}/connections` returns active, ordered, in-stock targets. A missing/inactive source returns 404; an existing source without available links returns `{ "items": [] }`.
- `POST /api/v1/products/connections` accepts 1–48 source slugs and returns one ordered group per requested source in one join query. It bounds each group and excludes unavailable targets.
- Product detail fetches its own curated list, reuses existing product cards and quick-add controls, and hides the section when no connections exist.
- The cart fetches one bounded batch for its products in cart order, then deduplicates targets, excludes products already in the cart and unavailable products, and displays at most four suggestions.
- New headings use the central RU/TJ/EN translation dictionary. Cart persistence, checkout, search, filters, delivery routing, and order creation were not changed.

## Verification

- `python -m compileall app`: passed.
- `pytest -q`: **82 passed, 1 warning** against the dedicated PostgreSQL test database; this includes the new product-connection integration coverage.
- `ruff check .` and `ruff format --check .`: passed.
- `alembic upgrade head` and `alembic current` against the isolated test database: passed; current revision is `0003_product_connections (head)`. Offline upgrade/downgrade SQL generation also passed.
- Docker Compose API and web images built and started; PostgreSQL health check passed. `docker compose config --quiet` passed. The API database was migrated to `0003`, and the seed command reported 7 categories, 40 products, and 34 product connections. `/api/v1/health/db` returned `ok`.
- Live API smoke: the tea endpoint returned oat cookies, honey, and wafers in curated order; the batch endpoint returned groups in requested source order.
- Frontend `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run format:check`: passed. The production web Docker build also passed.
- `git diff --check`: passed.

## Browser acceptance

Playwright browser acceptance passed against the running Compose stack. Product detail displayed three curated tea pairings and quick-add worked. After adding tea and oat cookies, the cart excluded those current-cart items, deduplicated suggestions from multiple sources, and showed no more than four; cart quick-add updated the cart, and the next suggestion set excluded the newly added product. A product with no curated connections did not render an empty suggestions section.

Product and cart suggestion surfaces were checked at **390, 768, 1024, 1440, and 1920 CSS pixels**. The document/body width stayed within the viewport at every size; the 320px product check also had no overflow. Earlier 390px/1440px checks confirmed product and cart card counts and interaction. Language switching produced `html lang="ru"`, `"tg"`, and `"en"`, with the matching navigation and cart headings. Theme switching between light and dark persisted through reload. Browser sessions reported zero console errors (some non-fatal warnings were present).

## Remaining issues and status

The requested Phase 0/1 reference documents were absent from this checkout, so implementation followed the current source, schema, migration, and seed conventions. The branch is local and uncommitted. Repository `AGENTS.md` explicitly prohibits pushing; therefore no remote draft PR was created.

**PHASE 2 — ACCEPTED**
