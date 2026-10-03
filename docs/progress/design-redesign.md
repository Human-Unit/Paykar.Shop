# Paykar visual redesign

Verified on 2026-10-01 UTC (work continued into 2026-10-02 in Asia/Tashkent) against the running production Docker stack at `http://localhost:3000`.

## 1. Visual baseline

The completed Day 3 design used a white header, pale green illustrated hero, square illustrated category cards and three-column desktop catalog. Existing screenshots remain in `day-3-final/`. The running application and [public Paykar site](https://paykar.shop/) were inspected before editing. The public site did not finish loading its banner images during the reference capture; the user's supplied direction governed the charcoal/green composition. No official logo, reference image or production dataset was copied.

## 2. Design direction and scope

Modern Paykar: charcoal header and footer, saturated green promotions, light shopping content, photographic-style food assets and stronger commerce hierarchy. Shared tokens live in `apps/web/src/app/paykar-theme.css`, imported after the existing stylesheet. This is a presentation layer; existing routes, API calls, calculations and state remain in their original modules.

Only four existing frontend source files changed: layout imports, homepage presentation, shell presentation and product-image presentation. One stylesheet and local image assets were added. `git diff --exit-code` confirmed no changes to backend, database, Compose, cart context, API/format utilities, search, checkout, map or confirmation implementations. Tests and assertions were not edited. No packages, APIs, infrastructure or unsupported controls were added.

## 3. Header

Charcoal framing, a larger green textual wordmark with white `shop`, central white search and a bordered cart action with a vivid count. Catalog moved into the navigation row alongside the existing category destinations. All destinations are functional. No account, telephone, loyalty or contact data was invented. The existing demo information strip remains visible.

## 4. Hero

Desktop uses a 75/25 main-banner/side-card grid. The local grocery-bag image occupies the main banner, with a green text overlay, strong headline and catalog CTA. Side cards describe the actual route preview and guest shopping capabilities. No delivery-time promise, opening hours or price-superiority claim was added. The mobile banner has its own height, type scale and crop.

## 5. Categories

Six existing category destinations now use 128px circular food/household images on desktop. Mobile has 90px images in a horizontal snap strip. Text remains the accessible link name; decorative image alternatives are empty. Hover emphasizes the image border and movement. The nested fruit category and all backend category relationships remain unchanged.

## 6. Product cards

White bordered tiles, moderate corners, larger photographic-style imagery, bold prices, muted struck-through prices and green discount badges. Purchase actions are saturated green with dark text; selected quantities retain their existing minus/count/plus controls. All discount calculations, stock limits and cart handlers are unchanged. Known demo SVG image paths map to local assets only in `ProductImage`; arbitrary supplied image URLs are preserved. The existing error fallback and product-name alternative text remain.

## 7. Catalog

Four columns at 1440px, three at 1024px and two at 768/390px with a sidebar. The filter surface is lighter and more compact, with green active categories and native controls. Actual browser regression verified price-descending sort, availability filtering (38 available products), page 2 of 4 and the nested fruit category. Query construction and pagination logic were untouched.

## 8. Product page

Dominant square image, heavier title and 40px desktop price, clear stock text and purchase controls. Description, unit/SKU information, related products and breadcrumbs remain. Mobile stacks the image and details; the large product image loads eagerly. A deliberately aborted image request verified that the original fallback SVG still renders.

## 9. Cart

Clear white product rows, larger thumbnails and prices, green summary framing and a strong checkout CTA. Mobile uses a deliberate grid for the image/name and quantity/price/remove row. Quantity changes and reload retained one item and an 18.00 TJS subtotal in the acceptance flow. Temporary visual/stock-review cart items were removed using the UI; final cart count is zero.

## 10. Checkout

Existing architecture receives a visual skin: white sections, stronger headings, moderate input corners, green summary framing and a clear final CTA. Customer fields, coordinate inputs, map selection, quote invalidation and submit handlers are unchanged. Actual API 422 submission failures preserved the cart and entered customer data. A separate browser-only 503 fixture checked recoverable provider feedback; the successful quote/order checks used the real backend and provider.

## 11. Confirmation

Green success treatment and a white receipt containing the existing identifier, status, customer/address, item snapshots, route metrics and totals. UUID receipt loading is unchanged. Both new acceptance orders were retrieved after reload; receipt text remained the same. No raw phone data was added to public receipts.

## 12. Mobile

Logo/cart row, full-width search, horizontally scrollable catalog/category navigation. The 324px hero is followed by two compact side cards; categories scroll locally and product cards stay in two usable columns. Cart, checkout and receipt stack independently. Catalog and navigation scroll within their own regions, with no document overflow.

## 13. Accessibility

Skip link, labels, live errors, combobox/listbox semantics and accessible button names are preserved. Keyboard regression on desktop and mobile verified ArrowDown, ArrowUp, selected Enter navigation and clear/focus behavior; Escape and full-results Enter were exercised in checkout acceptance. The skip link received keyboard focus. Dark text on vivid green purchase actions avoids the low contrast of small white text on that green; darker green is used for text on white.

All visible inspected header/main buttons and map zoom links measured at least 44px in both dimensions across the 24 page/viewport combinations. Reduced-motion styling disables the added image/card/button transitions. This was focused browser and source verification, not a complete screen-reader or formal WCAG certification.

## 14. Assets and performance

Fourteen own, generated photographic-style demo assets are stored under `apps/web/public/images/paykar/`. They are synthetic images, not official Paykar photography or exact SKU/packaging representations. Seven distinct produce photos avoid using an apple image for bananas, carrots or oranges. Other departments share assortment images, a remaining visual limitation.

The hero is 1536×1024 and 105,540 bytes. Thirteen other assets are 600×600. Total new WebP payload is 487,294 bytes (about 476 KiB); individual assets are at most 105,540 bytes. Explicit image dimensions/aspect ratios avoid layout shifts. The hero is prioritized, the large product image eager and other images retain default lazy loading. No new external image dependency or font request was introduced. Existing OpenStreetMap tiles remain part of the working map.

Generation used the built-in OpenAI imagegen text-to-image tool; originals remain outside the repository. Delivery assets were resized and encoded as WebP with Pillow, quality 82/method 6. Prompts and provenance are in [design-assets.md](design-assets.md); dimensions/bytes are in [asset-manifest.json](design-final/asset-manifest.json).

## 15. Desktop visual verification

Incremental browser review followed header/hero/category changes, catalog/card changes and cart/checkout changes. Final production review covered 1440, 1024 and 768px. Header hierarchy, image crops, filters, cards, totals and route display were inspected. All six final desktop screenshots were opened and reviewed. Source and DOM checks found no missing images or undersized inspected buttons.

## 16. Mobile visual verification

The 390px browser review covered all six page types, actual checkout and receipt reload. All six final mobile screenshots were opened and reviewed. The map showed the route and both destination/store markers. Full-page PNGs omit the browser's 15px scrollbar gutter, so a 390px browser viewport produces a 375px-wide content screenshot in this environment. Document scroll width equalled client width at all four requested viewport sizes.

Evidence: [responsive-verification.json](design-final/responsive-verification.json), [search-stock-verification.json](design-final/search-stock-verification.json), [mobile-verification.json](design-final/mobile-verification.json) and [desktop-verification.json](design-final/desktop-verification.json).

## 17. Backend regression

These commands actually ran successfully against the API container. Tests used the dedicated `paykar_test` PostgreSQL database and did not reset the shopping database.

| Command | Result |
| --- | --- |
| `docker compose exec api python -m compileall app` | Passed |
| `docker compose exec api ruff check .` | Passed |
| `docker compose exec api ruff format --check .` | 33 files formatted |
| `docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q` | 63 passed, zero skips; one existing dependency deprecation warning |
| `docker compose exec api alembic current` | `0001_foundation (head)` |
| `docker compose exec api alembic check` | No new upgrade operations |

## 18. Frontend regression

Run from `apps/web`: `npm run format`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm run format:check` passed on the final application source. TypeScript errors were not suppressed. The production build rendered all existing static/dynamic routes. The existing debounce, cancellation and request-handling code has a zero diff; no timing benchmark was claimed.

Browser checks also confirmed actual cart stock enforcement: with the current stock of 9 units, plus became disabled at 9. That temporary cart was then removed. Missing image fallback, sorting, availability, pagination, nested categories, keyboard search and reload all passed.

## 19. Docker and credential checks

`docker compose config --quiet` and `docker compose up --build -d --wait` passed. `docker compose ps` showed postgres, api and web healthy. Both API health endpoints and the web homepage returned HTTP 200. Production is running on ports 3000 (web), 8080 (API), 5433 (PostgreSQL), bound to loopback.

The credential scan found zero configured ORS-key or database-password matches in 26 deployed static assets and the captured browser network evidence. No browser Authorization headers, direct ORS requests or public secret variables were found. The intentionally public development database password remains in existing local setup documentation; the ORS key does not. CORS continued to allow localhost:3000 and reject an untrusted origin. See [security-verification.json](design-final/security-verification.json).

## 20. Real ORS and order regression

Desktop and mobile followed shopping → search suggestions/full results → product → quantity changes → cart → reload → checkout → map point → real quote → route/metrics → order → confirmation → reload. Browser traffic called the local API; the unchanged server routing implementation uses `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`.

Store: 38.562512, 68.791511. Selected customer point: 38.5750, 68.7800. Real quote: 2,887 metres, 273 seconds, 20.00 TJS, GeoJSON FeatureCollection with a 51-point LineString. UI: 2.9km, 5 minutes and 20.00 TJS. Those minutes are route travel time, not a promised fulfilment time.

Address edits invalidated the quote, disabled submission and made no automatic re-quote. Changing name/comment retained the route. On mobile, the 315px-wide/300px-high map contained one route path and both visible markers. Cart remained one item immediately before delivery of the successful HTTP 201 response; afterward it was zero. Two immediate submit clicks produced one creation request.

PostgreSQL joins confirmed both new orders and their item snapshots:

| Viewport | Order UUID | Subtotal / delivery / total | Distance / duration | Quantity |
| --- | --- | --- | --- | --- |
| Desktop | `ccbac5f7-f214-4fb7-9cd1-b8dd7ab232a2` | 18.00 / 20.00 / 38.00 TJS | 2887m / 273s | 1.000 |
| Mobile | `9bbf8a9c-1c24-4f37-97f1-47c08f8317c2` | 18.00 / 20.00 / 38.00 TJS | 2887m / 273s | 1.000 |

Each contains product 1 at unit/item total 18.00 TJS, the selected coordinates and status `pending`. Existing orders were preserved. Apple stock moved from 11 to 9, exactly the two new orders; there are now five main-database orders. These are labelled technical acceptance orders with no actual delivery requested.

## 21. Limitations, tooling corrections and comparison

There are no remaining acceptance blockers. The original textual logo remains an independent placeholder. Some departments share generated assortment imagery; exact packaged-product photographs were not fabricated. Imagery is synthetic and the demo disclaimer remains. System typography is used without proprietary fonts. No Lighthouse performance score or formal accessibility certification was run.

The first desktop browser script completed order creation, confirmation reload and all six screenshots, then failed when exporting evidence through a browser download because the browser context closed. Evidence recovery reloaded the existing receipt and checked PostgreSQL without creating a duplicate order. Subsequent capture returned JSON directly. An early mobile run had stale cart setup and screenshot decoding of lazy images; the harness was corrected and the full mobile flow passed. These were verification-harness issues, not application failures. An extra quote recovery request succeeded, but its harness attempted to call Fetch's numeric `status` as a function; no application code was changed for that mistake. A root-directory `npm run format` failed because the package is in `apps/web`; the command passed from the correct directory. A remote photo lookup returned 401; no remote photo was shipped. Generated local assets resolved the imagery requirement. All final required engineering commands passed.

| Dimension | Previous design → current result |
| --- | --- |
| Brand identity | Pale header → large green wordmark, charcoal framing and saturated green promotion |
| Commerce density | Three-column desktop catalog → four columns; tighter category/section spacing |
| Hero | Floating vector illustrations → photographic grocery-bag composition and useful side cards |
| Categories | Illustrated square tiles → recognizable circular grocery imagery |
| Product cards | Soft pale actions → imagery, bold prices, green purchase/quantity controls |
| Mobile | Desktop elements wrapped → deliberate header, banner crop, scrolling categories and stacked purchase flow |
| UX | Search, stock controls, breadcrumbs, related items, real routing, errors and reload remain verified |

No commit or push was made for this redesign.

## 22. Final screenshots

All files are under `docs/progress/design-final/`:

| Page | Desktop | Mobile |
| --- | --- | --- |
| Home | [desktop-home-redesign.png](design-final/desktop-home-redesign.png) | [mobile-home-redesign.png](design-final/mobile-home-redesign.png) |
| Catalog | [desktop-catalog-redesign.png](design-final/desktop-catalog-redesign.png) | [mobile-catalog-redesign.png](design-final/mobile-catalog-redesign.png) |
| Product | [desktop-product-redesign.png](design-final/desktop-product-redesign.png) | [mobile-product-redesign.png](design-final/mobile-product-redesign.png) |
| Cart | [desktop-cart-redesign.png](design-final/desktop-cart-redesign.png) | [mobile-cart-redesign.png](design-final/mobile-cart-redesign.png) |
| Checkout | [desktop-checkout-redesign.png](design-final/desktop-checkout-redesign.png) | [mobile-checkout-redesign.png](design-final/mobile-checkout-redesign.png) |
| Confirmation | [desktop-confirmation-redesign.png](design-final/desktop-confirmation-redesign.png) | [mobile-confirmation-redesign.png](design-final/mobile-confirmation-redesign.png) |

**VISUAL REDESIGN — COMPLETE**
