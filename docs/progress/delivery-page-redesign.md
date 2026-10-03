# Delivery page redesign

Date: 2026-10-02. Scope: frontend presentation for `/delivery` only.

**DELIVERY PAGE REDESIGN — IMPLEMENTED**

**VISUAL ACCEPTANCE — PENDING**

No commit or push was performed. The existing worktree contained earlier store, payment, branding and theme changes; those changes were preserved.

## 1. Before and after

Before: breadcrumb, plain title, four large information panels, catalog/cart buttons, shared footer.

After: breadcrumb, delivery hero with static route illustration, four compact benefits, six numbered steps, delivery calculation CTA, five FAQ disclosures, shared footer. The old delivery sections were removed from the generic information-page data. Only the delivery slug renders the new component; other information pages retain their existing renderer and metadata.

## 2. Hero

The hero uses the existing 1440px page container, responsive gutters, typography, Paykar green and theme tokens. The main heading is “Доставка”. Concise copy explains what can be checked before confirming an order. The catalog link supplies a useful first action without requiring a basket. A translucent surface and atmospheric green gradient allow the global branded background to remain visible.

## 3. Route illustration

Local, decorative SVG shows quiet street/block shapes, a curved dotted green route, endpoints and a vehicle marker. Store/destination labels sit on readable theme surfaces. The store address comes from the existing public `GET /api/v1/delivery/config`; while unavailable, a generic route-origin label is shown without inventing an address. No coordinates or street address are duplicated in page source.

The whole illustration is `aria-hidden` and is not presented as a calculated route. It has no tiles, external map screenshot, Leaflet instance, provider client or new dependency. The real interactive map remains in checkout. The page's own data hook requests delivery configuration only; it does not request a quote or call ORS. This is source evidence; browser network behavior still requires manual acceptance. The shared footer also uses the existing configuration endpoint.

## 4. Benefits

Four compact Lucide icon/text items explain the route, estimated travel time, clear price and ability to review purchase details. They form a four-column strip on wide screens, two columns on smaller desktops/tablets and a vertical list on mobile. These are distinct benefit statements rather than repeated calculation instructions.

## 5. Step flow

An ordered list contains six cards: basket, customer details, map location, delivery calculation, order confirmation, saved confirmation. Each has a number badge, icon, title and short description. Six cards share a row on large desktops, with dashed connectors; the layout changes to three, two and finally one column as space decreases. Connectors are removed below the six-column layout.

The sixth step deliberately describes the implemented persisted confirmation flow instead of promising courier dispatch or tracking. The existing application does not implement those operations. Cards use elevated theme surfaces and subtle borders; number text uses the existing theme-aware brand ink token.

## 6. CTA

A green-tinted surface with a grid/pin illustration highlights “Точная стоимость для вашего адреса”. “Рассчитать доставку” is a normal link to `/checkout`. The existing checkout handles an empty cart. This page does not implement a second calculator, submit an order, alter the basket or change routing behavior.

## 7. FAQ

Five native `details`/`summary` disclosures cover fixed pricing, estimated travel time, address changes after confirmation, changes before confirmation and when to recalculate. Answers distinguish driving time from packing/arrival time and describe the existing guarded checkout flow. They do not promise delivery deadlines or customer-service outcomes.

The fee is formatted from `delivery/config.delivery_price` using existing money helpers. The page contains no hard-coded delivery fee. If configuration is unavailable, the general explanation remains usable and directs the customer to the amount shown during checkout.

Summaries retain native keyboard behavior, visible focus, generous touch targets and a subtle chevron rotation. Reduced-motion preference disables that transition. Browser keyboard interaction is pending verification.

## 8. Responsive behavior

These are implemented CSS layouts, not browser-verified measurements:

| Target width | Hero | Benefits | Steps | CTA |
| --- | --- | --- | --- | --- |
| 1440 | Copy and route side by side | 4 columns | 6 columns, connectors | Copy and pin side by side |
| 1024 | Copy and route side by side | 2 columns | 3 columns, no connectors | Copy and pin side by side |
| 768 | Stacked hero | 2 columns | 2 columns, no connectors | Compact pin alongside copy |
| 390 | Stacked, compact route visual | Vertical list | Vertical cards | Stacked, compact pin |
| 320 | Same mobile structure with wrapping labels | Vertical list | Vertical cards | Stacked, wrapping CTA |

Grids use `minmax(0, 1fr)`, text can wrap, buttons permit translated wrapping and icons do not shrink. Route labels use bounded widths and smaller padding/icons on mobile. The route view is 272px tall on mobile with quieter map detail; the action in the hero precedes it. Most spacing follows the existing 8px grid. A page-only bottom gap supplements the shared main-content spacing before the existing footer. No global header, footer, background or container styles were changed.

## 9. Localization and themes

All new customer copy, section labels and FAQ content use `usePresentation().t` and the existing RU → TJ/EN dictionary. Added 46 translation pairs; existing pairs were preserved. The source audit covers 395 distinct UI strings and finds zero missing translations across the frontend. The dictionary now has 486 entries. Metadata continues to use the existing delivery entry and shared locale handling.

Dark remains the default. Surfaces, muted/body text, green accents, borders and CTA text use the established theme tokens. Light mode uses the existing light surfaces and darker brand ink for small number text. Theme/language controls and persistence were not modified. Long TJ/EN wrapping, contrast and persistence on the new layout still need browser review.

## 10. Files changed in this task

