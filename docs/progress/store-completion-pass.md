# Paykar — Store completion pass

**STORE COMPLETION PASS — IMPLEMENTED**

**VISUAL / INTERACTIVE ACCEPTANCE — PENDING**

Implemented on 2026-10-02 against the existing FastAPI/PostgreSQL/Next.js application. The later completion brief explicitly authorizes sandbox payments and public pages despite the earlier Day 3 scope freeze. No commits or pushes. Existing unrelated visual work, logo assets, branded background, preference/cart storage conventions, ORS configuration and historical reports were preserved.

## Public storefront and navigation

Removed the public educational/demo banner, product badge, card metadata suffix, seeded description disclaimer, footer disclaimer and educational document title. Seed descriptions remain truthful developer data; the product view substitutes the actual pack/unit explanation for known seed disclaimers, and omits the `DEMO-` SKU prefix. The README/seed notes still describe the independent assignment and demonstration dataset. Only the sandbox form/payment explanation carries its required test-payment disclosure.

Added these stable RU/TJ/EN routes using the existing shell, typography, surfaces, outer grid and breadcrumbs:

| Route | Content / behavior |
| --- | --- |
| `/how-to-buy` | Eight numbered shopping steps; catalog/cart actions |
| `/payment` | Cash and clearly disclosed sandbox card payment; retry explanation |
| `/delivery` | Actual map selection, route, distance/time, fixed fee and invalidation behavior |
| `/returns` | Conservative staff-assisted discussion; no invented legal promise |
| `/promotions` | Paginated active products with `old_price > price`, existing ProductCards/discount percentages; shared empty/retry/loading states |
| `/blog` | Four static evergreen localized article cards and reading-time estimates |
| `/blog/[slug]` | Weekly shopping, produce storage, delivery guide and checkout checklist |
| `/brands` | Honest manufacturer-data limitation and catalog action; no invented manufacturers/schema expansion |
| `/about` | Implemented shopping capabilities; no invented corporate history/statistics |
| `/contacts` | Configured store address/map action; no invented phone, email, hours or social profiles |
| `/stores` | Configured store card and independent Leaflet/attributed OpenStreetMap map; no checkout state dependency |

Article slugs: `weekly-shopping`, `fruit-and-vegetables`, `delivery-guide`, `checkout-checklist`. Content is static typed data, not a CMS. Server metadata covers home/catalog/information/blog. Client document titles follow the current page and selected language; URLs do not change. RU is the initial server metadata language because preferences remain local to the browser.

`src/lib/navigation.ts` is the canonical information-link source for desktop hover/focus previews, the drawer and footer. Every desktop trigger is a real Link; no button wraps a link. The drawer retains its native modal, Escape/backdrop close and trigger-focus restoration. Stores is reachable through drawer/footer without crowding the desktop header.

The footer contains brand, catalog/promotions, buyer links, company links, configured contact essentials and copyright/TJS note. Desktop uses the existing 1440 px grid and 32/24/16 gutters. At <=640 px native disclosures follow brand/contact essentials; links and summary targets are at least 44 px. No fake legal pages, registrations, app-store links or contacts were added.

The custom 404 uses the shared global atmosphere, a subtle large 404, localized explanation and homepage/catalog actions. Definite missing product/category/order resources invoke `notFound()` after a server-only API existence check. Invalid receipt UUIDs are missing resources; provider/network errors retain recovery UI. `API_INTERNAL_URL` is server-only and supplied by Compose. The global loading boundary was removed after it caused streamed HTTP 200 for missing resources; component-level loaders remain. [Next documents the streamed/non-streamed status distinction](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).

The final HTTP check covers six missing routes with status 404 and the registered custom `NotFoundView` in the Next RSC payload. On this Next version the initial error HTML bootstraps the client fallback instead of containing server-rendered header/footer/body text. The actual fallback/hydration appearance is part of pending browser acceptance; the HTTP check is not visual proof.

## Sandbox payment architecture and persistence

