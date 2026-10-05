# Phase 0 — Grocery UX Redesign Foundation

Status: **IN PROGRESS — repository audit and product decisions complete; rendered visual benchmark still required before full-site redesign implementation**

Branch: `phase0/grocery-ux-foundation`

## Executive summary

The review feedback points to a product-design problem, not a final-polish problem. Paykar already has a credible technical commerce foundation, but the shopping experience does not yet expose enough discovery, narrowing, recommendation, and decision-support functionality to feel like a mature grocery store.

The redesign should therefore move from **marketing/presentation first** to **shopping task first**.

The highest-value change is not another theme pass. It is a stronger discovery loop:

`Search / Browse -> Narrow -> Compare -> Quick add -> Discover complements -> Cart -> Delivery/Checkout`

The current implementation already contains important pieces worth preserving: category navigation, search query support, result counts, stock filtering, price sorting, product cards with prices/discount display, quick add, inline quantity controls, persistent cart, checkout, delivery routing, payment simulation, localization, and responsive infrastructure.

The largest gaps are: filter depth, active-filter visibility, mobile filtering, recommendation surfaces, stronger zero-result recovery, richer merchandising logic, and a visual hierarchy that makes products more important than decorative chrome.

## Evidence from the current repository

### Catalog today

`apps/web/src/components/catalog.tsx` currently supports:

- free-text query `q`,
- category through the route/`category` query parameter,
- sorting by `name`, `price_asc`, `price_desc`,
- `in_stock=true`,
- pagination with 12 products per page,
- category sidebar,
- result count,
- empty state,
- an explicit Apply action.

This is a useful base, but it is not yet a strong faceted shopping experience.

### Product cards today

`apps/web/src/components/product-card.tsx` already provides:

- product image,
- unit,
- product name,
- current and old price,
- calculated discount badge,
- out-of-stock handling,
- add-to-cart without leaving the grid,
- quantity decrement/increment after adding.

These are good grocery-commerce behaviors and should be preserved while visual density and hierarchy are redesigned.

### Product data available to the frontend

`apps/web/src/lib/api.ts` currently exposes product fields for:

- category,
- name,
- description,
- SKU,
- price/old price,
- unit,
- image,
- stock quantity,
- active state.

There is no frontend product field for brand, tags, popularity score, behavioral affinity, rating, or purchase history. Therefore the redesign must not pretend that sophisticated personalization already exists.

### Recommendation capability today

No recommendation implementation was found in the current repository search. Recommendation work should begin with explainable deterministic logic rather than ML.

### Previous visual-polish limitation

The previous Astra design pass explicitly recorded that browser rendering was unavailable and its findings were source/HTTP based rather than screenshot acceptance. The negative human review therefore takes priority over prior source-only visual confidence.

---

# 1. Product goal

Paykar should feel like a **fast local grocery shopping tool**.

A successful redesign should optimize for:

- fast known-item retrieval,
- easy category browsing,
- fast narrowing of large lists,
- low-friction repeated quantity changes,
- obvious price/discount/availability information,
- useful complementary discovery,
- clear delivery cost/time,
- confident checkout.

The visual system serves these tasks. It is not the product by itself.

---

# 2. Core jobs-to-be-done

## Job A — Find a known product quickly

Expected shortest path:

`focus search -> type -> useful suggestions/results -> add directly or open product`

Requirements:

- search always easy to find,
- suggestions useful and keyboard/mobile friendly,
- typo/zero-result recovery,
- filters compose with search instead of replacing it.

## Job B — Browse a category

Expected path:

`catalog/category -> scan products -> narrow -> add`

Requirements:

- hierarchy is understandable,
- product list starts quickly,
- no oversized promotional content between category intent and products.

## Job C — Narrow a product list

Expected path:

`open filters -> select multiple constraints -> immediately understand active state -> scan reduced results`

Requirements:

- price,
- availability,
- discount/promotion,
- category/subcategory where useful,
- sorting,
- active filter chips,
- individual remove,
- clear all,
- mobile filter sheet/drawer,
- URL-backed state.

## Job D — Compare alternatives

Expected path:

`scan consistent cards -> compare unit/name/price/discount/availability -> open one if details matter`

Requirements:

- stable card geometry,
- product imagery visible but not oversized,
- price hierarchy stronger than decorative copy,
- stock state visible,
- quick add stays on the list.

## Job E — Discover complementary products

Expected path:

`product/cart -> small relevant recommendation set -> quick add`

Requirements:

- deterministic and explainable recommendations first,
- small sets,
- no recommendation wall before the primary shopping task.

## Job F — Recover from failure

Expected path:

`zero result/out of stock -> useful alternatives or filter reset -> continue shopping`

Requirements:

- explain why no products are shown,
- expose active filters,
- offer clear reset,
- show nearby/similar alternatives when available.

## Job G — Complete delivery checkout confidently

Expected path:

`cart -> address/map -> route/fee/ETA -> payment -> order confirmation`

Requirements:

- preserve existing working route/fee logic,
- strong step hierarchy,
- no marketing distractions,
- cost/time visible before final order submission.

