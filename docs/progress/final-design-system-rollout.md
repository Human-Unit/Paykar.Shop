# Final shared design system rollout

Date: 2026-10-02.

**FINAL DESIGN SYSTEM — IMPLEMENTED**  
**VISUAL ACCEPTANCE — PENDING**

The requested catalog design language now governs the shared header, information navigation, grocery banners, category rows and commerce surfaces across the application. Engineering checks and the real backend route quote passed against the rebuilt local production stack. Automated browser connection remains unavailable, and no new manual acceptance has been supplied. Final visual submission readiness remains pending.

No commit or push was made. Existing unrelated work, including README edits and earlier reports/assets, was preserved.

## Global design system and grid

The canonical palette remains page `#080808`, header `#0b0b0b`, surface `#111111`, elevated surface `#161616`, hover `#1c1c1c`, 8% white borders, primary text `#f5f5f5` and muted secondary text. All application green accents derive from `--paykar-green: #00a82d`; original PNG/image pixels are preserved.

Every main route shares the same Shell, Brand, SearchBox, Preferences, MainNavigation, BurgerMenu and footer. Only useful presentation boundaries were added: `site-navigation.tsx`, `shopping-banner.tsx` and `category-label.tsx`. Existing ProductCard, AddButton, quantity controls, recovery states and business components are reused.

The existing 1440px outer container and 32/24/16px responsive gutters continue through utility, main header, navigation, breadcrumbs, content and footer. Major gaps use 24px; inner panels use the 8px grid and 4px fine spacing. The new catalog title/banner row uses the **same 240px sidebar/content split** as the catalog below, so banner/filter/product content edges share a guide on desktop.

Header design dimensions remain 44px utility + 72px main + 48px navigation + 1px border, approximately **165px total**. These are CSS-derived design dimensions, not a newly measured browser height. The supplied 224px-wide header PNG, 48px search/cart and aligned navigation retain their geometry across themes. The original logo, intrinsic ratio, Russian wordmark and embedded slogan were not redrawn or recolored.

## Header architecture and information navigation

The utility row contains location, preference controls and the burger at the far right. The main row retains the prominent supplied Paykar identity, central search and localized cart/count. The category-heavy top navigation was replaced with:

`Каталог · Как купить · Условия оплаты · Условия доставки · Возврат товара · Акции · Блог · Бренды · О нас · Контакты`

Catalog links to the existing catalog. Promotions links to the homepage's actual discounted-products section, now identified by `#promotions`; no promotions backend or fake discount filter was created.

The other eight information items use one shared data source for both desktop disclosures and the burger drawer. Desktop mouse hover or keyboard focus opens a compact elevated panel. Escape closes the panel, focus leaving its wrapper closes it, and outside pointer interaction closes it. Trigger buttons expose `aria-expanded` and `aria-controls`. Informational panels use simple readable content rather than pretending to be application menus with unsupported arrow-key selection behavior.

Information content stays within demonstrated functionality:

| Item | Content |
| --- | --- |
| How to buy | Choose items, cart, address/point, review and confirm a demo order |
| Payment | Online payment is not connected in the educational version |
| Delivery | Select map point; obtain route, distance/ETA and price before ordering |
| Returns | Returns are not processed in this demo; no legal policy is invented |
| Blog | The section is not implemented |
| Brands | No brand directory is supplied in the demo catalog |
| About | Independent educational recreation, not the official Paykar site |
| Contacts | Store contact details are not published in this demo |

The CSS accommodates desktop disclosure panels without the previous navigation overflow clipping. At tablet widths less essential desktop links are hidden; all entries remain available in the burger. On mobile only Catalog and Promotions remain in the visible navigation row, so the full desktop list is not squeezed into a narrow viewport.

## Theme, language and burger behavior

The visible theme group now offers **Dark and Light only**, with Moon/Sun icons. System/device mode is no longer offered. To preserve existing saved preferences, a previously stored `system` selection still follows the existing OS listener/bootstrap and highlights the corresponding displayed button. Choosing Dark or Light saves an explicit mode through the unchanged provider. A small presentation-only OS subscriber resolves the indicator; it does not change business state or preference storage architecture.

RU/TJ/EN remains a sibling compact group, Russian by default. Both preference groups retain 44×44px hit areas, the 28px visual group surface, a green active fill, quiet inactive labels, 180ms indicator motion, focus and reduced-motion support. The removed System target frees space for the 44px burger button without expanding the utility row.

Burger navigation uses a native modal `<dialog>` and the same information entries as desktop. Native modal behavior supplies Escape cancellation, focus containment and focus restoration. Close button, outside-backdrop click and navigation links also close it. Information sections use native `<details>/<summary>` disclosures, so mobile does not depend on hover. No dialog dependency, duplicated preference controls or CMS was added.