Added `app/payments` with Pydantic schemas, a small provider protocol, deterministic `SandboxPaymentProvider` and payment service. FastAPI handlers only validate/delegate. The sandbox provider has no network client and never contacts a bank.

Alembic `0002_sandbox_payments` adds a dedicated `payments` table and order payment method/status/idempotency fields. Payment records use UUIDs, constrained provider/method/status/currency, `NUMERIC(12,2)` Decimal amounts, provider reference, expiry and timestamps. They bind validated guest checkout and trusted route snapshots. No number, PAN, CVV, expiry-form or cardholder-form columns exist. Public payment detail omits checkout/phone/snapshot data.

1. `POST /api/v1/payments/sandbox/session` accepts a card checkout and required UUID idempotency key. It gets real delivery routing outside database transactions, locks products in deterministic ID order, validates current prices/stock/expected total and persists an authoritative TJS payment session. Stock is not reserved. An unchanged replay returns the existing session without rerouting; changed data with the same key returns 409.
2. `POST /api/v1/payments/sandbox/confirm` accepts **only** payment ID and a whitelisted synthetic scenario. It locks the payment row, checks status/provider/method/currency/amount/fingerprint/15-minute expiry and uses the backend provider decision.
3. Failure persists payment status/reason without creating an order or decrementing stock. Declined/error sessions permit retry. Expired sessions become cancelled.
4. Success rechecks current stock/product prices/delivery fee and commits the paid order, snapshots, stock decrement and succeeded payment linkage in one transaction. The route is the verified server snapshot; confirmation does not call ORS while locks are held. Repeated/concurrent confirmations return the same consumed order and cannot create a second order.
5. Cash creation still gets a fresh route before its transaction. UUID idempotency keys/advisory locks also prevent duplicate cash orders. Existing receipts receive `cash / due_on_delivery`; paid receipts show `card / paid` after reload.

All amounts remain Decimal in the API/database and integer cents in UI calculations. Price/stock conflicts keep the prior explicit customer-review flow. No browser-supplied success boolean or client fee/price/route becomes authoritative.

| Synthetic number field | Result |
| --- | --- |
| `SUCCESS` | Paid order |
| `DECLINED` | Declined; no order |
| `INSUFFICIENT` | Insufficient funds; no order |
| `ERROR` | Processing error; no order |

The other synthetic fields are `12/99`, `000`, `SANDBOX`. Scenario buttons fill them. The form says **Тестовая оплата — Не вводите данные настоящей банковской карты** prominently and accepts only these synthetic values. Number/expiry/CVV/holder form values never enter API requests, storage or logs; only the enum scenario leaves the component. Pydantic forbids extra card/success fields. Validation responses do not reflect submitted values. This flow changes local status only and moves no money.

Checkout keeps the original location/cart quote key, stale-request cancellation and explicit routing calculation. Method/theme/language changes do not recalculate the route. Errors preserve form/cart/destination; provider payment failures also preserve the valid quote. The busy ref blocks simultaneous submissions. The attempt UUID and payment ID survive retries while this checkout stays open. `cart.clear()` runs only after an order result, immediately before confirmation navigation. Inputs have labels, synthetic pattern constraints, error descriptions, processing status/aria-live and disabled processing controls.

## Verification actually executed

Backend checks ran in the Python 3.12 Docker API, with integration tests against a migrated dedicated unseeded `paykar_test`, not the application database. Frontend checks ran against the local pinned dependencies; both images were also built by Compose.

| Command | Final result |
| --- | --- |
| `docker compose exec api python -m compileall app` | PASS |
| `docker compose exec api ruff check .` | PASS |
| `docker compose exec api ruff format --check .` | PASS |
| `docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest` | **77 passed, no skips**; one existing Starlette/AnyIO deprecation warning |
| `docker compose exec api alembic upgrade head` (also startup) | PASS |
| `docker compose exec api alembic current` | `0002_sandbox_payments (head)` |
| `docker compose exec api alembic check` | No new upgrade operations |
| Dedicated test DB `alembic upgrade head` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; public pages/articles generated and entity routes dynamic |
| `npm run format:check` | PASS |
| `docker compose config --quiet` | PASS |
| `docker compose up --build -d --wait` | PASS; postgres/api/web healthy |
| `docker compose ps` | PASS; loopback web3000/API8080/PostgreSQL5433 |

