# Phase 3 — General Shopping-First Redesign

## Implemented

- Replaced the oversized promotional homepage composition with a compact grocery-first introduction, direct catalog and delivery actions, category shortcuts, and earlier product discovery.
- Applied a shared shopping-oriented visual system across the header, homepage, catalog, product cards and details, cart, checkout, public pages, and footer. The default for new visitors is light mode; saved light/dark preferences continue to apply.
- Reworked the catalog around products, with responsive category navigation, mobile filter disclosure, removable active-filter chips, empty results, sort options, sale and stock filters, and URL-backed minimum/maximum price filters.
- Product cards now make stock availability visible. Existing product suggestions and curated product relationships remain in place.
- Added optional non-negative `min_price` and `max_price` catalog API parameters. They only add price predicates to the existing query.

## Decisions and preserved behavior

- Kept Phase 1 catalog discovery and Phase 2 curated product connections. Suggestions continue to use the curated data; no recommendation algorithm or fabricated products were added.
- Preserved RU/TJ/EN translations, language persistence, theme persistence, responsive behavior, Noto Sans, accessibility labels, product/cart operations, guest checkout, order creation, Leaflet, and the server-side openrouteservice integration.
- No payment provider, new runtime dependency, infrastructure, or backend business-flow change was introduced.
- Work is on the local `phase3/general-shopping-redesign` branch. No commit or push was made. Existing Phase 2 work remains in the worktree.

## Verification

- Frontend: `npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm run build` passed.
- Backend: `pytest -q` passed (83 tests); `ruff check .`, `ruff format --check .`, and `python -m compileall -q app` passed.
- Runtime: `docker compose up --build -d api web` completed; PostgreSQL, API, and web containers reported healthy. `docker compose config --quiet` passed. `/api/v1/health` and `/api/v1/health/db` returned `ok`.
- Browser acceptance used Playwright against the running local stack. Homepage, catalog, product detail, cart, checkout, delivery, payment, how-to-buy, about, and store directory rendered without console errors. Tested catalog price bounds, stock/sale filters, sorting, empty results, product suggestions and add-to-cart, cart quantity/subtotal behavior, checkout map and real route quote, and language/theme persistence.
- Responsive checks covered `/`, `/catalog`, `/product/black-tea`, `/cart`, and `/checkout` at 320, 390, 768, 1024, 1440, and 1920 CSS pixels. All 30 route/viewport combinations had no horizontal overflow.
- Checkout route quote returned route geometry and displayed distance, estimated duration, and delivery price. This Phase 3 browser pass did not submit another order; full order submission and confirmation acceptance were completed during the preceding Phase 2 acceptance.
- Cleared the temporary QA cart after browser checks. Final browser state is Russian, light theme, empty cart.

## Remaining issues

- No Phase 3 acceptance blocker found. Browser console had non-fatal warnings (primarily image/LCP notices); there were no console errors.
- Existing unrelated Phase 2 changes are still uncommitted alongside this work.
