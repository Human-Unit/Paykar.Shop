# Shopping-first navigation and UI cleanup

Date: 2026-10-07. Baseline: `5275238a892bf722459573be87f5d841cf6a4dbf`.
Repository: `D:\Workshop\Paykar\Test_Task_Paykar_Shop-main`.
Production frontend: http://localhost:3000.

## Result and implementation sequence

Implemented the approved focused cleanup without changing the visual identity or commerce architecture.

1. Established a canonical destination registry, primary/supporting groups, and pure boundary-aware route matching. Added and ran navigation tests immediately, before updating consumers.
2. Updated the header, grouped drawer, footer, and mobile bar. Removed information-hover previews and their unused architecture/styles. Catalog retains its existing mega-menu with the shared active-state rule added to its trigger.
3. Reordered the homepage and gave promotions an independent sale-products request. Retargeted the hero shortcuts, then removed the agreed duplicate homepage sections.
4. Cleaned informational pages through their shared renderer and reduced the delivery walkthrough to three delivery-specific steps.
5. Added stable-ID product recommendation deduplication and focused tests.
6. Rechecked the existing My Shopping behavior without editing its components or storage logic.
7. Completed static checks, production Docker rebuilds, browser acceptance, localization auditing, and visual evidence review.

New/changed copy was collected in the existing RU/TJ/EN dictionary before page consumption. Final source audit found no missing dictionary entries among the changed components' literal translation keys, navigation labels, titles, or descriptions. No duplicate dictionary keys were introduced.

## Navigation

- Desktop: Catalog → My Shopping → Promos → Stores.
- Mobile: Catalog → My Shopping → Promos → Cart. Home remains available through the logo; Stores is in the drawer.
- Drawer/footer groups: Shopping, Customer Help, Company. Saved Items remains accessible.
- Catalog is active on catalog/category/product routes. My Shopping is active on its overview and template-editor routes. Matching respects path boundaries.
- Search, cart counts, sticky chrome, language/theme controls, native drawer focus restoration, and checkout's hidden bottom bar are retained.
- The Catalog mega-menu still supports hover, keyboard entry, Escape/focus restoration, outside click, and direct mobile Catalog navigation.

## Homepage rhythm

| Order | Section           | Purpose              |
| ----- | ----------------- | -------------------- |
| 1     | Hero              | Introduce the store  |
| 2     | Promos            | Commercial urgency   |
| 3     | Categories        | Discovery            |
| 4     | Everyday products | Direct shopping      |
| 5     | My Shopping       | Return-user shortcut |
| 6     | Order phone       | Service storytelling |
| 7     | Stores            | Physical network     |
| 8     | Blog              | Editorial content    |

Homepage promos use `/products?on_sale=true&in_stock=true&page_size=5`. Their loading/error state is isolated to that section: categories and everyday products remain usable when sales are delayed or fail. Successful empty sales hide the section; failures remain visible and retryable. The Promos destination stays available, with a useful Catalog action on its successful empty state.

Removed the separate shopping-step block, delivery banner, compact curated grid, and hard-coded black-tea connection block from the homepage. Curated sets remain in My Shopping; contextual product connections remain on product pages. Hero links are navigation shortcuts, not additional explanatory sections.

## Informational pages: what stayed and what changed

| Page       | Kept                                                                                            | Removed/changed                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| How to Buy | Complete six-step guide and final Catalog action                                                | Duplicate miniature journey, repeated FAQ answers, duplicate intro Catalog CTA                         |
| Delivery   | Visual identity, illustration, benefits, calculation CTA, all five pricing/ETA/stale-quote FAQs | General six-step shopping walkthrough replaced with select destination → calculate/review → confirm    |
| Payment    | Payment options, sandbox warnings, failure recovery, four test-flow instructions                | Repeated FAQ explanations                                                                              |
| Returns    | Four practical return steps and Contacts CTA                                                    | Repeated FAQ answers                                                                                   |
| About      | Introduction, original visual, and feature content                                              | Extra generic shopping banner                                                                          |
| Contacts   | Configured address, purchase-question support guidance, related delivery link                   | Removed map/location block; localized Find a store action opens `/stores`; no invented contact details |
| Stores     | Existing address, map, directions, and related links                                            | Location-focused introduction                                                                          |
| Promos     | Real products, pagination, cart actions, helpful empty state                                    | Redundant intro jump CTA                                                                               |