The original 63 tests remain. Added 13 payment cases covering success/retrieval/statuses, all deterministic failures and retry, concurrent duplicate confirmation, session replay/fingerprint mismatch, incorrect total/tampered persisted amount, changed stock, expiry, direct card-order bypass, rejection/non-reflection of card fields, cash idempotency, and database failure after order/items/stock writes before the final payment flush. Rollback leaves no order, restores stock and retains a pending session for retry. A fourteenth added test covers promotions filtering/pagination/inactive exclusion and its empty state.

An ignored component-handler harness executed the actual transpiled Checkout handlers with controlled hooks/API doubles. It verified all three failures preserve cart/customer/address/point/quote, one payment session is reused, method changes do not call routing, simultaneous submit is blocked, clearing follows an order result, and form card values are absent from requests. This is **not DOM, browser or real-provider verification**. Evidence: [checkout handler check](store-completion-final/checkout-handler-verification.json).

A source audit checked 440 translation entries, 356 source UI strings and zero missing mappings, navigation link wiring and checkout request/clear guards. Twenty unused prototype translation keys were removed from browser bundles. New page data, footer, payment form/status/errors, actions and 404 use the existing RU/TJ/EN presentation surface. It does not prove translated layout quality or interactive persistence. Evidence: [source audit](store-completion-final/source-audit.json).

Live FastAPI/HTTP/PostgreSQL checks, using the actual running API and real provider:

- Real quote: **51 LineString points / 2,887 m / 273 s / 20.00 TJS**, selected point **38.5750, 68.7800**, configured store **38.562512, 68.791511**. Endpoint remains HeiGIT driving-car GeoJSON; no mock. [Raw quote](store-completion-final/real-ors-quote.json).
- All three sandbox failures returned no order and left product stock unchanged. The same session then succeeded for **38.00 TJS**. Payment `ea57d5e2-3e0f-4d91-a44f-d43c05e45a57` links to paid order `9fdbdfc9-0bd1-4154-aa08-d24a776cffc7`. Duplicate confirmations, including a subsequent declined scenario, returned the original result. Two receipt GETs returned identical persisted snapshots.
- PostgreSQL join independently verified **one payment / one linked order / one item**, succeeded payment, card/paid order and matching 38.00 totals. One unit of stock was consumed exactly once.
- Cash order `42c600b7-fd64-4ba6-a5f9-587465ff037a` persisted due-on-delivery status and returned identically for the same idempotency key.
- Search/category/product regression requests succeeded; promotions returned **8** genuinely discounted products.
- **21** normal HTML routes returned 200 with the footer. Six unknown page/blog/product/category/order/invalid-UUID routes returned HTTP 404 with the custom fallback registration. Confirmation HTML/repeated receipt data remained reachable after web/API recreation. [Runtime evidence](store-completion-final/runtime-verification.json).

Acceptance records remain in the application database with explicit technical acceptance names; this pass created one sandbox-paid and one cash order, with two total units consumed. Existing stock/orders/volumes were not reset.

## Security verification

Scanned freshly copied deployed Next static assets, web source, docs and actual API/HTML responses for the configured ORS key and private PostgreSQL password without printing either value. Zero matches. No direct HeiGIT/legacy ORS URL in browser assets; no `NEXT_PUBLIC_OPENROUTESERVICE` usage. Payment schema has no card columns; sandbox provider has no network client. Extra card fields/success booleans are rejected without reflecting their values. [Security evidence](store-completion-final/security-verification.json).

This is source/asset/payload verification. **Browser network capture is pending**, so this report does not claim observed browser request behavior or credential checks from DevTools.

## Failures found and resolved