- `apps/web/src/app/[slug]/page.tsx`: select the delivery-specific renderer.
- `apps/web/src/components/delivery-page.tsx`: page content and local static route illustration.
- `apps/web/src/components/delivery-page.css`: styles scoped to delivery classes.
- `apps/web/src/lib/store-content.ts`: remove the former four delivery panels.
- `apps/web/src/lib/translations.json`: TJ/EN copy for the new presentation.
- `docs/progress/delivery-page-redesign.md`: implementation, evidence and pending acceptance.
- `docs/progress/delivery-page-final/source-audit.json`: localization/source audit.
- `docs/progress/delivery-page-final/runtime-verification.json`: HTTP, asset and protected-source evidence.
- `docs/progress/delivery-page-final/real-ors-quote.json`: actual backend quote response.

Temporary verification helpers and baseline hashes are under ignored `.cache/`. SHA-256 comparison found zero changes in 55 protected backend/database/checkout/cart/API-client/map/shared-shell/footer files. Backend service, endpoint, store settings, delivery pricing, payments and order logic were not edited. Existing logo bytes and other local assets were not altered; no package was added.

## 11. Frontend checks

Run in `apps/web`:

```powershell
npm run lint
npm run typecheck
npm run build
npm run format:check
```

All passed. Production output includes the statically generated `/delivery` route. TypeScript errors were not suppressed. A supplemental source audit initially failed for the missing “Рассчитайте доставку” TJ/EN pair; the pair was added and the audit rerun successfully. The frontend checks were rerun after correcting translations; the final CSS was also included in the rebuilt production image.

The runtime HTTP check found `/delivery` returning 200 with the expected five sections, six steps, five native FAQ elements, a checkout CTA and shared footer. The former `information-grid` is absent. Home, catalog, category, product, cart, checkout, how-to-buy, payment and contacts also returned 200 with the shared shell. This verifies server responses, not browser interactions or rendered layout.

The public delivery-page JS/CSS and fetched HTTP responses were checked for the configured ORS key without printing the key. Zero matches were found; the provider domain was also absent from those public assets. This is a bounded asset/response scan, not a browser network trace.

## 12. Backend regression

Run against the running API and dedicated test database:

```powershell
docker compose exec api python -m compileall app
docker compose exec api ruff check .
docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
```

All passed: **77 tests**, no skips or test changes. One existing Starlette/AnyIO deprecation warning was emitted. No migration or database schema change was made. API health and PostgreSQL health endpoints both returned `ok`.

## 13. Docker

Run from the repository root:

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
```

Configuration validation and rebuilt-stack startup passed. PostgreSQL, API and web are healthy. The frontend is available at `http://localhost:3000/delivery`, API at `http://localhost:8080/api/v1`, PostgreSQL on loopback port 5433. The ignored root `.env` retains the existing private routing configuration. No credentials were added to frontend environment variables or documentation.

## 14. Real ORS regression

A separate verification helper called `POST /api/v1/delivery/quote` with customer point `38.5750, 68.7800`. The unchanged backend uses the HeiGIT driving-car GeoJSON endpoint. This is a real-provider result, not a mocked test:

| Field | Observed result |
| --- | --- |
| Geometry | GeoJSON FeatureCollection / LineString |
| Route points | 51 |
| Distance | 2887 m |
| Travel time | 273 s, approximately 5 minutes when rounded for display |
| Delivery fee | 20.00 TJS, matching configured flat pricing |
| Selected destination | 38.5750, 68.7800 |
| Configured store | 38.562512, 68.791511 |

The quote was triggered by the regression helper, not by a delivery-page visit. The full response is in `delivery-page-final/real-ors-quote.json`. No acceptance order was created and no production inventory was changed during this presentation task.

## 15. Visual acceptance status and manual checklist

Automated browser acceptance: **UNAVAILABLE**. Browser selection returned “No browser is available”; discovery returned an empty list. No browser screenshot, viewport measurement, interactive smoke test or browser network trace was produced. Source, build, HTTP and provider checks do not substitute for visual acceptance. Earlier manual acceptance for other rollouts does not accept this new delivery layout.

Manual browser acceptance for this task: **PENDING**. Review `/delivery` at **1440, 1024, 768, 390 and 320px**, in **dark/light** and **RU/TJ/EN**. Save resulting screenshots under `docs/progress/delivery-page-final/screenshots/` when reviewed.

- [ ] Hero copy and static route remain balanced; store and destination labels never overlap or clip.
- [ ] Hero catalog action is easy to reach on mobile; route art is compact and clearly an illustration.
- [ ] Benefits align and wrap; step cards remain readable with 6/3/2/1 columns and mobile connectors absent.
- [ ] CTA text, grid/pin visual and checkout link fit at every width. Empty-cart behavior remains the existing checkout state.
- [ ] FAQ toggles with mouse, Enter and Space; Tab focus is visible. Reduced-motion preference disables the chevron transition.
- [ ] TJ/EN labels and answers wrap at 390/320 without truncation or horizontal overflow.
- [ ] Dark/light colors remain readable; global green atmosphere remains visible between sections and at page edges.
- [ ] Shared header, search, cart, burger and footer work as before; mobile footer disclosures remain usable.
- [ ] Theme/language switching persists after reload; no new console/hydration errors appear.
- [ ] Network inspection confirms visiting `/delivery` requests configuration only for this page and never a delivery quote or direct HeiGIT call.
- [ ] Checkout still calculates the real route only after the user's action, handles stale quotes, preserves failed carts and clears a successful order's cart; confirmation reload remains usable.

The only outstanding acceptance blocker is the unavailable browser review. No frontend, backend, Docker or real-provider failure remains after the translation correction.
