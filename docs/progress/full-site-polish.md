# Paykar — Full-site visual polish

Status: **FULL-SITE POLISH — IMPLEMENTED**

**VISUAL / INTERACTIVE ACCEPTANCE — PENDING**

Submission readiness is pending the new browser/manual acceptance. Earlier manual acceptance applies to the earlier frontend and does not verify this pass.

## 1. Quality benchmark and scope

The current `/delivery` page is the reference for hierarchy, section rhythm, restrained green accents, theme-aware elevated surfaces, icons, numbered steps, CTA clarity and native disclosures. Its exact layout is not repeated everywhere. The original delivery component and stylesheet are unchanged.

This pass changes frontend presentation and static editorial copy. FastAPI, database models, Alembic migrations, providers, money calculations, catalog query semantics, cart storage, checkout handlers, payment sessions and routing are preserved. No package, remote asset, animation library or new infrastructure was added. No commit or push was made.

## 2. Shared patterns

`page-patterns.tsx` provides `PageIntro`, `SectionHeader`, `StepFlow`, `CTASection` and `FAQSection`. Each is used on multiple routes and has no business state or API calls. `ArticleCard` is shared by the homepage, blog index and related reading. Existing `Empty`, `Failure` and `Loading` components were extended rather than replaced with a parallel state system.

`site-polish.css`, loaded after the established theme, styles the new compositions and scopes commerce overrides to their page wrappers. It uses the existing brand, surface, text, border and error tokens. A single bright product-image-stage token supports local grocery imagery in both themes. Outer container width, gutters, global watermark, header height and footer architecture are unchanged.

## 3–10. Shopping pages

| Route | Presentation changes |
| --- | --- |
| `/` | Existing grocery hero and benefits preserved; delivery side card now links to its explanation. Category, promotion and everyday-product sections have consistent headings. A concise shopping journey, delivery CTA and three illustrated article previews complete the page. No extra data endpoint is requested. |
| `/catalog`, `/catalog/[slug]` | Compact category context beside the existing grocery banner. Sidebar and filter surface share the grid; result counts and stock scope have a clear scan line. Pagination and loading/empty states are consistent. Query names, category selection, sorting and pagination semantics are unchanged. |
| `/product/[slug]` | Bright image stage beside a dark purchase panel; category context, actual discount, stock, quantity and CTA are grouped. Delivery/payment links use compact icons. Description and actual SKU/selling-unit/category fields form a separate details surface. Related products reuse the existing cards and have a compact empty state. No manufacturer/specification data is invented. |
| `/cart` | Shared breadcrumb and compact intro; item count, clearer remove controls, summary note and checkout CTA. Summary stays alongside items on desktop. Narrow screens place quantity, remove control and total in separate grid positions. Cart hook, stock validation and arithmetic are unchanged. |
| `/checkout` | Sections numbered 01–04 for customer information, delivery, payment and summary. Route distance/time/price use icon-based metric cards. Map loading has a stable placeholder; sandbox warnings remain visible without dominating. Payment selection is also shown in the summary. Existing form controls, IDs, values, conditions, handlers and state lifetime remain intact. |
| `/order/[id]` | Strong success/confirmation introduction, full order ID, customer/payment/status details, route metrics and purchase/totals panels. Save-link reminder and home/catalog actions. Persisted values and reload request remain unchanged; no courier tracking or dispatch promise is added. |
| `/how-to-buy` | Six illustrated, numbered steps from catalog through confirmation; compact journey visual, catalog CTA and two useful native FAQs. Static copy now describes six steps. |
| `/payment` | Cash and sandbox cards, a synthetic card illustration, retry explanation and four-step test-payment flow. Two FAQs explain that no real money is charged and that retry preserves checkout details. Genuine card data is never requested by this informational page. |

## 11. Delivery preservation

`delivery-page.tsx`, `delivery-page.css`, delivery-map logic and provider/configuration code remain byte-identical to their pre-pass baseline. Its five-section composition, six steps, configured fee and five FAQs remain in the served page. Shared state-component improvements may affect its loading/error display, but its page-specific layout is not overridden by the new `.polish-page` rules.

## 12–19. Content and recovery pages

| Route | Presentation changes |
| --- | --- |
| `/returns` | Supportive four-step journey: retain item/packaging, find the store, explain the problem, discuss next steps. Contact CTA and two disclosures. No legal entitlement, guarantee, deadline or unconfigured contact is invented. |
| `/promotions` | Branded intro plus actual discount-result count and contextual offer surface. ProductCards still use real old/current prices and the existing `on_sale` filter. Shared empty state and paging remain functional; no fake timer. |
| `/blog` | Featured illustrated article plus a three-card editorial grid; local imagery, topic, excerpt, reading time and arrow affordance. |
| `/blog/[slug]` | Narrow 820px reading column, topic/reading-time context, local hero image, numbered sections and related articles. All four existing articles are retained. |
| `/brands` | Honest manufacturer-information state beside a local assortment composition and catalog CTA. No invented brand directory or manufacturer claims. |
| `/about` | Grocery visual, known shopping features and a catalog CTA. Claims describe implemented catalog, guest checkout and delivery preview only. |
| `/contacts` | Configured store-address card beside the existing Leaflet map, external map action and useful store/delivery links. |
| `/stores` | Same configured store/map foundation with a distinct store intro and related contact/delivery actions. No invented store count, opening hours, phone or email. |
| 404 | Existing Paykar logo, subdued 404, useful explanation and home/catalog recovery actions. Uses the global background and shared shell. |

