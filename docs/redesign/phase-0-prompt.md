# Phase 0 — Grocery UX Discovery and Redesign Foundation

## Role

Act as a senior ecommerce product designer, UX researcher, information architect, and frontend systems reviewer. This phase is **discovery and design definition only**. Do not implement production UI or backend features yet.

## Context

Paykar is a grocery ecommerce application built with Next.js, TypeScript, FastAPI, PostgreSQL, Leaflet/OSM, openrouteservice, multilingual RU/TJ/EN presentation, guest cart/checkout, order confirmation, delivery routing, sandbox payment, theme support, and responsive layouts.

The latest review was negative: the visual design was considered weak and the product was judged to have low functionality. Specific gaps called out were:

- insufficient catalog filters,
- weak product discovery,
- missing buying suggestions/recommendations,
- and a need for a broader redesign rather than another visual-polish pass.

The existing system is technically functional. Phase 0 must determine how to turn it into a credible grocery shopping product without destabilizing the working commerce flow.

## Primary objective

Produce an evidence-led redesign foundation that answers four questions before coding:

1. What are the most important grocery-shopping tasks the interface must optimize?
2. What functionality is missing or underdeveloped in the current product?
3. What information architecture and screen hierarchy should replace the current marketing-heavy presentation?
4. What exact acceptance criteria should Phase 1 implementation satisfy?

## Ground rules

- Read `AGENTS.md` first and respect its architecture and security constraints.
- Audit the repository as it exists. Do not assume features that are not present.
- Preserve working commerce logic unless there is concrete evidence it blocks the redesign.
- Do not add authentication, microservices, Redis, Kafka, Kubernetes, real payment gateways, or unrelated infrastructure.
- Do not expose ORS secrets to the browser.
- Do not implement production code in Phase 0.
- Do not redesign by aesthetic trend alone.
- Prefer shopping speed, clarity, discoverability, trust, and mobile usability over decorative motion/glass effects.
- Treat the latest review feedback as a product problem, not merely a CSS problem.
- Clearly distinguish observations from hypotheses.
- If rendered browser inspection is unavailable, say so. Do not claim visual acceptance from source inspection alone.

## Audit scope

Review at minimum:

- homepage and information hierarchy,
- header/navigation/search,
- catalog and category pages,
- filters and sort behavior,
- search and search recovery,
- product cards,
- product detail,
- cart,
- checkout/delivery/payment,
- recommendation opportunities,
- mobile behavior,
- accessibility states,
- loading/error/empty states,
- design-system consistency,
- light/dark behavior,
- RU/TJ/EN resilience,
- performance-sensitive UI patterns.

## Required Phase 0 deliverables

### 1. Current-state UX audit

For each major surface, document:

- what already works,
- what creates friction,
- what is missing,
- what should be preserved,
- what should be removed or simplified,
- severity: P0 / P1 / P2.

### 2. Grocery shopping jobs-to-be-done

Define the main user jobs, including at least:

- find a known product quickly,
- browse a category,
- narrow a large product list,
- compare alternatives,
- discover useful complementary items,
- add/remove quantities quickly,
- recover from out-of-stock or zero-result states,
- understand delivery cost/time,
- complete checkout with confidence.

For each job, define the expected shortest successful path.

### 3. Information architecture

Propose a new structure for:

- header/navigation,
- search suggestions,
- catalog/category hierarchy,
- filter taxonomy,
- product detail,
- cart,
- homepage content order,
- recommendations,
- secondary informational pages.

Do not blindly copy another retailer's branding.

### 4. Functionality matrix

Create a P0/P1/P2 matrix.

At minimum evaluate:

- category/subcategory filters,
- price range,
- availability,
- discount/promotional filter,
- brand filter only if the data model supports meaningful brands,
- sorting,
- active filter chips,
- clear-all,
- mobile filter drawer/sheet,
- URL-backed filter state,
- autocomplete/query suggestions,
- typo/zero-result recovery,
- similar products,
- complementary products,
- frequently bought together,
- popular products,
- recently viewed,
- cart recommendations,
- personalization vs deterministic recommendations.

Avoid ML/personalization unless the project has enough real behavioral data to justify it.

### 5. Screen-level acceptance criteria

Define measurable criteria for:

- Home,
- Catalog/Search,
- Product,
- Cart,
- Checkout,
- Mobile 390px,
- Tablet 768px,
- Desktop 1440px,
- Large desktop 1920px.

Acceptance criteria must be functional and visual, for example:

- a user can discover and apply a filter without hunting,
- active filters are visible and individually removable,
- search, category, sort, and filters compose correctly,
- product cards expose price, unit, availability, and add/quantity controls without opening the product page,
- cart and checkout avoid decorative content that competes with completion,
- mobile touch targets remain practical,
- no accidental large dead zones,
- key actions retain accessible focus/contrast states.

### 6. Design direction

Define a practical grocery visual system:

- product imagery should dominate over decorative chrome,
- green should primarily indicate brand/action/state, not flood the interface,
- use motion only where it clarifies hierarchy/state,
- reserve glass effects for layered UI when useful,
- use denser but readable product grids,
- reduce oversized marketing hero dependence,
- make catalog/product discovery visually stronger than editorial decoration,
- ensure both dark and light themes remain usable if both are retained.

Document what should be removed from the current visual language if it slows shopping or makes the interface feel like a dashboard/concept piece rather than a grocery store.

### 7. Implementation roadmap

End Phase 0 with a sequence for implementation, ideally:

1. catalog/filter/search foundations,
2. recommendation model and endpoints,
3. homepage/product discovery redesign,
4. product/cart/checkout redesign,
5. responsive/accessibility/performance pass,
6. final visual acceptance and regression.

For each phase, state dependencies and regression risks.

## Repository-specific starting evidence

Use the current repository as the source of truth. Verify rather than assume. Initial areas to inspect include:

- `apps/web/src/components/catalog.tsx`
- `apps/web/src/components/product-card.tsx`
- `apps/web/src/components/home.tsx`
- `apps/web/src/components/shell.tsx`
- `apps/web/src/components/cart-page.tsx`
- `apps/web/src/components/checkout.tsx`
- `apps/web/src/components/product-detail.tsx` if present
- `apps/web/src/lib/api.ts`
- FastAPI catalog routes/models
- `docs/progress/astra-final-design-polish.md`

## Definition of done for Phase 0

Phase 0 is complete only when:

- the current product is audited by shopping task rather than by component cosmetics,
- P0/P1/P2 functionality is explicit,
- information architecture is explicit,
- Home/Catalog/Product/Cart/Checkout acceptance criteria are written,
- preserved vs replaced UI is explicit,
- Phase 1 can be implemented without making major product decisions mid-code,
- no production behavior was changed during discovery.

## Output

Create/update:

`docs/redesign/phase-0-foundation.md`

The document must contain:

- executive summary,
- current-state audit,
- jobs-to-be-done,
- information architecture,
- P0/P1/P2 functionality matrix,
- recommendations strategy,
- design direction,
- screen acceptance criteria,
- implementation roadmap,
- risks/open questions,
- and a final Phase 0 decision: `READY FOR PHASE 1` or `NOT READY` with reasons.