---

# 3. Information architecture decision

## Header

Primary order:

1. brand/home,
2. prominent search,
3. catalog/categories entry,
4. cart,
5. compact utility controls (language/theme/menu).

Desktop secondary navigation must not compete visually with search and shopping actions.

## Homepage

Target hierarchy:

1. Header + dominant search
2. Categories
3. Useful promotion / current value proposition
4. Popular or useful products
5. Recommendation/discovery section
6. Delivery reassurance
7. Store network
8. Editorial/secondary content
9. Footer

Decision: **reduce dependence on a giant hero**. The first viewport should make it obvious how to start shopping.

## Catalog/search

Target hierarchy:

1. breadcrumb/context,
2. category/search title + result count,
3. sort + filter controls,
4. active filter chips,
5. product grid,
6. pagination/load continuation,
7. recovery/recommendations when results are weak.

Desktop: filter rail or compact filter panel depending on available width.

Mobile: filters open in a dedicated sheet/drawer with clear Apply/Reset behavior and visible selected-count feedback.

## Product detail

Priority order:

1. image,
2. name/unit,
3. price/discount,
4. stock state,
5. add/quantity action,
6. delivery reassurance,
7. description/details,
8. similar/complementary products.

## Cart

Priority order:

1. items and quantities,
2. subtotal/fees preview,
3. checkout action,
4. a small complementary recommendation strip,
5. secondary policies/help.

## Checkout

Keep task-oriented progression:

1. Contact
2. Delivery/address/map
3. Payment
4. Summary/submit

No decorative hero.

---

# 4. Functionality matrix

## P0 — required for the next credible review

### Catalog/filtering

- category/subcategory filter integration,
- price min/max or range,
- availability,
- discount/promotional filter,
- sort by name/price; add sensible default/relevance only if deterministic,
- active filter chips,
- remove one filter,
- clear all,
- result count,
- URL-backed state,
- pagination state preserved with filters,
- mobile filter sheet/drawer,
- filter/search/sort composition,
- robust empty state.

### Search/discovery

- preserve existing query search,
- improve autocomplete/suggestion usability,
- useful zero-result recovery,
- suggestions must not overflow viewport,
- keyboard and touch support,
- no destructive reset of chosen category/filter state without clear intent.

### Product grid/cards

- preserve quick add and quantity controls,
- consistent image/card geometry,
- strong price hierarchy,
- unit visible,
- discount clear but not dominant,
- out-of-stock obvious,
- card action usable without opening detail.

### Homepage

- shopping entry above decorative storytelling,
- visible categories,
- at least one real product-discovery section,
- reduce hero dominance,
- remove dead decorative space.

### Checkout protection

- preserve existing ORS route/ETA/fee behavior,
- preserve guest checkout/payment behavior,
- visually simplify around the task.

## P1 — high-value differentiation after P0

### Deterministic recommendations

- similar products: same category, available, near price band,
- complementary products: curated category-pair rules,
- popular products: deterministic curated/seed ranking until real analytics exist,
- recently viewed: client-side history is acceptable,
- cart suggestions: small complementary set,
- out-of-stock alternatives.

### Better merchandising

- promotion/discount collections,
- contextual recommendation headings,
- category-specific featured groups.

### Data-model enhancement

- brand support and brand filter only after real brand data is added consistently,
- lightweight merchandising metadata/tags if needed.

## P2 — postpone

- ML personalization,
- collaborative filtering,
- accounts purely for personalization,
- loyalty program,
- complex delivery-slot engine,
- automatic substitutions workflow,
- reviews/ratings unless real data and moderation exist,
- advanced inventory/reservation infrastructure.

These are not required to prove a strong technical-assignment grocery experience.

---

# 5. Recommendation strategy

Start explainable.

## Similar products

Candidate rules:

- same leaf/parent category,
- `is_active`,
- stock > 0,
- exclude current product,
- rank by approximate price proximity, discount, then stable ID/name ordering.

## Complementary products

Use explicit category relationships in configuration or seed data, e.g.:

- bakery -> dairy/spreads,
- pasta/grains -> sauces,
- tea/coffee -> sweets,
- produce -> dairy/bakery depending on context.

Do not invent probabilistic claims such as "frequently bought together" unless order data actually supports them. Until then use wording such as:

- `Подойдёт к покупке`,
- `Вам может понадобиться`,
- `Похожие товары`.

## Recently viewed

P1 can use local browser state without accounts. Keep it bounded and privacy-simple.

## Personalized recommendations

Not justified yet. There is no user/account behavioral model in the current assignment scope.

---

# 6. Visual direction

## Keep

- Paykar identity,
- canonical green as brand/action color,
- Noto Sans and Tajik glyph support,
- responsive grid foundation,
- strong product photography,
- useful motion primitives where restrained,
- dark/light support if maintaining both remains cheap and coherent.

## Reduce or remove

- oversized hero dependence,
- green atmospheric effects that compete with products,
- glass on static dense shopping surfaces,
- decorative panels with no shopping purpose,
- excessive section intros before product content,
- large empty areas created for visual drama,
- motion that delays product scanning,
- "dashboard" visual cues.

