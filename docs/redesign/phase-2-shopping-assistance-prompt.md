# Paykar — Phase 2: Shopping Assistance & Merchandising

## Role

Act as a senior ecommerce product engineer working in the existing Paykar repository. Read `AGENTS.md` and the Phase 0/1 redesign docs before changing code.

## Goal

Build a visible grocery-shopping assistance layer that adds meaningful functionality without ML, AI, scoring, or fake personalization.

The core rule is simple: product relationships are **manually curated**. Examples: sambusa → cola, cola → chips, tea → biscuits, bread → butter. If both directions are desired, store both explicitly.

## Scope

### 1. Curated product connections

Create a persistent `product_connections` model/table with explicit source → target links, stable ordering, active state, self-reference protection and duplicate protection.

Expose product connections through the API and reuse normal product summary data. Never invent fallback products. If no curated connection exists, return an empty list.

### 2. Cart completion

Given the products already in the guest cart, collect their curated connections in cart order, deduplicate them, exclude products already in the cart, exclude inactive/out-of-stock products, and return a small bounded set.

This is deterministic aggregation, not recommendation scoring.

Truthful UI wording only, for example:
- RU: `Можно добавить к покупке`
- EN: `You may also need`
- TJ: natural equivalent matching the existing translation tone.

Do not claim `Frequently bought together`, `Recommended for you`, popularity, or behavioral personalization.

### 3. Shopping list / saved items

Add a lightweight guest shopping list using the existing frontend persistence style. No account/auth requirement.

Users should be able to:
- save/remove a product,
- open a saved-items surface,
- add a saved product to cart,
- add all available saved products to cart,
- keep the list across reloads in the same browser.

Do not duplicate cart business logic.

### 4. Curated bundles / combos

Support simple manually configured bundles such as `Bread + Butter`, `Tea + Biscuits`, or another set that actually exists in seed data.

A bundle is explicit merchandising data, not generated dynamically.

Minimum behavior:
- display bundle title and included products,
- show calculated current sum from product prices,
- add available bundle items to cart in one user action,
- never silently add anything without user confirmation.

Discounted bundle pricing is optional for this slice. Do not build a promotion engine unless the current data model already makes it safe and small.

### 5. Product-detail assistance

On product detail, show a bounded curated connection section below the primary purchase area. Reuse existing product cards or cart controls where practical.

No empty section when no links exist.

### 6. Out-of-stock substitute links

Allow an explicit relationship type for `substitute` only if it remains simple. A substitute must also be manually linked. Never infer substitutes automatically.

If implemented, show only in-stock substitute targets.

## Data rules

Prefer a small relation model:
- `id`
- `source_product_id`
- `target_product_id`
- `relation_type` (`complementary`, optionally `substitute`)
- `position`
- `is_active`

For bundles, use the smallest schema consistent with the existing architecture; avoid a generic promotion engine.

All schema changes must use Alembic. Do not edit old migrations.

## Seed data

Inspect `db/seed/products.json` and only create links/bundles between products that actually exist. Seed by stable slugs, not guessed IDs.

Use realistic demo relations from the current catalog, for example where available:
- bread → butter / cheese
- tea → biscuits / sweets
- coffee → biscuits
- milk → bakery items
- drinks → sweets/snacks

Do not invent unavailable products just to fit examples.

## API expectations

Preferred endpoints:
- `GET /api/v1/products/{slug}/connections`
- a bounded cart-assistance endpoint accepting current cart product IDs/slugs in one request, if that reduces N+1 frontend calls
- bundle listing/detail endpoint only if needed by the UI

Reuse existing `ProductOut`/summary shape where possible.

Avoid one HTTP request per suggestion.

## Frontend expectations

Integrate into the existing design system and localization architecture.

Add:
- save/unsave control on product cards/detail where it does not clutter the primary CTA,
- saved-items page or drawer,
- product-detail curated suggestions,
- cart completion section,
- bundle/combination block where appropriate.

All new user-facing strings must be centralized in RU/TJ/EN from the start.

## Accessibility and UX

Preserve:
- keyboard access,
- visible focus,
- 44px practical mobile targets,
- semantic buttons/headings,
- truthful state labels,
- reduced motion,
- no hover-only functionality.

Suggestions must remain visually secondary to the primary purchase/cart/checkout actions.

## Explicitly forbidden

Do not add:
- ML/AI recommendations,
- embeddings/vector DB,
- collaborative filtering,
- popularity/relevance scoring,
- automatic category similarity,
- behavioral tracking infrastructure,
- recommendation microservices,
- Redis,
- authentication/accounts,
- unrelated checkout/ORS/payment changes.

## Verification

Backend:
- `python -m compileall app`
- `pytest`
- `ruff check .`
- `ruff format --check .`
- `alembic upgrade head`
- `alembic current`

Frontend:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run format:check`

Repository:
- `git diff --check`

Browser acceptance at minimum:
- product detail: 390px + 1440px
- cart: 390px + 1440px
- saved items: 390px + 1440px
- light + dark
- RU/TJ/EN

If rendered browser validation is unavailable, state `VISUAL ACCEPTANCE — PENDING`.

## Branch / merge policy

Work only on `phase2/shopping-assistance`.

This branch is based on Phase 1 and must remain separate. Do not merge into `main` or Phase 1 until the user is back on their laptop and explicitly asks to merge.

Create/update `docs/redesign/phase-2-progress.md` with implementation decisions, verification status, and remaining acceptance work.
