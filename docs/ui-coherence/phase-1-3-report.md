# UI coherence — Phases 1–3 implementation and review

Date: 2026-10-08. Status: **implemented and verified; stopped for visual review**. Remaining routes have not been migrated. No commit or push.

Implementation follows the approved [design system](design-system.md), [audit](audit.md), and [route matrix](route-matrix.md). The user's latest phase boundary takes precedence over the older proposal's stage numbering: foundations → ProductCard/Catalog/Product Detail → My Shopping/templates. The proposal files remain historical audit documents.

Open the [before/after review gallery](phase-1-3/review.html), [browser results](phase-1-3/browser-results.json), and [source-integrity comparison](phase-1-3/source-integrity.json). The rebuilt production frontend is running at http://localhost:3000.

## What changed

| Area | Kept | Consolidated in these phases |
|---|---|---|
| Foundations | Bundled Noto Sans, green palette, global container, theme/motion behavior | Opt-in shopping title, section-gap, card/panel/control tokens; scoped commerce headings and product-identity rows |
| ProductCard | Component, product data, sale/save/stock/cart controls, grid ratios | Restrained radius/shadow/hover; contained existing product imagery; explicit category-illustration caption where imagery is generic |
| Catalog | Search, category rail, every filter, sorting, URL state, pagination | Compact heading/results rhythm; products start higher on mobile; stable advanced-filter trigger for focus restoration |
| Product Detail | Product facts, disclaimers, food/household distinction, prices, cart, recommendation behavior | Identity before compact mobile image; one dominant Add action; removed nested purchase surfaces; balanced two-column description/facts instead of unused desktop space |
| My Shopping | Accepted visual cards, conditional personal sections, curated sets, real history, counts/actions | Aligned with the shared container and heading rhythm; one-item latest-order preview no longer reserves collage-sized space |
| Personal template editor | Name/quantity validation, picker, save/delete, preview, stock/error/storage feedback, bulk-add | Shared image/name/current-price identity; picker alongside editor on desktop; removed duplicate item list; Save is dominant and bulk-add is secondary |
| Curated template detail | Existing products, quantities, current estimate, disclaimer, bulk-add | Product rows match the workspace; estimate/action beside contents on desktop and above contents on mobile |
| Homepage and all remaining routes | Existing composition and accepted behavior | No route migration. Shared ProductCard presentation naturally appears wherever that component is already used |

Only two new translation keys were needed, each added for RU/TJ/EN: “Иллюстрация категории” and “Состав набора”. Existing pending hero translations were preserved. No new imagery, dependency, endpoint, product fact, or storage format was introduced.

## Before/after evidence

Baseline screenshots were captured on October 7; final screenshots on October 8, against the same local product data and isolated personal fixtures. Comparisons below use RU, matching viewports/themes, and reduced motion. Most screenshots show the initial viewport; the product-information images capture the entire section.

| Comparison | Before | After | Result |
|---|---|---|---|
| Product, 1440 dark | [Before](screenshots/coherence-product-1440-dark.png) | [After](phase-1-3/screenshots/phase123-final-product-1440-ru-dark.png) | Purchase information no longer has nested card framing |
| Product information, 1440 dark | [Before](screenshots/coherence-product-info-1440-dark.png) | [After](phase-1-3/screenshots/phase123-final-product-info-1440-ru-dark.png) | Description/benefits and facts use both columns |
| Product, 390 light | [Before](screenshots/coherence-product-390-light.png) | [After](phase-1-3/screenshots/phase123-final-product-390-ru-light.png) | Price and Add fit in the first viewport |
| Catalog, 390 light | [Before](screenshots/coherence-catalog-390-light.png) | [After](phase-1-3/screenshots/phase123-final-catalog-390-ru-light.png) | Less prelude before products; all filters retained |
| Shopping, 1440 dark | [Before](screenshots/coherence-shopping-1440-dark.png) | [After](phase-1-3/screenshots/phase123-final-shopping-1440-ru-dark.png) | Sparse order preview fits its actual content |
| Personal editor, 1440 dark | [Before](screenshots/coherence-template-edit-1440-dark.png) | [After](phase-1-3/screenshots/phase123-final-template-edit-1440-ru-dark.png) | Visual editor and product picker share the working area |
| Personal editor, 390 light | [Before](screenshots/coherence-template-edit-390-light.png) | [After](phase-1-3/screenshots/phase123-final-template-edit-390-ru-light.png) | Product identity stays beside quantity/remove controls |
| Curated detail, 390 light | [Before](screenshots/coherence-template-curated-390-light.png) | [After](phase-1-3/screenshots/phase123-final-template-curated-390-ru-light.png) | Estimate/action now precedes the long product list |
| Homepage, 1440 dark | [Before](screenshots/coherence-home-1440-dark.png) | [After](phase-1-3/screenshots/phase123-final-home-1440-ru-dark.png) | Accepted hero and section structure retained |

Measured examples from baseline evidence and final browser results:

- Product page, 1440 dark: document height **2955 → 2463px**; 390 light: **3999 → 3507px**. These include the unchanged footer and recommendation content, not just the purchase block.
- At 390px, the product Add button ends at approximately **691px** in all six language/theme cases, above the bottom navigation at 780px in the 844px viewport.
- My Shopping, 1440 dark: **2807 → 2791px**; 390 light: **4512 → 4309px**, while retaining personal and curated sections.
- Homepage document height remains **5633px** at 1440 dark and **9047px** at 390 light. Hero component/styles match the baseline hashes.

## Verification actually executed

Final source checks, from `apps/web`:

| Command | Result |
|---|---|
| `npm run format:check` | PASS |
| `npm run lint` | PASS; zero warnings |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; 22 static pages generated and dynamic routes compiled |
| `npm run test:navigation` | PASS — 4 tests |
| `npm run test:recommendations` | PASS — 3 tests |
| `npm run test:catalog` | PASS — 13 tests |
| `npm run test:shopping` | PASS — 6 tests |
| `git diff --check` (repository root) | PASS |

All 26 unit tests passed, with no skips. Node prints an existing `MODULE_TYPELESS_PACKAGE_JSON` advisory during the test scripts; it is not an ESLint warning or test failure. Package/module configuration was left unchanged.

Production commands executed from `D:\Workshop\Paykar\Test_Task_Paykar_Shop-main`:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env build web
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up -d --no-deps web
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env ps --format json
```

PASS. The final Docker build reused the successfully built current-source image layers. Web was recreated, then targeted checks ran against it. Web/API/PostgreSQL report healthy. Read-only `/api/v1/health` and `/api/v1/health/db` both returned `status: ok`. The existing environment file was used without displaying its secrets. No backend image/code migration was part of this implementation.

### Rendered browser coverage

Actual Playwright/Chromium automation was available for this run. This is new browser evidence, not a reuse of older manual acceptance claims.

- **126 final route/viewport cases:** Home, Product Detail and populated My Shopping at 320/390/768/1024/1440 × RU/TJ/EN × dark/light (90); Catalog, personal editor and curated detail at 390/1440 × RU/TJ/EN × dark/light (36).
- All cases rendered with the expected document language (`ru`, `tg`, `en`), Noto Sans headings, no horizontal document overflow, and no uncaught page errors.
- **132 final PNGs:** 126 matrix views, four product-information section captures, and two fresh shopping/new-template views. Curated views were recaptured after the final summary placement adjustment.
- Representative screenshots were visually inspected, including RU desktop dark/light, TJ mobile, EN mobile, product facts, personal editor, curated detail and the protected homepage. Geometry assertions across all cases do not mean every PNG received individual visual review.
- Screenshot runs use reduced motion. Separate normal-motion UI tests switched RU → TJ → EN → RU and themes, reloaded, and verified preference/document-language persistence and visible shopping controls.

### Functional shopping checks with real local API responses

PASS:

- Product Add/increment/decrement and cart persistence after reload.
- ProductCard saved toggle and persistence.
- Catalog search/sort/quick-filter URL persistence; advanced-filter apply, Escape, draft discard/reopen, browser Back, and focus restoration.
- Create, rename/edit, save, reload and delete a personal template; image identities render from already-loaded product data.
- Curated bulk-add uses the real preview response. The Family estimate was **87.00 TJS**, matching available quantities and resulting cart contents (six product lines, eight units).
- Existing persisted test order repeat and confirmation reload, with consistent order totals. No order was created.
- Fresh, history-only, templates-only and populated My Shopping retain their conditional sections and always-useful curated content.
- A deliberately missing product ID in an isolated local template shows the real preview's missing-item warning; removing unavailable rows and saving works.
- Household detail retains household facts without food nutrition; visible recommendations exclude current/duplicate products. Stable-ID exclusion order is additionally covered by the recommendation unit tests.

### Deliberately simulated failures

These are resilience tests, not real provider incidents:

- Intercepted secondary-recommendation empty success hides that row; intercepted HTTP 503 stays visible with Retry; retry returns to real API data.
- Intercepted shopping-preview HTTP 503 preserves the editor and visible retry recovery.
- A scoped `localStorage.setItem` failure for template storage keeps the existing storage warning visible. Browser context was disposed afterward.

No real ORS request, new checkout submission, payment transaction, or map gesture acceptance was repeated during this UI-only scope. These protected flows are source-preserved; the checks above do not claim fresh end-to-end provider verification.

## Issues found and resolved

The initial mobile advanced-filter test failed because applying filters remounted the trigger (`key={paramsKey}`), leaving keyboard focus on `body`. Removing that remount and closing an open draft on URL changes preserves the trigger. The production retest passed Apply, Escape and Back focus restoration, plus draft reset. The initial failure and its successful retest remain in `browser-results.json`.

Visual review also found the curated estimate/action still below the full contents list. Its existing summary moved beside the contents on desktop and above them on mobile; no calculations or API calls were changed. The revised layout passed all 12 applicable localized/theme cases and real bulk-add verification.

No unresolved static, build or scoped browser-test failure remains. Exact SKU photography is still limited by the repository's existing assets: category imagery is identified honestly on ProductCard/detail; no packaging was invented. Visual approval remains the required next gate.

## Source protection and changed files

SHA-256 comparison against the audit's 569-file baseline found **557 unchanged files** and **12 intentionally modified tracked files**, plus one new presentation component. This proves source preservation, not runtime proof of every protected interaction.

- Components: `catalog-filter-dialog.tsx`, `catalog.tsx`, `product-card.tsx`, `product-detail.tsx`, `my-shopping.tsx`, `my-shopping.module.css`.
- New component: `shopping-product-identity.tsx`.
- Styles: `tokens.css`, `components.css`, `shop.css`, `catalog.css`, `product-content.css`.
- Copy: `lib/translations.json` (two new localized labels; earlier hero edits retained).
- Evidence: this report and `phase-1-3/`.

Home/hero source and styles, navigation/shell, maps, checkout, phone, theme wave, cart/saved contexts, shopping storage/hooks, APIs, backend and DB files match the audit baseline. Shared ProductCard changes affect its existing consumers intentionally; remaining route-specific layouts were not migrated.

The checkout already contained pending hero changes and audit documents when implementation began. They remain intact. Git HEAD remains `9b72b2a7a0abd1e03161bf7d6651816209e7a27c`; nothing was staged, committed, or pushed by this phase.

**STOP: review the anchor comparisons before any propagation to remaining routes.**
