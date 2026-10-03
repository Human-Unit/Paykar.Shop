# Full project visual rollout

Date: 2026-10-02. Status: **MANUAL BROWSER ACCEPTANCE — PASS; AUTOMATED BROWSER ACCEPTANCE — UNAVAILABLE**.

The requested presentation changes are implemented across the shopping application. Engineering checks, production Docker startup and the real backend ORS quote passed. The user subsequently performed final browser acceptance manually in Chrome and reported **PASS** on desktop (1440px width) and mobile emulation (390×844). Codex Browser remained disconnected, so **automated browser acceptance was unavailable and is not claimed as passed**. Earlier redesign screenshots and automated browser runs remain historical evidence, not automated verification of these new changes.

No commit or push was made. Existing README edits, generated design assets and previous progress evidence were preserved.

Subsequent branding/control changes are documented in [brand-theme-language-refinement.md](brand-theme-language-refinement.md). The manual PASS below describes the UI before that additional refinement; a fresh browser review of the new branding/controls is pending separately.

## Final manual Chrome acceptance — user-reported PASS

Evidence source: the user's explicit manual acceptance report. These results were not independently reproduced by Codex browser automation.

| Manual check | Result |
| --- | --- |
| Desktop at 1440px; mobile emulation at 390×844 | PASS |
| Theme switching and persistence | PASS |
| RU/TJ/EN switching and persistence | PASS |
| Search suggestions and keyboard behavior | PASS |
| Catalog filters and sorting | PASS |
| Product/cart quantity behavior and cart persistence | PASS |
| Checkout flow and real ORS route | PASS |
| Distance, ETA and delivery price | PASS |
| Stale quote invalidation | PASS |
| Failed checkout preserves cart | PASS |
| Successful order clears cart | PASS |
| Confirmation reload | PASS |
| No horizontal overflow | PASS |
| No direct browser request to HeiGIT; no exposed ORS key | PASS |

Manual browser acceptance resolves the previous functional acceptance blocker. The user reported final screenshots captured under `docs/progress/full-visual-final/screenshots/`. On inspection during this documentation update, that directory contained only `README.md`; no screenshot image files were present. Capture is therefore **user-reported**, while screenshot-file availability in this checkout remains unresolved. No current screenshot filenames, dimensions or contents were independently verified, and no historical screenshots were substituted.

This update records the manual results only. Automated network/credential capture, automated browser interaction checks and automated screenshots remain unavailable. It does not claim additional manual checks beyond those explicitly listed by the user.

## Acceptance resumption attempt — 2026-10-02

After the follow-up request reported Browser connected, the prescribed browser connection was retried against `http://localhost:3000`. It still returned **“No browser is available”**. The runtime troubleshooting instructions were read; the subsequent discovery returned **`[]`**. At that time, automated desktop/mobile interaction checks, new order creation, browser network capture and screenshots were blocked. A reconnect request was sent to the user. No application source was changed during this acceptance attempt. The later manual acceptance results above supersede the functional blocker, without changing this automated-browser outcome.

The production Docker stack was checked again during that attempt: all three services were healthy. The live HTTP/provider verification was rerun against the running stack; its evidence is in `full-visual-final/runtime-verification.json` and `full-visual-final/real-ors-quote.json`. This remains API/HTML verification rather than browser acceptance. Those JSON files retain the historical automated-browser blocker; the separate manual results are recorded in this report.

## Global presentation

- Shared charcoal header/footer, light grocery surfaces, white cards and compact spacing. The default dark theme intentionally means dark surrounding chrome with light commerce surfaces, matching this brief. Light theme changes the surrounding chrome; system theme follows the OS preference.
- One primary green, `#00a82d`. Darker accessible text, pale surfaces, borders, hover states and gradients derive from this token through `color-mix`. Legacy green accents, the favicon and Leaflet route/markers now use the same family. Error and stock warnings retain their semantic colors.
- Larger Cyrillic **Пайкар** brand in header/footer and a matching Cyrillic П favicon. Removed the extra header tagline and verbose topbar panel; the educational-store disclosure remains in the hero and footer. Stronger navigation weight and central search with visible cart count.
- Visible three-position icon toggle for dark/light/system, a sliding selected indicator, `aria-pressed`, localized accessible labels and 44px targets. Reduced-motion preferences disable transitions. Saved theme is resolved before first paint.
- Visible RU/TJ/EN controls; Russian and dark are defaults. A separate presentation provider stores language/theme under `paykar-presentation-v1`, without changing cart storage or checkout state. Missing/corrupt/blocked storage falls back safely. System mode responds to OS color-scheme changes.
- 279 dictionary entries cover current UI copy, category names, all 40 demo product names, descriptions, units, accessible labels, known error messages, order status, dates, currency and delivery metrics. HTML language becomes `ru`, `tg` or `en`. User-entered names and addresses remain unchanged.

