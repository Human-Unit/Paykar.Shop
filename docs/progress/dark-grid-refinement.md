# Global dark theme and precision grid refinement

Date: 2026-10-02. Status: **IMPLEMENTED — VISUAL ACCEPTANCE PENDING**.

The application now uses a complete dark palette by default, a compact header, matching subtle preference controls and shared outer grid guides. Light mode remains available; system mode and existing persistence/bootstrap remain unchanged. The local production Docker stack has been rebuilt. Engineering, live API routing and HTTP checks passed. No commit or push was made.

This report supersedes the preceding chrome-only theme description for the current UI. Earlier manual acceptance does not establish acceptance of this pass.

## Header geometry and shared grid

These are **CSS-derived design dimensions, not browser measurements**. Browser geometry could not be measured because no browser is connected.

| Desktop row | Before, estimated from preceding CSS | Current design |
| --- | --- | --- |
| Utility | 56px: 52px controls plus row padding | 44px hit area; controls have a 28px visual surface |
| Logo/search/cart | About 106px: 294px-wide PNG plus 24px padding | 72px minimum, centered grid; 224px-wide PNG |
| Navigation | About 67px including top border/padding | 48px minimum; centered 44px links |
| Header bottom border | 3px | 1px |
| Total | About 232px | 165px intended desktop geometry |

The utility row deliberately retains 44px physical height rather than the suggested 32–36px, so all six preference targets remain separate and usable. Their visible controls are only 28px tall, with 24px active fills and no glow.

All `.container` instances share `--page-max-width: 1440px` and the same responsive gutter. Utility location, logo, Catalog navigation, breadcrumbs, page titles, main content and footer therefore use the same left and right outer guides. The gutter is 32px above 1100px, 24px on tablet and 16px below 640px. There are no independent footer horizontal offsets.

The main header uses CSS Grid: `auto minmax(0, 1fr) auto`, centered items, a 24px desktop gap and 16px tablet gap. Search and cart are both 48px tall. Search has a muted dark surface, subtle border, light text and canonical green icon/focus. The cart has matching surface/border treatment, a 22px icon and 24px count badge. The logo keeps its supplied intrinsic aspect ratio. Navigation uses a common centerline, 44px targets and consistent Catalog padding; long translations can scroll inside the navigation row.

Padding, margins and major gaps in the presentation styles were normalized to the 4px sub-grid. Existing 1px border compensation and optical/icon geometry are retained where appropriate. Font sizes and line heights were not mechanically snapped to the spacing grid.

## Theme and language selectors