These interaction paths are implemented and compile successfully; actual pointer/keyboard/focus behavior remains a browser acceptance item.

## Shared promotional banner

`ShoppingBanner` provides the same dark-to-canonical-green composition in two meaningful places:

- Homepage hero: existing grocery imagery, supplied Paykar identity, strong localized headline, shopping CTA and educational note.
- Catalog/category title row: compact headline/banner spanning the content column, beside the page title/subtitle on desktop.

The component uses existing `hero.webp`, the unchanged Brand component/PNG and the existing localization dictionary. No new image generation, external asset, dependency or promotional business claim was introduced. Banner images are decorative; text and CTA remain real HTML. The original homepage product/category requests and discount selection are unchanged.

Repeated sidebar promotional explanations were removed. The populated cart and shared empty states also no longer render a decorative shopping promo: their recovery/checkout actions remain direct and clear. The previous `ShoppingPromo` source was preserved; it is no longer imported by these pages.

## Page-by-page rollout

| Page/area | Final presentation |
| --- | --- |
| Homepage | Shared grocery/Paykar hero, existing category navigation, benefits, discount section and everyday products using the same card system as catalog |
| Catalog/category | Title/subtitle beside banner on desktop; categories-only sidebar; consistent Lucide icon, label and chevron rows; green active indicator with `aria-current`; unchanged filters/sort/pagination |
| Product | Bright image area, newly framed dark detail panel, prominent price/stock, existing green purchase controls and identical related ProductCards |
| Cart | Dark item list and elevated summary/CTA; decorative promo removed; existing quantities, removal, subtotal, stock validation and persistence unchanged |
| Checkout | Elevated dark customer/delivery/summary panels, themed fields, readable route metrics and existing dark map framing; no checkout/map handler changes |
| Confirmation | Elevated dark receipt, green success heading, existing UUID/status/items/delivery/totals/metrics and persistence unchanged |
| Search suggestions | Elevated theme surface, existing thumbnail/name/unit/price, selected row with green left indicator; search requests/debounce/cancellation/keyboard code unchanged |
| Empty/error/loading | Consistent elevated dark panels, short existing messages and recovery actions; redundant promo removed |
| Footer | Existing shared container, compact dark identity/useful links and educational disclosure; no fabricated company/legal data |

Product cards retain their existing structure and stock logic. Purchase buttons and in-card quantity controls now share a 48px height; the buttons still have at least 44px hit targets. Bright neutral product-image regions remain the intentional exception to dark chrome.

## Responsive behavior and localization

| Width to review | Intended layout |
| --- | --- |
| 1440px | Four catalog columns, 240px sidebar, title/banner aligned with sidebar/content grid |
| 1024px | Three catalog columns; essential desktop information links plus complete burger |
| 768px | Two catalog columns, 220px sidebar; title/banner stack rather than crowd the heading |
| 390px | Two product columns, horizontal category strip, logo/cart then full-width search, abbreviated visible navigation and complete burger |
| 320px | One product column for readable names/prices/48px purchase controls; 160px header logo; location remains hidden at this narrow width so controls fit |

At 360px and below all shared product grids use one column rather than assuming two small cards are usable. The menu's width is bounded by the viewport, its height by the dynamic viewport, and its content scrolls internally. Long information text wraps and drawer summaries remain touch accessible. Actual no-overflow, card heights and translated header fit require browser measurement.

The dictionary grew from 280 to **306** entries, adding complete Tajik/English translations for the new information navigation, drawer controls and banner copy. New reusable components call the existing `t` function, including dynamic navigation content; the source audit separately checks those dynamic strings. There are no missing current UI/demo translations. No translation architecture, backend indexing or language request behavior was changed.

## Scope preservation evidence

A snapshot at the start of this pass covered 102 application/database/public/configuration files. Hash comparisons confirm these remain unchanged:

- All backend/database files, models, migrations and order/delivery services.
- Cart and presentation providers; API helper; checkout, map and search components; ProductCard/stock/quantity logic; confirmation component.
- Early-theme bootstrap, supplied PNG/public assets, `.env`, Docker Compose and dependency manifests/lockfile.

Only eight existing frontend source files changed: presentation CSS, shell, preference controls, home, catalog, cart-page, shared states and translations. Three shared presentation components were added. AST comparisons confirm homepage/catalog/cart data preparation is unchanged; the existing audit also confirms checkout handlers are unchanged.

No new orders were created against the main application database by the live verification. Pytest used its separate PostgreSQL test database.

## Commands actually run

Frontend commands ran in `apps/web`; backend commands ran in the API container with the existing separate `TEST_DATABASE_URL` override for pytest.

