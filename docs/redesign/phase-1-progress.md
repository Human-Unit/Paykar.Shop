# Phase 1 — Catalog Discovery Progress

Status: **IMPLEMENTED IN BRANCH — automated and visual acceptance pending**

Branch: `phase1/catalog-discovery`

## 1. Implementation summary

Phase 1 starts the post-review redesign with the catalog discovery loop rather than another broad visual pass.

Implemented in this slice:

- backend minimum-price and maximum-price filtering,
- composition with existing search/category/stock/sale/sort filters,
- backend validation for invalid price ranges,
- integration-test coverage for price filtering and composition,
- URL-backed catalog filter state,
- on-sale filtering wired into the frontend,
- visible active filter chips,
- individual filter removal,
- clear-all/reset behavior that preserves the category route context,
- dedicated mobile filter dialog/sheet,
- active-filter count on mobile,
- zero-result recovery with a clear reset path,
- product-first catalog heading simplification,
- opaque, compact catalog filter surfaces instead of expanding glass/decorative styling.

Manual product pairings/recommendations remain intentionally out of scope for Phase 1.

## 2. Backend changes

`GET /api/v1/products` now accepts:

- `min_price`
- `max_price`

Both are non-negative decimals.

If both are present and `min_price > max_price`, the endpoint returns HTTP 422.

The new price constraints compose with the existing:

- free-text search,
- recursive category filtering,
- `in_stock`,
- `on_sale`,
- sort,
- pagination,
- active-product filtering.

No schema migration was required because the existing `price` column already supports the required query behavior.

## 3. Backend test changes

`apps/api/tests/test_catalog.py` now includes coverage for:

- minimum price,
- maximum price,
- exact price range,
- sale + stock + price composition,
- invalid min/max ordering,
- negative price validation.

These tests were added to the repository, but they have **not been executed in this GitHub-tool session** because the connector does not provide a repository shell or configured test database.

## 4. Frontend changes

`apps/web/src/components/catalog.tsx` now parses and preserves:

- `q`,
- `sort`,
- `in_stock`,
- `on_sale`,
- `min_price`,
- `max_price`,
- `page`.

The category continues to live in the canonical route (`/catalog/[slug]`) rather than becoming a duplicate query parameter.

Filter application uses `router.push` with a cleaned query string so empty numeric values are not sent to FastAPI as invalid decimal values.

Pagination is intentionally reset when filters are changed or removed.

The previous catalog shopping banner was removed from the catalog heading so products and discovery controls receive higher visual priority.

## 5. Active-filter UX

Visible removable chips are created for:

- search query,
- minimum price,
- maximum price,
- in-stock state,
- sale state,
- non-default sort.

Each chip removes only its own constraint and preserves unrelated filters.

`Clear all` returns to the current catalog/category route without filter query parameters.

## 6. Responsive/mobile behavior

A new CSS module, `catalog-discovery.module.css`, provides a compact opaque desktop filter surface and a mobile-specific filter flow.

At mobile widths:

- the desktop filter form is hidden,
- a dedicated filter trigger is shown,
- the trigger displays the active-filter count,
- filters open inside a native `<dialog>`,
- Escape/native dialog dismissal remains available,
- backdrop click closes the dialog,
- Apply and Reset remain reachable at the bottom,
- the price fields collapse to one column on narrow phones.

This deliberately does not reuse or duplicate the global navigation drawer.

## 7. Localization

Existing catalog text continues to use the central translation helper.

New Phase 1 filter-specific copy is supplied for Russian, Tajik and English directly in the catalog component for this implementation slice. It should be moved into the central translation dictionary during the final localization consolidation after the interaction design is visually accepted.

## 8. Accessibility notes

Implemented/preserved:

- semantic form labels,
- native inputs/select/checkboxes,
- native dialog semantics,
- explicit close-button label,
- keyboard-visible focus styles,
- active-filter navigation label,
- no color-only indication for selected filters,
- mobile controls sized for practical touch use.

## 9. Verification status

### Not executed in this GitHub-tool session

The following commands still need to be run in the real checkout or CI environment:

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

Reason: the GitHub connector used for this implementation provides repository read/write operations but not a shell/runtime or dedicated PostgreSQL test database.

No claim is made that the new code has passed those commands yet.

## 10. Visual acceptance

**VISUAL ACCEPTANCE — PENDING**

Required manual/browser checks:

- 390px phone: mobile filter dialog, keyboard/touch flow, no overflow,
- 768px tablet: intentional transition from desktop to mobile filtering,
- 1024px: filter surface/grid balance,
- 1440px: catalog remains product-dominant,
- 1920px: no oversized controls or decorative dead space,
- dark and light themes,
- RU/TJ/EN copy resilience,
- active-filter chip wrapping,
- empty-result recovery,
- filter + search + sort + pagination combinations.

## 11. Remaining Phase 1 issues

Before Phase 1 can be marked complete:

1. Run backend/frontend verification commands.
2. Fix any lint/type/build/test failures.
3. Perform rendered catalog acceptance at the target breakpoints.
4. Adjust spacing/density only from rendered evidence.
5. Consolidate the new catalog-specific RU/TJ/EN strings into the central translation dictionary after the wording is accepted.
6. Smoke-test known shopping flows to ensure quick-add/cart behavior was not regressed.

## Current decision

The implementation is ready for verification and screenshot review, but **Phase 1 is not yet accepted** until automated checks and rendered browser review are completed.
