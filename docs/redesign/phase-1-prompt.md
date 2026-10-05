# Paykar — Phase 1: Catalog Discovery Foundation

## Role

Act as a senior ecommerce product designer and senior full-stack engineer.

This phase is implementation-focused. Do not perform another broad aesthetic redesign. Improve the shopping-discovery loop first.

## Context

Paykar already has a working catalog, search, category navigation, quick add, quantity controls, cart, checkout, ORS delivery routing, sandbox payments, RU/TJ/EN localization and responsive infrastructure.

Human review feedback identified two major problems:

- the visual/product-discovery experience feels weak,
- functionality feels too limited.

Phase 0 concluded that the next highest-value slice is catalog discovery: stronger filters, visible active state, mobile filtering, search/filter/sort composition and zero-result recovery.

Manual product pairings are explicitly out of scope for Phase 1. Do not add ML, recommendation scoring, popularity logic, personalization, or "frequently bought together" logic.

## Read first

Read:

- `AGENTS.md`
- `docs/redesign/phase-0-foundation.md`
- `docs/redesign/phase-0-recommendation-policy.md`
- `apps/api/app/api/routes/products.py`
- `apps/api/tests/test_catalog.py`
- `apps/web/src/components/catalog.tsx`
- `apps/web/src/components/product-card.tsx`
- `apps/web/src/lib/api.ts`

## Phase 1 objective

Turn catalog/search from a basic list into a credible grocery discovery surface while preserving all existing working commerce behavior.

## 1. Backend filter support

Extend `GET /api/v1/products` minimally.

Required query parameters:

- existing `q`
- existing `category`
- existing `sort`
- existing `in_stock`
- existing `on_sale`
- new `min_price`
- new `max_price`
- existing pagination

Rules:

- prices must be non-negative,
- `min_price > max_price` returns 422,
- filters compose together,
- total count reflects the full filtered result set,
- pagination happens after filtering,
- category descendant behavior remains unchanged,
- inactive products remain excluded,
- no schema migration is needed.

Add integration coverage for:

- min price,
- max price,
- price range,
- sale + stock + price composition,
- invalid price range.

## 2. URL-backed catalog state

Catalog state must survive reload and navigation.

Use query parameters for:

- `q`
- `sort`
- `in_stock`
- `on_sale`
- `min_price`
- `max_price`
- `page`

The category route remains the canonical category context.

When filters change, pagination should reset to page 1.

## 3. Active-filter UX

Show visible active filters above the product grid.

At minimum support chips for:

- search query,
- minimum price,
- maximum price,
- in stock,
- on sale,
- non-default sort.

Requirements:

- each chip can be removed independently,
- `Clear all` is available when filters are active,
- removing a chip preserves unrelated state,
- filter actions reset page to 1,
- category route context is preserved.

## 4. Desktop filters

Make filters feel like a real grocery catalog, not one horizontal form.

Use a compact desktop filter panel/rail with:

- search,
- price min/max,
- in-stock checkbox,
- sale checkbox,
- sort,
- Apply action,
- Reset action.

Do not create giant filter cards or decorative empty space.

## 5. Mobile filters

At mobile widths, do not squeeze the desktop filter rail.

Provide a dedicated filter sheet/drawer pattern with:

- filter trigger,
- active-filter count,
- same filter fields,
- Apply,
- Reset,
- practical touch targets,
- no horizontal overflow.

Do not create a second global navigation drawer.

## 6. Zero-result recovery

When the filtered result is empty:

- explain that no products match,
- expose active filters,
- provide a clear reset path,
- preserve category context when resetting filters,
- do not invent recommendation logic in this phase.

## 7. Product grid

Preserve existing product-card commerce behavior:

- current/old price,
- discount badge,
- stock state,
- quick add,
- quantity decrement/increment.

Do not rewrite product cards unless required for catalog consistency.

## 8. Visual direction

The catalog should feel like a grocery-shopping tool.

Priorities:

1. products,
2. price,
3. availability,
4. filters/sort,
5. category context.

Reduce presentation-only decoration around catalog controls.

Do not spread glass effects into the filter panel or product grid.

## 9. Accessibility

Preserve/improve:

- semantic labels,
- keyboard navigation,
- visible focus,
- native form controls where reasonable,
- touch targets,
- clear selected state,
- reduced motion behavior,
- no color-only status communication.

## 10. Responsive acceptance

Review at:

- 390px
- 768px
- 1024px
- 1440px
- 1920px

Key checks:

- no horizontal overflow,
- mobile filters are usable,
- desktop filter/product proportions are sensible,
- no huge empty gaps,
- product grid remains the visual focus.

## 11. Verification

Backend:

- `python -m compileall app`
- `pytest`
- Ruff check/format

Frontend:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run format:check`

Repository:

- `git diff --check`

If browser access is unavailable, do not claim visual acceptance. Record `VISUAL ACCEPTANCE — PENDING`.

## Constraints

Do not:

- add ML or algorithmic recommendations,
- add manual product pairings yet,
- add auth,
- add loyalty/reviews,
- rewrite checkout,
- change ORS behavior,
- change payment behavior,
- introduce infrastructure,
- perform a broad homepage redesign,
- claim tests were run if they were not.

## Deliverable

Create/update:

`docs/redesign/phase-1-progress.md`

Report:

1. implementation summary,
2. backend changes,
3. frontend changes,
4. responsive/mobile behavior,
5. accessibility notes,
6. verification results,
7. blocked checks,
8. visual acceptance status,
9. remaining Phase 1 issues.

Phase 1 is done only when catalog discovery is materially stronger without regressing the working shopping flow.