Contacts describes how to reach staff about products/orders and shows the configured address without a map. Its localized Find a store action opens `/stores`. Stores owns the location/map experience; its existing location renderer and map implementation are unchanged. This corrects the initial implementation's mistaken reuse of the map block on Contacts.

## Product recommendations and My Shopping

Category alternatives exclude the current product ID and connected IDs, deduplicate by ID, and only then apply the five-product limit. The helper preserves source order and does not mutate inputs. A successfully empty secondary row disappears; request failures remain visible with retry. Product descriptions/styles and card/cart behavior are unchanged.

My Shopping retains conditional history/templates, curated sets, contextual creation, positive counts, save/edit/repeat/bulk-add behavior, persistence, anchors, and visible warnings/errors. The acceptance template was created using the actual editor, then reused only inside isolated test browser contexts. No fake personal content is shipped.

## Commands actually executed

From `apps/web`, all final checks passed:

```text
npm run lint
npm run typecheck
npm run format:check
npm run build
npm run test:navigation
npm run test:recommendations
npm run test:catalog
npm run test:shopping
```

Tests: navigation 4, recommendations 3, catalog 13, shopping 6 — **26 passed, zero failures/skips**. Production build generated 22 static pages. Navigation tests also passed at the Stage 1 gate. After the mobile-label CSS correction, format/build passed again; final lint/typecheck/format checks passed on the completed source. `git diff --check` passed.