## 20. Loading, errors, empties and shared chrome

Message loading now has a product icon; grid/detail skeletons remain. Checkout and location-map chunk loading have stable surfaces. Error recovery has an icon, short heading, existing human-readable API message, retry and catalog link. Empty cart, search results, promotions, categories, brands and related products use the same spacing/icon/CTA vocabulary; related products use the compact variant.

Search suggestions, catalog mega menu, information dropdowns, mobile dialog drawer and completed footer were inspected and retained. Their source is protected by the baseline audit. Search keyboard semantics and navigation state are not rewritten. Header/search/navigation stacking remains above content; Leaflet remains inside its existing z-index 0 container, and the drawer retains the native dialog top layer. The new content creates no high z-index overlay or opaque full-page background.

## 21–24. Responsive design, localization and accessibility

Implemented breakpoints cover the requested 1440, 1024, 768, 390 and 320 widths. These are source-reviewed CSS behaviors, **not browser-measured results**:

- Wide layouts: split story intros, three-column editorial grids, three/six-step grids and four-step flows; commerce summaries remain alongside the main content.
- 1024: tighter spacing and two-column four-step flows; no new sticky summary until above this width.
- 768: story intros, product details and confirmation panels simplify or stack; editorial/step layouts use two columns.
- 390: single-column content/steps/cards, wrapping CTAs, compact image heights and numbered checkout sections; route metrics become readable rows.
- 320: smaller story padding, simplified decorative journey icons and route-value wrapping. Cart controls, total and remove action occupy distinct grid cells.

Every new customer string uses the established `usePresentation().t` dictionary. Final source audit: 571 translation entries, 465 distinct UI strings checked, zero missing TJ/EN pairs. Existing translations were retained; 40 new pairs were added. RU is the server-rendered default. Long translated text uses bounded grids and wrapping; human review of wording, line breaks and contrast remains pending.

Headings, breadcrumbs, native FAQ disclosures, proper links/buttons, original form labels, live route/error messages and visible focus behavior are retained. Primary actions and form/menu controls retain at least 44px touch targets. Decorative images have empty alt text, icons are hidden from assistive technology where appropriate, and disclosure/card motion is limited to 180ms with reduced-motion overrides. No language/theme-dependent React key is introduced on business components.

Files changed by this pass:

- `apps/web/src/app/layout.tsx`, `site-polish.css`
- `apps/web/src/components/page-patterns.tsx`, `article-card.tsx`
- `apps/web/src/components/home.tsx`, `catalog.tsx`, `product-detail.tsx`, `cart-page.tsx`
- `apps/web/src/components/checkout.tsx`, `order-confirmation.tsx`
- `apps/web/src/components/store-pages.tsx`, `states.tsx`, `not-found-view.tsx`
- `apps/web/src/lib/store-content.ts`, `translations.json`
- This report and `docs/progress/full-site-polish-final/` evidence/manual-review files.

Verification helpers/baselines remain under ignored `.cache/`. SHA-256 verification found zero changes among 64 protected backend/database/tests/provider/shared-shell/header/footer/state/storage/map/package/logo files. A normalized TypeScript AST comparison confirms checkout statements before its final presentation return are unchanged. The pass preserves earlier unrelated worktree changes.

## 25–27. Commands and checks

Frontend, run in `apps/web`, all passed on the final source:

```powershell
npm run lint
npm run typecheck
npm run build
npm run format:check
```

Backend, run at repository root, all passed:

```powershell
docker compose exec -T api python -m compileall app
docker compose exec -T api ruff check .
docker compose exec -T api ruff format --check .
docker compose exec -T -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q
docker compose exec -T api alembic current
docker compose exec -T api alembic check
```

Pytest: **77 passed**, zero skipped; one existing Starlette/AnyIO deprecation warning. Ruff: clean, 41 files formatted. Alembic: `0002_sandbox_payments (head)` and no new upgrade operations. PostgreSQL integration tests use the dedicated test database and mocked routing; those results do not establish real-provider or browser acceptance.

Additional source and controlled-handler checks:

```powershell
node .cache/polish-source-audit.cjs
node .cache/polish-checkout-harness.cjs
git diff --check
```

All passed. The first localization audit reported missing new pairs; they were supplied and the final audit passed. An initial temporary inline audit-helper command failed due to Windows shell quoting; it was replaced by a file-based helper. No application test was removed, weakened or suppressed.