- First container-mounted Ruff attempt could not write its cache as the nonroot user. Formatting/checks were rerun with a root one-off development container; runtime containers remain nonroot. Final Ruff checks passed.
- Initial formatting found an empty hero JSX condition left by removal of the prototype label; removed the empty condition. Ruff found fixture-import shadowing and a long comment; fixed both. Final checks passed without suppression.
- Source translation audit found missing new mappings; added them. Final audit has zero missing mappings.
- Initial missing-page HTTP check found streamed 200 responses. Removed root loading boundary, kept local loaders, and verified final HTTP 404. The Next response references the custom client fallback, whose appearance still requires browser acceptance.
- Browser runtime selector reported **No browser is available**; documented read-only discovery returned `[]`. No unrelated browser mechanism was used. Automated browser verification did not run.

## Pending manual acceptance

**Automated browser acceptance: UNAVAILABLE. Manual browser acceptance of this pass: NOT YET PERFORMED.** Previous manual acceptance/screenshots cover earlier visual passes only. No screenshots from this implementation are claimed.

At **1440, 1024, 768, 390 and 320 px**, test dark/light and RU/TJ/EN (including long TJ/EN copy), keyboard navigation and refresh persistence:

- Home, catalog, search suggestions/keyboard, category filtering/sorting, product/quantities, cart/refresh. Confirm absence of prototype wording and no horizontal overflow.
- Follow every desktop hover/focus link, every drawer link and footer link. Verify drawer Escape/backdrop/focus return; mobile footer disclosures/44px targets and desktop columns.
- Read all ten information pages and four blog articles. Check breadcrumbs, headings, actions and localized titles. Confirm promotions match discounted catalog data and brands/contact content contains no fabricated data.
- Open `/stores`: configured store marker, attributed tiles, external map action and independent informational interaction. No checkout state/quote changes.
- Checkout: real road point **38.5750, 68.7800**, route visible on Leaflet, distance/ETA/20 TJS. Method/theme/language switching preserves quote and causes no new routing request. Changing address/point/cart invalidates it.
- Choose card: only synthetic fields; prominent disclosure. Try `DECLINED`, `INSUFFICIENT`, `ERROR`: clear localized error, unchanged cart/form/point/map quote and working retry. Switch to cash after failure and verify behavior.
- Try `SUCCESS`, including double-click. One payment/order, cart clears only after the order response, confirmation displays card/paid, reload stays stable. Cash receipt shows cash/pay-on-delivery. Check focus/labels/processing announcements.
- Visit a missing page, missing blog/product/category/order and malformed UUID. Verify branded 404 actually hydrates with shared chrome/actions and no broken screen; test recovery during an API outage separately.
- DevTools: no browser request to HeiGIT, no ORS/DB key, no card form values in payload/storage/logs. Do not enter real card credentials.

Record results/screenshots before changing the status to COMPLETE / SUBMISSION READY. Browser availability, responsive rendering, native form/dialog behavior, map appearance, focus behavior, interactive language/theme persistence and actual browser cart/receipt flow are the remaining acceptance limits.

## Startup and limitations

From the repository root, preserve the existing configured `.env`:

```powershell
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
```

Open `http://localhost:3000`; API docs `http://localhost:8080/docs`. On a fresh database only, run `docker compose exec api python /seed/seed.py`. The sandbox requires no payment credentials. Configure only the existing server-side ORS/store/fee values for routing. See [README](../../README.md) for fresh/local setup and test database commands.

Known limits: synthetic payments never move money; no real dispatch, bank, acquiring, accounts, admin, CMS, refunds or fraud/reconciliation system. Sessions expire after 15 minutes and do not reserve stock; checkout may require price/stock review. Attempt IDs/customer form are in memory and reset on full checkout reload. Guest payment/receipt UUIDs are bearer links. Manufacturer/phone/email/hours data remain absent rather than fabricated. RU is server metadata default; localization occurs from saved browser preferences. No automatic geocoding. Provider quota/connectivity can affect live quotes. The existing Starlette/AnyIO warning remains. No new infrastructure or dependency was introduced.