## New principle

**Products are the decoration.**

The interface chrome should become quieter so images, names, prices, discounts, and actions are the most visually legible elements.

## Density

Grocery shopping benefits from faster scanning than luxury/editorial ecommerce. Cards should be compact enough that multiple products are visible without scrolling huge distances, while retaining practical touch targets and readable type.

---

# 7. Screen acceptance criteria

## Home

- Search is immediately visible and dominant.
- Categories are reachable in the first meaningful scroll area.
- At least one product section appears without passing through multiple marketing-only sections.
- No unexplained large empty region at 1440px or 1920px.
- Primary CTA starts shopping rather than sending users to informational content.

## Catalog / Search

- User can apply category + price + stock + discount + sort together.
- Current constraints remain understandable after navigation/reload.
- Active filters are visible without reopening filter UI.
- Any filter can be removed individually.
- Clear all is available when multiple filters are active.
- Result count updates consistently.
- Empty state offers reset/recovery.
- Product quick add works from grid.
- Mobile filter controls remain reachable at 390px.

## Product

- Name, unit, price, availability and add action are visible before secondary information.
- Delivery reassurance is easy to understand.
- Similar/complementary products never obscure the primary purchase action.
- Out-of-stock state offers alternatives when possible.

## Cart

- Quantity, unit price and totals are easy to scan.
- Checkout CTA is visually dominant.
- Recommendations remain secondary and limited.
- Empty cart provides a direct return to shopping.

## Checkout

- User understands current step.
- Address/map and route information are not visually ambiguous.
- Delivery price/ETA are shown before submit when quote exists.
- Payment choice is clear.
- Submit action cannot be confused with secondary controls.
- Existing duplicate-submit/idempotency protections remain intact.

## 390px mobile

- No horizontal overflow.
- Search is usable.
- Filters use mobile sheet/drawer rather than a squeezed desktop sidebar.
- Core touch targets are practical.
- Product cards do not force tiny unreadable controls.
- Sticky behavior, if added, must not consume excessive viewport height.

## 768px tablet

- Filter and catalog structure remains intentional rather than an awkward desktop collapse.
- Product grid has useful density.

## 1440px desktop

- Main catalog/product content owns the page width.
- Navigation is balanced but shopping controls remain primary.
- No excessive gutters or decorative emptiness.

## 1920px large desktop

- Content remains bounded.
- Products do not stretch into oversized cards.
- Background decoration does not dominate the page.

---

# 8. Implementation roadmap

## Phase 1 — Catalog discovery foundation

Implement:

- price and discount filters,
- active chips/clear all,
- mobile filter UI,
- URL state cleanup,
- search/filter/sort composition,
- empty-state recovery,
- catalog visual restructuring.

Dependencies:

- confirm backend product query supports/needs price and discount parameters,
- add tests for query combinations.

Primary risk:

- breaking existing search/category/pagination semantics.

## Phase 2 — Deterministic recommendations

Implement:

- recommendation service/query rules,
- product similar/complementary surfaces,
- cart suggestions,
- optional recently viewed.

Dependencies:

- decide whether complementary rules live in configuration, seed metadata, or DB.

Primary risk:

- irrelevant suggestions or misleading labels.

## Phase 3 — Homepage and visual redesign

Implement the shopping-first hierarchy and quieter visual system.

Dependency:

- Phase 1 product grid/filter primitives should be stable first.

Primary risk:

- repeating the previous mistake of visual redesign without rendered evaluation.

## Phase 4 — Product/cart/checkout visual convergence

Preserve business logic and redesign task hierarchy around the newly established system.

Primary risk:

- regressions in cart/order/delivery/payment flows.

## Phase 5 — Responsive/accessibility/performance acceptance

Verify:

- 390 / 768 / 1440 / 1920,
- keyboard navigation,
- focus states,
- contrast,
- reduced motion,
- Tajik text resilience,
- loading/error/empty states,
- image/layout stability.

---

# 9. Risks and open questions

1. **Rendered visual acceptance is still required.** Previous source-only checks were insufficient to predict human design review.
2. **Brand filtering is not yet justified by the current frontend product model.** Add only with real data.
3. **"Frequently bought together" wording is not justified without order statistics.** Use complementary-language until data exists.
4. **Dark theme may remain, but it must no longer drive the grocery design direction.** Light theme should receive equal usability attention if both are kept.
5. **Recommendation quality must remain bounded.** A small good set is better than many generic items.
6. **P0 should not trigger a backend architecture rewrite.** Extend the existing catalog query/service surface minimally.

---

# 10. Phase 0 decision

## READY FOR PHASE 1A — Catalog discovery foundation

The repository audit and review feedback are sufficient to begin the first implementation slice without another broad aesthetic pass.

Phase 1A should be intentionally narrow: **filters, search/filter composition, active-filter UX, mobile filtering, catalog hierarchy, and zero-result recovery**.

The broader visual redesign remains gated by rendered screenshot/browser acceptance. The team should not declare the full redesign successful from lint/typecheck/build/source review alone.