Docker checks passed:

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
```

The final web image built successfully; PostgreSQL, API and web are healthy at `localhost:5433`, `localhost:8080` and `http://localhost:3000`. Alembic's normal Compose startup migration remains the sole migration path. The temporary diagnostic development server on port 3001 was stopped, and the instruction files automatically generated by that server were removed. No temporary route-boundary experiment remains in the source.

## 28–31. Regression and acceptance boundary

The controlled checkout-handler harness executes the actual component handlers with hook/API doubles, preserving the established assertions. It verifies `DECLINED`, `INSUFFICIENT`, `ERROR`, `SUCCESS`, failed-checkout cart retention, one clear/one navigation on successful creation, same payment-session reuse, double-submit guarding and absence of card-form fields in requests. Preference rerenders across RU/TJ/EN and dark/light preserve customer fields, destination and the quote with no extra routing call. **This is not DOM, Leaflet or browser verification.**

Live smoke commands, all exited successfully:

```powershell
python .cache/polish-runtime.py
python .cache/polish-security.py
python .cache/polish-http-final.py
```

Actual HeiGIT provider check through `POST /api/v1/delivery/quote`:

| Field | Result |
| --- | --- |
| Provider | `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson` |
| Geometry | Real GeoJSON LineString, 51 coordinates |
| Distance | 2,887 m |
| Estimated driving time | 273 s |
| Delivery price | 20.00 TJS, matching configured flat price |
| Destination | 38.5750, 68.7800 |

This was a separate API smoke request, not a request made by an informational page. Geometry is saved in `full-site-polish-final/real-ors-quote.json`.

Live sandbox payment: `DECLINED`, `INSUFFICIENT` and `ERROR` produced no order and did not decrement stock. `SUCCESS` on the same session created one order; repeated SUCCESS/DECLINED confirmation returned that same order. Two `GET /orders/{id}` responses matched the successful confirmation. PostgreSQL directly confirmed one linked payment, one order and one item with matching 38.00 TJS totals and paid/succeeded statuses. The separate cash order was idempotent and remained due on delivery. This smoke created two labeled local acceptance orders (one card, one cash), with the expected one-unit stock decrement for each successful order; no real card was used.

Card-order confirmation URL for manual review: `http://localhost:3000/order/2eb6ae6f-1722-40c5-ac32-665e2745a354`. Cash order: `acec5541-a67a-4e07-ab30-70f45df7ae09`. Runtime JSON contains the matching payment ID and database evidence. These are API/database confirmations, not evidence that the browser cart or Leaflet flow passed.

HTTP smoke: 21 valid routes returned 200 with the shared footer; six missing-resource URLs returned 404 and carried the custom `NotFoundView` component reference. The delivery response retains all five sections, six steps and five disclosures. Promotion filtering returned eight actual discounted products.

**404 acceptance detail:** the literal branded-heading assertion did not pass for live missing-resource HTTP responses. They contain the framework error/RSC payload rather than the rendered heading. The generated production `_not-found.html` contains the branded 404 markup and shared footer. The follow-up report explicitly separates HTTP status, component reference, generated markup and pending browser rendering. It does not convert the unsuccessful literal-markup assertion into a visual PASS. The established route validators and `notFound()` behavior were retained. Next's route-level not-found convention is described in the [official Next.js documentation](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).

Security scan: all 34 static files listed in the rebuilt web container were fetched over HTTP. Zero configured ORS-key matches in deployed assets, frontend source or repository docs; zero database-password or provider-domain matches in deployed assets; no public ORS configuration. The smoke's 52 HTTP responses also had zero credential matches. Unchanged payment schema has no PAN/CVV/expiry/cardholder columns, unchanged sandbox provider has no external payment client, and the controlled-handler checks confirm synthetic card-form values never enter API requests. Browser network traces remain pending.

Evidence files: `source-audit.json`, `checkout-handler-verification.json`, `runtime-verification.json`, `real-ors-quote.json`, `security-verification.json` and `checks.json` under `full-site-polish-final/`.

Browser automation: **UNAVAILABLE**. The Browser skill connection attempt returned `No browser is available`; its documented troubleshooting/discovery returned an empty browser list. No alternate browser-control surface was used and no screenshots were fabricated.

Manual acceptance of this pass: **PENDING**. The requested route, viewport, theme, language, keyboard, overflow, sandbox-payment and checkout state review is listed in `full-site-polish-final/screenshots/README.md`. Previous screenshot sets are not relabeled as evidence for the new design.

Remaining limitations: rendered layout (particularly 404 hydration), visual balance, translated line breaks, actual browser focus/hover behavior, Leaflet interaction and browser network traces require connected-browser or new manual review. These boundaries prevent a `COMPLETE` or `SUBMISSION READY — YES` declaration today, even when source/build/API checks pass.