Production runtime commands:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up --build -d --no-deps web
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env ps
```

The final web-only production rebuild/start passed. PostgreSQL, API, and web are healthy. API/PostgreSQL were not rebuilt or reseeded.

## Automated browser acceptance — PASS

Browser: Chromium `154.0.8037.98` through Playwright, against the Docker production frontend. Each run used isolated contexts, closed afterward; existing user tabs/storage were untouched.

Evidence: [structured results](shopping-first-ui/browser-results.json), [screenshots](shopping-first-ui/screenshots/).

- Full **30-case** homepage/shared-navigation matrix: 320/390/768/1024/1440 × RU/TJ/EN × dark/light. Correct section order, document language/theme, desktop primary links, and mobile labels; zero horizontal overflow or instrumented page exceptions.
- **Initial 16 representative informational-route checks:** eight changed routes at desktop 1440px (EN/light) and mobile 390px (TJ/dark). Retained guide/FAQ counts, removed duplicates, and one heading verified. This initial run incorrectly accepted a map on Contacts; the correction and 24-case rerun below supersede its Contacts map expectations. Original screenshots/results remain historical before-correction evidence.
- Primary navigation, active category/product/template-editor routes, Catalog keyboard/Escape/outside-click, grouped drawer/Saved access/focus restoration, and mobile links passed.
- Intercepted delayed/503/empty promo responses confirm independent homepage rendering, visible retryable failure, recovery, hidden successful empty section, and useful dedicated-page empty action.
- Intercepted category overlap/duplicates/empty and category/connection 503 responses confirm ID-based exclusion before limiting, hidden empty secondary rows, and visible request errors.
- Fresh/history-only/templates-only/both My Shopping states passed. Real preview APIs passed repeat order, personal/curated bulk add, save-order template creation, editor changes/reload, cart persistence, and all three anchors. An intercepted preview failure preserved the cart.
- Search suggestions support ArrowDown and Enter. Actual desktop and mobile preference controls switch languages/themes and persist after reload.
- The phone's normal sequence reaches Delivered. Reduced motion shows its final state without requiring the sequence.

### Commerce smoke and real routing

Filtered catalog → product → cart → checkout passed. The backend returned a real delivery quote for latitude `38.5750`, longitude `68.7800`:

| Result         | Value                     |
| -------------- | ------------------------- |
| HTTP           | 200                       |
| Route geometry | GeoJSON FeatureCollection |
| Distance       | 2,887 metres              |
| Route duration | 273 seconds               |
| Delivery price | 20.00 somoni              |

The browser made no direct request to HeiGIT/openrouteservice during this flow. Order submission was intercepted with HTTP 503; the cart remained intact and survived reload. Confirmation and repeat behavior used an existing persisted test order. No new order was submitted to the backend, so stock and orders were not mutated by acceptance. No capability UUIDs or customer details are included in the structured report.

Normal navigation, sales/product data, shopping previews, existing confirmation, and the delivery quote used real APIs. Only explicitly described failure/loading/empty/overlap scenarios were intercepted. This was a focused smoke check, not a repeat of the entire checkout/payment test suite.

## Protected scope and verification corrections

The [structured evidence](shopping-first-ui/browser-results.json) records normalized SHA-256 comparisons for 15 protected files, all unchanged: map components/network/directory data and styles, phone animation, My Shopping components/styles, checkout, presentation context, product content, motion/font tokens, and checkout/shop styling. Backend, database, cart/storage implementation, branding assets, and package lock have no changes.

Initial checks caught a missing Catalog pathname binding, unused imports, and formatting differences; all were corrected without suppressions. The first responsive run found the new My Shopping label truncating at 320px. The mobile bar now reserves two label lines without changing font size; the complete final 30-case matrix passed afterward.

Browser helper corrections included waiting for scheduled keyboard focus, excluding nested Catalog category links from primary-link assertions, using the mobile tab instead of the hidden desktop trigger, and scoping product/submit/language selectors to their actual components. Initial off-screen screenshot captures left reveal elements inactive; final homepage screenshots scroll through every section before capture. These helper failures are not claimed as successful checks; the structured evidence contains the corrected completed runs.

## Contacts map ownership correction — PASS

Removed `StoreLocation` from Contacts only. A small address-only panel uses the existing `/delivery/config` request with localized loading and retryable failure states. Existing purchase-question guidance and the configured address are preserved. The clear action is **Найти магазин → / Ёфтани мағоза → / Find a store →**, linking to `/stores` through the existing related-link styling. No telephone, email, hours, or policy details were added.

The Stores branch still mounts the original `StoreLocation` renderer, which compares unchanged against `HEAD` (normalized SHA-256 `3d11995e0331f4a3bcd6a87ca27315d484c59b5a8c71c1e3cd60c7ec84a2a3cf`). All 15 protected files were compared again and remain unchanged. The shared map import and location styles are still required by Stores; there are no Contacts-only dead map imports/styles. No map/directory source, coordinates, labels, mounting on Stores, or gesture settings were edited.

All requested commands were rerun after the correction and passed: lint, format check, typecheck, production build, navigation tests (4), recommendation tests (3), catalog tests (13), shopping tests (6), and `git diff --check`. Total: **26 tests passed, zero failed/skipped**. The web-only Docker production rebuild passed; web, API, and PostgreSQL are healthy. API and PostgreSQL were not restarted or reseeded.

Automated Chromium acceptance against the rebuilt Docker frontend passed **24 route cases**: Contacts and Stores × desktop 1440×900/mobile 390×844 × RU/TJ/EN × dark/light. Contacts has zero map containers, zero store-location blocks, and zero OpenStreetMap tile requests in every case. Address/support information and localized Stores access remain visible. Stores retains one map, one marker, the same configured coordinates/directions link, and the matching address tooltip. Both routes have the expected document language/theme, one heading, no horizontal overflow, and no instrumented page exceptions.

Following the Contacts action to Stores passed at both sizes. Map interaction checks passed for initial zoom 16, zoom-in to 17 and back, address tooltip, desktop drag, mobile touch pan, disabled wheel zoom, and loaded real OpenStreetMap tiles. The first panning helper inspected the marker instead of its translated parent; its mobile coordinates also hit a zoom control. Corrected checks inspected the map pane and targeted the canvas. No map code changes were needed.

These checks used real APIs and tile requests, with no interception. No orders were created or changed. Browser contexts were isolated and closed afterward.

Evidence: [correction results and protected-file hashes](shopping-first-ui/contacts-correction-results.json). Before-correction Contacts screenshots remain [desktop](shopping-first-ui/screenshots/shopping-first-contacts-1440.png) and [mobile](shopping-first-ui/screenshots/shopping-first-contacts-390.png). Final examples: [Contacts desktop RU/dark](shopping-first-ui/screenshots/contacts-correction-contacts-ru-dark-1440.png), [Contacts mobile TJ/light](shopping-first-ui/screenshots/contacts-correction-contacts-tj-light-390.png), [Stores desktop RU/dark](shopping-first-ui/screenshots/contacts-correction-stores-ru-dark-1440.png), and [Stores mobile TJ/light](shopping-first-ui/screenshots/contacts-correction-stores-tj-light-390.png). EN/dark desktop screenshots are included in the same directory. Final Contacts screenshots contain no map.

## Remaining issues and publication

No remaining blocker from the requested acceptance checks. Existing Node module-type warnings remain non-failing. Docker `npm ci` reported five high-severity dependency audit findings; dependency versions and lockfile are unchanged, and no dependency/security upgrade was included in this UI task.

Changes remain local and uncommitted. No staging, commit, or push was performed.
