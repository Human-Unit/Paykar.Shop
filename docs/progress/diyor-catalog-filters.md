# Expanded Diyor catalog filters

Date: 2026-10-06. Branch: local `main`, based on the Diyor integration merge `26df2830`.

**EXPANDED DIYOR CATALOG FILTERS — ACCEPTED**

## Scope and discovery

Queried the existing `grafify/graphify-out/graph.json` to locate catalog/query/facet relationships, then verified the actual source. The backend already implements every requested filter, recursive category/subcategory constraints, sorting, pagination, discount validation, and scoped facets. No backend change or migration was needed.

The existing Diyor catalog sidebar, title/count, product grid, product cards, theme tokens, typography, motion and mobile navigation are retained. This pass extends the existing advanced dialog and URL helpers. The optional empty-state action label defaults to the prior wording everywhere else.

## Filters and UI integration

- The existing Filters control is integrated into the compact toolbar. Mobile order is search, Filters/sort, then the stock/sale quick toggles.
- Exact minimum/maximum prices and API-derived presets share `min_price`/`max_price`. No preset numbers are hardcoded in the frontend.
- Minimum discount offers any, 10%, 20% and 30%; a valid custom minimum from a shared URL is retained.
- Sale-unit choices come from API facets. A single redundant unit is hidden unless selected. An unavailable applied unit is shown disabled with an explanation so it can be cleared; it is not offered as an available choice.
- Real categories are ordered by hierarchy; child-category selection is available when meaningful. No categories or product metadata were fabricated.
- The badge counts price, minimum discount, unit and subcategory groups. Minimum + maximum count as one. Search, primary category, sorting and stock/sale quick toggles do not inflate it.
- Active chips use restrained Diyor surfaces, remove their own constraints and include Clear all. Empty results have one localized recovery action and never show unrelated products as matches.
- Desktop dialog: 640px maximum width, bounded height, two-column fields. Mobile: bottom sheet, independently scrolling fields, persistent header/action row and safe-area padding.

Unsupported brand, manufacturer, country, dietary, weight, volume and package-size filters remain omitted because no structured schema supports them. Sale unit is not treated as product weight or volume.

## URL and draft behavior

The URL owns applied state. Dialog edits remain draft until Apply; Escape, backdrop dismissal and Close discard edits. Dialog Clear removes filters while retaining search, parent category and sorting; it does not apply until confirmed. Clear all in the chip row resets the catalog.

A minimum discount enables `on_sale=true`. Switching sale off clears its dependent minimum. Shared contradictory discount/sale links are normalized without discarding their page. Removing only a minimum discount retains the independent sale toggle. Category transitions remove only an incompatible child selection while preserving the other filters.

Chip removal, sorting, search and pagination preserve unrelated parameters. Search/category/filter changes reset pagination; explicit pagination retains filters. Reload and browser Back/Forward were exercised against the real application.

## Facets and result preview

Preview is debounced by 250ms and calls the real products endpoint with `page_size=1`; no filtering is performed over a loaded client page. Changed queries abort the previous request. Opening, editing and re-entering an earlier draft query force a fresh count. Pending/failed/invalid previews never show a stale result number or enable Apply.

Invalid, incomplete, negative, oversized or over-precision price values and reversed ranges are rejected locally with localized messages before a preview is sent. Inputs are associated with their validation message. A failed preview offers Retry.

The current 40-product corpus returns two units and four price presets from the API. A browser combination of price 10–30, stock, sale, minimum discount 20% and unit `упак.` returned exactly one product in both preview and applied catalog. The full tea/category/price/stock/discount/unit intersection correctly returned zero in the live API matrix; zero counts are valid results, not replaced with recommendations.

## Commands and verification

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run format:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:catalog` | PASS — 13 tests, 0 skipped |
| `npm run build` | PASS — production Next.js build |
| `pytest -q` in the supported Python 3.12 API container | PASS — 129 tests, 0 skipped; `TEST_DATABASE_URL` used the existing migrated `paykar_test` database |
| `ruff check .` in the API container | PASS |
| `ruff format --check .` in the API container | PASS — 44 files formatted |
| `python -m compileall -q app` in the API container | PASS |
| `docker compose config --quiet` | PASS |
| `docker compose up --build -d` | PASS — rebuilt API/web and started stack |
| `docker compose ps` | PostgreSQL, API and web healthy |
| `/api/v1/health`, `/api/v1/health/db` | Both returned `status: ok` |
| Live seeded API matrix | PASS — 30 cases, independently checked IDs/counts using Decimal price/discount comparisons |
| Translation source audit | PASS — no missing literal keys in changed components; all new strings have TJ/EN entries |
| `git diff --check` | PASS |

The live matrix covers search, parent/child categories, price bounds/range/presets, stock, sale, discount 10/20/30, units, intersections, sort/filtered pagination, zero results, invalid prices and price-independent scoped facets. See [API evidence](diyor-catalog-filters/api-matrix.json).

## Browser and responsive acceptance

Automated browser acceptance was available through the connected Playwright browser and was run against the rebuilt Docker production web/API. This is current catalog-specific evidence; it does not retroactively mark earlier whole-site browser reports complete.

Interactive checks passed: Apply vs draft, exact real preview totals, discount/sale synchronization, refresh, Back/Forward, removable chips, sorting, pagination, typed search composition, real child categories, context-preserving draft reset, cancellation, empty recovery, local price validation without API requests, normal/reduced motion, native keyboard navigation, Escape and focus return.

A deliberately injected HTTP 503 preview response verified disabled Apply and recovery through Retry against the real API. That injected failed request produced one expected console error. Successful acceptance flows and the responsive matrix produced no unexpected console errors or JavaScript exceptions.

The responsive matrix passed **36 combinations**: widths **320, 390, 768, 1024, 1440 and 1920**, RU/TJ/EN, dark/light. Measured the page, Filters badge, native dialog, scrollable fields and Apply row. No horizontal overflow, nested forms, clipped settled dialog or mobile-tab obstruction occurred. The document languages remained `ru`, `tg` and `en`.

Captured and visually inspected catalog/dialog screenshots at 390px and 1440px in both themes and all languages, including a scrolled mobile sheet exposing discount/unit controls. See [browser evidence](diyor-catalog-filters/browser-acceptance.json) and [screenshots](diyor-catalog-filters/screenshots/).

Verification harness corrections: an initial assertion assumed one tea match instead of the actual zero intersection; expected counts were corrected to use real data. Layout measurements now wait for opening motion to settle. Native Tab order may briefly focus browser chrome between the last dialog control and first, represented by `document.body`; no background interactive control received focus.

## Files and remaining issues

Changed for this pass:

- `apps/web/src/components/catalog.tsx`
- `apps/web/src/components/catalog-filter-dialog.tsx`
- `apps/web/src/components/states.tsx` — optional action label only
- `apps/web/src/lib/catalog-query.ts`
- `apps/web/src/lib/translations.json`
- `apps/web/src/styles/catalog.css`
- `apps/web/tests/catalog-query.test.mjs`
- This report, JSON acceptance evidence and screenshots

No remaining blocker for this catalog task. Existing Node module-type, browser resource-preload and upstream Starlette/AnyIO deprecation warnings remain; dependencies were not changed. The pre-existing `.gitignore`/`grafify` work was preserved. No commit or push was made.
