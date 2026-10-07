# Phase 2 — Shopping Assistance Progress

Status: **IMPLEMENTED IN BRANCH — automated and visual acceptance pending**

Branch: `phase2/shopping-assistance`
Base: `phase1/catalog-discovery`

## 1. Product decision

Phase 2 deliberately avoids ML, AI, behavioral scoring, popularity ranking, embeddings, and fake personalization.

Shopping assistance is driven by explicit merchandising data. A connection such as `wheat-bread → butter` exists only because it is manually configured. Reciprocal behavior is also explicit rather than inferred.

## 2. Curated product relationship model

Added `product_connections` with:

- source product,
- target product,
- `complementary` or `substitute` relation type,
- stable display position,
- active state,
- self-reference protection,
- duplicate relationship protection.

Migration: `0003_product_connections`.

No existing migration was edited.

## 3. Seeded merchandising links

`db/seed/connections.json` uses only real product slugs already present in the current seed catalog.

Examples include:

- wheat bread → butter / cheese / milk,
- rye bread → butter / cheese,
- black tea → oat cookies / honey / milk chocolate,
- coffee → croissant / oat cookies / milk,
- croissant → coffee / black tea,
- apple/orange juice → bakery or sweets,
- milk → croissant / oat cookies.

Explicit substitute examples include bread, juice, and tea alternatives.

The seeder resolves stable slugs to database IDs and fails visibly if configured merchandising data references an unknown seed product.

## 4. API

Added:

- `GET /api/v1/products/{slug}/connections`
- `GET /api/v1/products/cart-assistance`

Product connections:

- support `complementary` and `substitute`,
- return only active, in-stock target products,
- preserve configured ordering,
- return an empty list rather than inventing fallbacks.

Cart assistance:

- receives the current product IDs in cart order,
- reads only explicit complementary links,
- excludes current-cart products,
- excludes inactive/out-of-stock targets,
- deduplicates targets,
- returns a bounded result set,
- performs no relevance scoring.

The existing `ids` catalog filter was consolidated around the same validated positive-ID parser.

## 5. Product detail

Removed the previous coded same-category alternatives behavior from the product detail surface.

The product page now uses explicit connection data for:

- `Хорошо подходит к этому`,
- `Можно заменить` when an out-of-stock product has manually configured substitutes.

No section renders when no curated links exist.

Existing `ProductCard` and cart behavior are reused.

## 6. Cart completion

The cart now requests one bounded assistance result set for its current contents.

The UI renders `Можно добавить к покупке` below the primary cart/checkout area and reuses normal product cards and quick-add behavior.

Suggestions remain secondary to checkout and no item is added automatically.

## 7. Guest saved-items / shopping list

Added persistent guest saved items without accounts or authentication.

Storage key: `paykar-saved-items-v1`.

Users can:

- save/unsave products from product cards,
- see the saved count in the header,
- open `/saved`,
- keep the list across browser reloads,
- add an individual saved product through normal card controls,
- add all currently available saved products to cart,
- remove stale/unavailable saved IDs,
- clear the list.

The saved list is bounded to 48 unique positive product IDs and uses the existing product API in one request rather than fetching products individually.

## 8. Accessibility

The new save control uses:

- a real button,
- `aria-pressed`,
- a product-specific accessible label,
- visible keyboard focus,
- a 44px mobile target.

Saved items and cart assistance reuse existing semantic product cards and cart controls.

## 9. Backend tests added

Integration coverage was extended for:

- curated complementary links,
- substitute links,
- missing products,
- inactive target filtering,
- out-of-stock target filtering,
- cart assistance,
- current-cart exclusion,
- invalid product-ID input.

The tests are committed but **have not been executed in this GitHub connector session** because this connector has no repository shell or dedicated PostgreSQL test runtime.

## 10. Deliberately deferred in this slice

### Curated bundles / combos

Bundles remain part of the Phase 2 product direction but are intentionally deferred until the relationship, migration, cart-assistance, and saved-items foundation is run locally and verified.

No generic promotion engine was added.

### Full localization consolidation

Russian source copy works through the existing `t()` fallback. The new shopping-assistance strings still need to be added to the central RU/TJ/EN translation dictionary before Phase 2 can be accepted.

## 11. Required local verification

Backend:

- `alembic upgrade head`
- `alembic current`
- `python -m compileall app`
- `pytest`
- `ruff check .`
- `ruff format --check .`

Frontend:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run format:check`

Repository:

- `git diff --check`

## 12. Visual acceptance

**VISUAL ACCEPTANCE — PENDING**

Required rendered checks include:

- product detail at 390px and 1440px,
- cart at 390px and 1440px,
- saved items at 390px and 1440px,
- product-card save control,
- saved count in header,
- dark/light themes,
- RU/TJ/EN once dictionary consolidation is complete,
- no horizontal overflow,
- suggestions remain visually secondary to primary commerce actions.

## 13. Merge policy

The user explicitly requested that Phase 2 remain isolated until they are back on their laptop.

Therefore:

- this branch must not be merged now,
- Phase 1 remains the base,
- Phase 2 should be reviewed and tested locally first,
- merge/retarget decisions happen only after explicit user confirmation.

## Current decision

The Phase 2 shopping-assistance foundation is ready for local automated verification and rendered browser review.

Final status: **PHASE 2 — BLOCKED ON LOCAL VERIFICATION / VISUAL ACCEPTANCE**