Visual reference: [Paykar.tj](https://paykar.tj). This is an independent educational recreation; no production dataset or original application source was copied.

## Pages and mobile

| Surface | Applied presentation |
| --- | --- |
| Homepage | Grocery hero, route-before-order and guest-shopping cards, category photography, real demo discounts and everyday products; localized throughout. |
| Catalog and category routes | Stronger category sidebar, unified filters/cards/pagination, translated titles/products and a compact delivery-preview promo in the desktop sidebar. |
| Product | Shared breadcrumbs, large product image, prominent price/stock/actions, translated description and related cards. |
| Cart | Clear item rows, retained quantity/remove controls, stronger summary CTA and a grocery promo below the item list. Empty-state and stock notices are localized. |
| Checkout | Consistent contact/map panels, route metrics and total/CTA. Labels/errors are localized; arithmetic and quote invalidation are unchanged. |
| Confirmation | Shared success palette, snapshot item names, localized status/date/metrics/totals and saved-order links. |
| Mobile | Compact brand/cart row with search below, visible theme/language controls, horizontal category/navigation areas, two-column products and stacked cart/checkout panels. At very narrow widths the location label hides to preserve control space. Manual Chrome acceptance at 390×844, including no horizontal overflow, was reported PASS; automated viewport review remains unavailable. |

Promo content describes supported guest ordering and delivery preview. No unsupported payment, loyalty, review, favorite or account feature was introduced. Shared promotional content lives in `shopping-promo.tsx`; the previous 14 local WebP assets are reused.

## Functional boundaries

No changes to the backend, API contracts, database schema, migrations, Docker configuration, package dependencies, API request helper, cart provider or cents/arithmetic helpers. An AST comparison against the start-of-rollout component snapshot confirmed the checkout `calculate`, `submit`, `select` and `invalidateLocation` handlers are unchanged. Search debounce, cancellation and keyboard handlers retain their existing behavior in source. The user reported manual search suggestions/keyboard acceptance PASS; automated interaction verification remains unavailable.

Map language changes update existing marker labels and zoom-control labels without rebuilding the route, moving the camera, selecting a new destination or requesting another quote. The route continues to come from the **FastAPI → HeiGIT openrouteservice** integration already established in this repository. The only map geometry styling change is the shared green token.

Catalog search still uses the existing Russian-name/SKU backend index. English/Tajik search placeholders explicitly explain this; localization does not introduce a multilingual backend search index. Unknown future catalog content/error messages fall back to their original text. Native-speaker Tajik editorial review would improve confidence in wording.

## Commands actually executed

All commands below exited successfully during the implementation verification. They were not rerun for this documentation-only update. Backend commands ran inside the Python 3.12 API container. Database tests used the existing isolated `paykar_test` database, not the shopping database.

| Command | Result |
| --- | --- |
| `docker compose exec api python -m compileall app` | PASS |
| `docker compose exec api ruff check .` | PASS |
| `docker compose exec api ruff format --check .` | PASS; 33 files already formatted |
| `docker compose exec -e TEST_DATABASE_URL=postgresql+asyncpg://paykar:paykar_dev@postgres:5432/paykar_test api pytest -q` | PASS; **63 passed**, no skipped tests; one existing Starlette/AnyIO deprecation warning |
| `docker compose exec api alembic current` | PASS; `0001_foundation (head)` |
| `docker compose exec api alembic check` | PASS; no new upgrade operations |
| `npm run lint` in `apps/web` | PASS; zero warnings |
| `npm run typecheck` in `apps/web` | PASS |
| `npm run build` in `apps/web` | PASS; all application routes compiled |
| `npm run format:check` in `apps/web` | PASS |
| `docker compose config --quiet` | PASS |
| `docker compose up --build -d --wait` | PASS; production web/API built, all services healthy |
| `docker compose ps` | PASS; postgres/API/web healthy on 5433/8080/3000, loopback bindings |
| `git diff --check` | PASS; Windows LF/CRLF conversion notices only |

Formatting was applied with `npx prettier --write` to modified frontend files. Temporary inspection/audit scripts under ignored `.cache/` also ran: UI dictionary coverage/checkout-handler comparison, real HTTP routing/page checks, production bootstrap checks and credential scans. Their saved evidence is listed below. A duplicate translation-key audit found an appearance/checkout wording collision; this was corrected before final checks.

No final engineering check failed. Browser bootstrap failed with **“No browser is available”**; the subsequent browser list was empty. Automated browser acceptance therefore remained unavailable. The subsequent manual Chrome acceptance is a separate user-reported PASS, not a passing automated browser test.

## Live application and provider results

- `GET /api/v1/health`: HTTP 200, `status: ok`, `service: paykar-api`.
- `GET /api/v1/health/db`: HTTP 200, `database: connected`.
- `POST /api/v1/delivery/quote` used configured store **38.562512, 68.791511** and destination **38.5750, 68.7800**. This was a real provider call, without a mock: **FeatureCollection / LineString, 51 route points, 2,887 metres, 273 seconds (displayed as 5 minutes), delivery price 20.00 TJS**. Selected destination coordinates were returned unchanged.
- Provider endpoint remains `https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson`; secret authorization stays in the API environment.
- Homepage, catalog, category, product, cart, checkout and saved confirmation URLs returned HTTP 200 with the new branding and theme/language controls. These HTTP checks do **not** verify JavaScript hydration or visual layout.
- Existing confirmation order `9bbf8a9c-1c24-4f37-97f1-47c08f8317c2` returned identical data on repeated API reads and its page returned HTTP 200. PostgreSQL confirmed one item, subtotal **18.00**, delivery **20.00**, total **38.00**. At that automated API verification checkpoint, the main database contained five orders and product 1 stock was **9.000**; Codex created no new order. The user subsequently reported successful manual order creation, cart clearing and confirmation reload. No manual order UUID or fresh PostgreSQL verification was supplied for that later run.
- Production early-theme script passed eight isolated JavaScript cases: default dark, saved dark/light, system dark/light, invalid preference, corrupt storage and unavailable storage. This is distinct from the user's subsequent manual theme switching/persistence PASS in Chrome.
- The configured ORS key was absent from deployed JS/CSS assets (27 files), frontend source, documentation and the API/HTML payloads inspected. PostgreSQL password and direct provider URLs were absent from deployed browser assets. The user separately reported no exposed ORS key and no direct browser request to HeiGIT during manual acceptance. Automated browser request/header capture remains unavailable; no HAR or equivalent capture was supplied with the manual report.

## Evidence and remaining artifacts

Evidence folder: `docs/progress/full-visual-final/`:

- `real-ors-quote.json`: actual sanitized backend route response, public coordinates/metrics only.
- `runtime-verification.json`: live health, route, page HTTP and existing-order read results from the Codex API verification checkpoint; its browser-blocked field is historical automated status.
- `source-verification.json`: 279 translation entries, 190 static UI keys, zero missing current UI/demo catalog translations and unchanged checkout handlers.
- `theme-bootstrap-verification.json`: eight production-bootstrap cases and explicit test scope.
- `security-verification.json`: deployed asset/source/document scans and explicit automated browser-capture limitation; separate manual network/key results are recorded above.
- `screenshots/README.md`: prior automated screenshot manifest. The user reported manual captures in this directory, but only this README was visible during the documentation update. Screenshot files must be made available in the checkout to finish the submission artifact set. No older screenshot was relabeled as a final rollout screenshot.

The Browser skill at `C:/Users/ahmad/.codex/plugins/cache/openai-bundled/browser/26.825.32147/skills/control-in-app-browser/SKILL.md` requires: **“Only the Node REPL `js` tool (`mcp__node_repl__js`) can be used to control the selected browser.”** Its prescribed runtime bootstrap/troubleshooting ran and found no connected browsers. The user subsequently confirmed automation remained unavailable and performed acceptance manually in Chrome. This report does not claim that the Codex Browser connection was restored or that automated browser acceptance passed.

Manual functional acceptance is **PASS as reported by the user**. Automated browser acceptance remains **UNAVAILABLE because Codex Browser was disconnected**, and is not a prerequisite for recording the completed manual run. The remaining artifact discrepancy is the absence of screenshot image files in the inspected local directory. Make the reported captures available there before marking the complete submission artifact set ready.

Startup remains `docker compose up --build -d --wait`; open `http://localhost:3000`. The configured ignored root `.env` is retained. Engineering verification and user-reported manual browser acceptance passed. Final submission artifact readiness remains pending local availability of the reported screenshot files. No application code was changed, and no tests/builds were rerun for this documentation-only update. No commit or push was made.