Reference: [saiedrahimi.com/en](https://www.saiedrahimi.com/en), used for general interaction/style direction. The web reader could not open the page; `curl.exe` successfully refreshed its public HTML and referenced stylesheet. The observed rounded controls, quiet inactive text, shared subtle surfaces and restrained color transitions informed this implementation. Its exact menu component, branding and unrelated content were not copied.

Both existing preference groups retain their labels, buttons, keyboard behavior, `aria-pressed`, setters and persistence. Each button still has a 44×44px hit box. A 28px group background sits inside that hit area; its green selection fill is only 36×24px. Selected text/icons use a dark `--on-accent` color; inactive states are muted, with subtle hover/focus. Theme icons are 16px. The selection indicator slides for 180ms without bounce or shadow. RU/TJ/EN retain equal widths and match the theme group.

The group implementation and preference event handlers are unchanged apart from the icon size. No new dependency, popover state, translation architecture or preference storage key was introduced.

## Complete palette and page coverage

| Token/purpose | Dark |
| --- | --- |
| Page | `#080808` |
| Header/footer | `#0b0b0b` |
| Primary surface | `#111111` |
| Elevated surface | `#161616` |
| Hover surface | `#1c1c1c` |
| Border | White at 8% opacity |
| Primary text | `#f5f5f5` |
| Secondary text | `#a3a3a3` |
| Quiet text | `#737373` |
| Canonical green | `--paykar-green: #00a82d` |

Green accents, focus, hover and tinted surfaces derive from the shared canonical token. Semantic errors and stock warnings use readable theme-specific colors. The original supplied PNG colors remain unchanged, as explicitly requested in the preceding task.

Hard-coded commerce whites and neutral text/border colors were replaced with theme tokens. Light mode defines coherent inverse surfaces and readable muted/error colors. `color-scheme` follows the applied theme for native controls. Default dark, saved light/dark and system OS preference continue through the existing early bootstrap and presentation provider.

| Area | Conversion |
| --- | --- |
| Homepage | Dark page, dark hero gradient, dark promos/discount area, themed benefits and categories |
| Catalog/category | Dark sidebar, active category, filters, native select/input, count, cards and pagination |
| Product cards | Dark chrome, subtle border/shadow, bright image area, light name/price and green actions |
| Product page | Dark surrounding detail panel, note, description and related cards; neutral photograph area |
| Cart | Dark item list and totals, themed separators, quantities and warning messages |
| Checkout | Dark customer/summary panels, inputs/textarea, route metrics, messages and map framing |
| Confirmation | Dark page and receipt panel, tinted success heading, light totals and themed separators |
| Shared states | Dark loading skeletons, empty states, search suggestions, errors and shopping promos |
| Footer | Dark surface and shared container/gutters |
| Leaflet controls | Themed zoom and attribution UI; normal map imagery retained |

Bright product image areas and map tiles remain imagery rather than inverted assets. There are no newly added modals/popovers. Native select backgrounds, placeholders and autofill text/surface styling are included; browser-specific rendering still needs review.

## Desktop and responsive grids

The catalog uses `minmax(220px, 240px) minmax(0, 1fr)` with a 24px gap. Its product grid uses four columns on large screens, three at 1100px and below, and two at 850px and below. At mobile width the sidebar becomes the existing deliberate horizontal category strip and the product grid retains two columns. The sidebar promo has aligned 16px inner padding and no negative horizontal margin.

Product details, cart and checkout use consistent 24px major gaps. Existing single-column breakpoints for cart/checkout are preserved. Panels use 24px desktop padding and 16px mobile padding. Promo cards follow their grid with consistent padding and row heights determined by the shared grid.

| Requested width | Intended responsive layout, inspected in source |
| --- | --- |
| 1440px | 1376px shared container, 240px catalog sidebar, four product columns |
| 1024px | 976px shared container, 240px sidebar, three product columns |
| 768px | 720px shared container, 220px sidebar, two catalog product columns |
| 390px | 358px container, 176px logo, logo/cart then full-width search, two products |
| 320px | 288px container, 160px logo, logo/cart then full-width search, two products |

On mobile the utility remains 44px, the main header has two deliberate grid rows, and navigation remains compact with local horizontal scrolling. The existing location hiding at 360px and below remains so six independent 44px controls fit without clipping. Images, product text, fields and content columns use constrained widths; names reserve more lines and prices may wrap on narrow cards. **No horizontal-overflow PASS is claimed without browser measurements.**

## Accessibility and behavior preservation

Skip link, green focus states, search keyboard handling, localized labels and `aria-pressed` remain. Preference and quantity controls, navigation, filter controls, pagination and Leaflet zoom controls retain minimum 44px targets. Reduced-motion rules disable presentation transitions, including pseudo-element indicators.

Shared theme transitions use only background color, text color and border color over 180ms. Theme variables do not change dimensions or grids. The preference indicator separately animates its transform. This CSS does not introduce theme-dependent layout geometry or remount any business component.

Hash comparison against a snapshot taken at the start of this pass checked 76 application/database files. Only four application files changed:

- `apps/web/src/app/globals.css`
- `apps/web/src/app/paykar-theme.css`
- `apps/web/src/components/preferences.tsx` (icon size)
- `apps/web/src/components/shell.tsx` (cart icon size)

Backend, database, API helper, cart provider, checkout/search/map handlers, preference provider, early-theme bootstrap and brand component are unchanged. The PNG SHA-256 is unchanged. The existing source audit found 280 dictionary entries, 190 used UI keys, zero missing UI/demo translations, and unchanged checkout handlers. No new orders were created by the live smoke checks.

Source preservation supports the limited scope; it does **not** prove interactive cart/checkout/scroll/map stability in a browser.

## Commands and actual results

Backend commands ran against the existing API container. Pytest used the separate `paykar_test` PostgreSQL database through the existing `TEST_DATABASE_URL` override.

| Command/check | Result |
| --- | --- |
| `docker compose exec api python -m compileall app` | PASS |
| `docker compose exec api ruff check .` | PASS |
| `docker compose exec api ruff format --check .` | PASS; 33 files |
| `docker compose exec ... api pytest -q` with test DB override | PASS; 63 passed, no skips |
| `docker compose exec api alembic current` | PASS; `0001_foundation (head)` |
| `docker compose exec api alembic check` | PASS; no new upgrade operations |
| `npm run lint` in `apps/web` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; all application routes compiled |
| `npm run format:check` | PASS |
| `docker compose config --quiet` | PASS |
| `docker compose up --build -d --wait` | PASS; rebuilt production web and healthy startup |
| `docker compose ps` | PASS; postgres/API/web healthy |
| `git diff --check` | PASS; existing Windows line-ending notices |
| API and database health endpoints | PASS; application OK and PostgreSQL connected |
| Public page HTTP smoke | PASS; seven shopping/order URLs returned 200 |
| Actual production early-theme script | PASS; eight isolated JavaScript cases |
| Source boundaries and translation audit | PASS |
| Deployed asset/source/documentation credential checks | PASS; zero matches |
| Fresh browser acceptance/screenshots | BLOCKED; no connected browser |

The test suite reported one existing Starlette/AnyIO deprecation warning. An ignored source-audit helper initially failed because Windows path separators differed from its expected strings; normalizing the helper's path comparison fixed it, and the source audit passed. No application check remains failed.

Tests cover backend order totals, stock conflicts, transaction rollback and provider failures, among other behavior. Mocked-provider test success is separate from the live provider verification below. Cart clearing/preservation and visual checkout interactions remain browser acceptance items.

## Real ORS and runtime evidence

The live backend quote ran through `POST /api/v1/delivery/quote`, using the configured store **38.562512, 68.791511** and selected destination **38.5750, 68.7800**. It returned:

- Real GeoJSON `FeatureCollection`, 51-point `LineString`.
- Distance **2,887 metres**.
- Duration **273 seconds**, shown by the existing formatter as **5 minutes**.
- Delivery **20.00 TJS**, matching the configured flat delivery fee.
- The selected destination coordinates unchanged.

Backend source still targets `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`. This quote is real, not mocked. API search, category and product reads also passed. Reading an existing persisted order twice returned identical data; its confirmation URL returned HTTP 200. This is API/HTTP verification, not a new browser order or a browser reload test.

The deployed web assets were copied from the rebuilt container and scanned: 27 files, zero configured ORS-key or database-password matches, zero direct provider URL matches. Frontend source, documentation and checked HTTP payloads also contained no ORS key. Browser request/header capture was unavailable.

Evidence folder: `docs/progress/dark-grid-final/`:

- `source-verification.json`
- `theme-bootstrap-verification.json`
- `runtime-verification.json`
- `real-ors-quote.json`
- `security-verification.json`
- `screenshots/README.md` with the required nine-capture manifest

## Browser review and remaining limitations

Using the [Browser skill](C:/Users/ahmad/.codex/plugins/cache/openai-bundled/browser/26.825.32147/skills/control-in-app-browser/SKILL.md), local app selection returned **No browser is available**. Prescribed troubleshooting then returned an empty discovery list, `[]`. The skill states **“Do not use external MCP browser-control tools”**; no unrelated browser surface was substituted.

Automated browser acceptance is unavailable. Manual acceptance of this newly changed version has not been supplied. No screenshots were captured for this pass, and previous manual results are not carried forward as current acceptance.

Remaining visual review: actual header heights/centerlines and shared grid edges at all five widths; dark/light/system modes; RU/TJ/EN without overflow or unexpected card/header height changes; native fields/autofill; focus, hover and reduced motion; Leaflet controls and image framing. The supplied logo's darker embedded slogan also needs readability review against the new near-black header; its pixels were preserved as requested.

Remaining interactive review: keyboard search, filters and quantities, cart persistence, populated checkout while changing preferences, preserved scroll/map/route without a new ORS call, visible real route/metrics, failed checkout retaining cart, successful order clearing cart, confirmation and browser reload.

The implementation and engineering/API regression are finished. **IMPLEMENTED — VISUAL ACCEPTANCE PENDING**.
