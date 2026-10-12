# Functional completeness audit

Status: **PENDING RUNTIME AUDIT**

This document is the execution checklist for the post-design functional pass. The visual redesign is considered approved; the goal now is to find and fix user-facing interactions that look complete but are dead, partial, placeholder-only, non-persistent, or disconnected from real data.

## Scope

Audit the full shopping journey:

`homepage -> catalog/search -> product detail -> cart -> checkout -> map/delivery quote -> order confirmation -> My Shopping -> repeat order -> save/open template`

Also audit:

- promotions
- stores
- favorites
- navigation
- locale switch
- theme switch
- mobile drawer
- persistence after reload
- empty/loading/error/retry states

Do **not** redesign approved UI during this pass.

## Classification

Every user-facing interaction must be classified as one of:

- **WORKING** — verified end-to-end in the actual runtime
- **PARTIAL** — works only for part of the expected flow
- **DEAD** — appears interactive but performs no meaningful action
- **PLACEHOLDER** — intentionally or accidentally uses demo-only/fake behavior
- **BROKEN** — throws, routes incorrectly, loses state, or produces wrong output
- **UNVERIFIED** — implementation exists but has not yet been exercised in runtime QA

## Priority

- **P0** — blocks the main shopping flow
- **P1** — visibly broken/dead/placeholder behavior users are likely to hit
- **P2** — incomplete or inconsistent but non-blocking
- **P3** — polish or edge case

## Interaction checklist

### Homepage

- Hero CTA/navigation
- Catalog entry points
- Featured offer actions
- My Shopping preview/carousel
- Stores entry point
- Promotions entry point
- Delivery/order-showcase CTA
- Any carousel arrows/dots
- Error/empty recovery actions

### Catalog and search

- Search query behavior
- Search clear/reset
- Category navigation
- Filters
- Active-filter removal
- Filter reset
- Sort options
- Product-card navigation
- Add to cart
- Quantity increment/decrement
- Stock limits
- Favorite toggle
- Empty results recovery
- Loading/error/retry
- Persistence after reload

### Product detail

- Product data loading
- Favorite toggle
- Add to cart
- Quantity updates
- Remove/reset behavior
- Out-of-stock state
- Recommendations/related links
- Back/category navigation
- Error/retry states

### Cart

- Quantity updates
- Remove item
- Totals recalculate correctly
- Stock constraints
- Save shopping/template actions
- Checkout navigation
- Empty-cart recovery
- Persistence after reload

### Checkout

- Form validation
- Address/location entry
- Map point correction
- Route request
- Distance/ETA rendering
- Delivery price
- Quote invalidation when address/location changes
- Retry after routing failure
- Stock/price revalidation
- Duplicate-submit protection
- Order creation
- Cart preservation on failure
- Confirmation navigation on success

### Order confirmation

- Order ID/reference
- Totals and item snapshots
- Reload/fetch existing order
- Useful next actions
- Failure/not-found states

### My Shopping

- Real order history rendering
- Repeat order
- Handling unavailable/missing items during repeat
- Save order as template
- Create template
- Edit template
- Add all template items to cart
- Current-price preview
- Stock warnings
- Template persistence after reload
- Order-history persistence after reload
- Carousel arrows/dots/keyboard
- Empty/sparse states

### Promotions

- Product links
- Favorite toggle
- Add/update/remove cart
- Sale pricing consistency
- Empty/error/retry states
- Catalog CTA

### Stores

- Marker click
- Store-row click
- Marker/list synchronization
- Popup open/close
- Map zoom/pan
- Store links/actions
- Mobile selection behavior
- OSM tile failure handling where applicable

### Global UI

- Header navigation
- Search entry points
- Cart badge/count
- Saved/favorite count
- Locale switch RU/TJ/EN
- Theme switch
- Mobile drawer open/close/Escape/focus restoration
- 404 links/recovery
- Keyboard focus states
- Touch targets

## Special audit rule: find "beautiful but dead" UI

Actively look for elements that visually imply functionality but do not really provide it, including:

- buttons without working handlers
- links to missing or wrong routes
- cards that look clickable but are not
- fake statuses or counts
- disabled controls without explanation
- carousel controls that do not advance correctly
- actions that succeed visually but do not persist
- favorites/cart/template state that resets after reload
- search/filter UI whose state does not match returned data
- repeat-order logic that silently drops unavailable items without feedback
- retry buttons that do not actually retry the failed resource

## Audit results table

Update this table during runtime verification. Do not mark an item WORKING without concrete evidence.

| Surface | Action | Status | Evidence | Priority |
| --- | --- | --- | --- | --- |
| Homepage | Primary navigation/CTAs | UNVERIFIED | Pending runtime audit | — |
| Catalog | Search/filter/sort | UNVERIFIED | Pending runtime audit | — |
| Catalog | Cart/favorite interactions | UNVERIFIED | Pending runtime audit | — |
| Product | Cart/favorite/stock | UNVERIFIED | Pending runtime audit | — |
| Cart | Quantity/remove/totals | UNVERIFIED | Pending runtime audit | — |
| Checkout | Map/quote/submit | UNVERIFIED | Pending runtime audit | — |
| Confirmation | Reload/order rendering | UNVERIFIED | Pending runtime audit | — |
| My Shopping | Repeat/template actions | UNVERIFIED | Pending runtime audit | — |
| Promotions | Product/cart/favorite | UNVERIFIED | Pending runtime audit | — |
| Stores | Marker/list synchronization | UNVERIFIED | Pending runtime audit | — |
| Global | Locale/theme/mobile drawer | UNVERIFIED | Pending runtime audit | — |

## Fix policy

After the audit:

1. Fix all **P0** issues.
2. Fix all **P1** issues.
3. Fix **P2** only when low-risk and inexpensive.
4. Leave **P3** unless it directly harms the demo.

Do not add speculative features. Do not change backend/API contracts unless required to make an already-visible feature actually work.

## Validation after fixes

Use the actual Docker runtime, not code inspection alone.

Run the relevant checks:

- frontend formatting
- lint
- typecheck
- production build
- complete frontend tests
- backend tests if backend code is touched
- `git diff --check`
- browser interaction QA for every fixed P0/P1 flow

The final report should include:

1. total interactive elements audited
2. P0/P1/P2/P3 counts
3. issues fixed
4. issues intentionally left
5. remaining risks
6. concrete runtime evidence for the main shopping flow

Do not commit functional fixes until they have been verified in the actual runtime.