| Command/check | Final result |
| --- | --- |
| `python -m compileall app` | PASS |
| `ruff check .` | PASS |
| `ruff format --check .` | PASS; 33 files |
| `pytest -q` | PASS; 63 tests, no skips |
| `alembic current` | PASS; `0001_foundation (head)` |
| `alembic check` | PASS; no new upgrade operations |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; all application routes compiled |
| `npm run format:check` | PASS |
| `docker compose config --quiet` | PASS |
| `docker compose up --build -d --wait` | PASS; rebuilt production web, all services healthy |
| `docker compose ps` | PASS; postgres/API/web healthy, loopback ports 5433/8080/3000 |
| `git check-ignore .env` | PASS; `.env` ignored |
| `git diff --check` | PASS; existing Windows line-ending notices |
| Source/AST and localization audits | PASS |
| Production early-theme bootstrap | PASS; eight isolated JavaScript cases |
| Production HTTP/SSR markup audit | PASS; two theme choices, three languages, eight information disclosures and closed drawer on seven routes |
| API health and database health | PASS |
| Real backend delivery quote | PASS; not mocked |
| Credential/source/deployed-asset scan | PASS |
| Interactive browser/visual acceptance | UNAVAILABLE; manual review pending |

The first six backend command attempts failed before reaching application code because the Docker Desktop Linux engine pipe was absent. Docker Desktop was restarted locally in the background, the production stack rebuilt, and all six commands then reran successfully. This environment interruption is resolved.

Pytest still reports one existing Starlette/AnyIO deprecation warning. An ignored SSR audit initially expected the static `/catalog` response to contain the banner; that response has the existing Suspense/client-rendered fallback. The audit was corrected to distinguish SSR visibility from hydrated rendering, without changing page behavior. `/catalog/produce` did include the banner in its response. Hydrated catalog rendering remains a browser review item.

No application regression check remains failed. Bootstrap VM evaluation and HTTP/source checks do not verify interactive browser behavior.

## Real provider and security results

The live request ran through `POST /api/v1/delivery/quote` using configured store **38.562512, 68.791511** and selected customer point **38.5750, 68.7800**. It returned a real `FeatureCollection` with a **51-point LineString**, **2,887m**, **273s** and **20.00 TJS** delivery. Existing formatting displays approximately **2.9km / 5min**. Destination coordinates and configured flat delivery price matched.

The unchanged backend targets `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`. Provider test fixtures were not used for this final quote. API product/category/search reads passed; an existing persisted order was read twice with identical data, and its confirmation route returned HTTP 200. No new browser order or browser confirmation reload is claimed.

Freshly copied assets from the rebuilt web container were scanned: **27 files**, zero configured ORS-key matches, zero database-password matches and zero direct provider URLs. Frontend source, documentation and checked API/HTML payloads also contained no ORS key. `.env` is unchanged and ignored; no secrets were added to navigation/banner copy. Browser network/header capture is unavailable, so those asset/payload checks are not presented as a full browser-network acceptance run.

Evidence is stored in `docs/progress/final-design-system-final/`:

- `source-verification.json`
- `translation-verification.json`
- `theme-bootstrap-verification.json`
- `markup-verification.json`
- `runtime-verification.json`
- `real-ors-quote.json`
- `security-verification.json`
- `screenshots/README.md` with required captures and manual acceptance checklist

## Browser status, screenshots and submission readiness

The [Browser skill](C:/Users/ahmad/.codex/plugins/cache/openai-bundled/browser/26.825.32147/skills/control-in-app-browser/SKILL.md) connection retry returned **No browser is available**. Prescribed troubleshooting and discovery returned `[]`. The skill states **“Do not use external MCP browser-control tools”**; no unrelated browser automation surface was substituted.

Automated browser acceptance is unavailable. No manual acceptance of this new version has been supplied. **No new screenshots were captured**; the screenshots folder currently contains its manifest/checklist only. Previous acceptance and screenshots cover previous UI versions.

Remaining review includes all five widths and RU/TJ/EN in both themes; actual header height/grid edges; menu placement and hover/focus/Escape/outside behavior; modal focus containment/return and mobile disclosures; preserved search keyboard behavior; long card labels; native inputs/selects/autofill; logo/slogan contrast; reduced motion and horizontal overflow. The supplied slogan's dark green pixels remain unchanged and need visual readability review against the header/banner.

Final interactive regression also remains pending: cart and quantity persistence, populated checkout across theme/language changes without scroll/form/map/route reset or another ORS call, visible real route and metrics, failed checkout retaining cart, successful creation clearing cart, order confirmation and reload, and browser credential/network inspection.

The implementation is finished and engineering/API checks passed. Final visual submission readiness depends on the manual checklist or restored browser acceptance. **FINAL DESIGN SYSTEM — IMPLEMENTED; VISUAL ACCEPTANCE — PENDING**.
