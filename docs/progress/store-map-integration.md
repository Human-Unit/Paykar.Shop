# Store map integration acceptance

Date: 2026-10-07. Repository: D:\Workshop\Paykar\Test_Task_Paykar_Shop-main.
Local application: http://localhost:3000.

## Git baseline

- Started with a clean main worktree.
- Starting origin/main: ea0294c13ff66733671179d052619e8f4a12dcdf.
- Starting origin/feat/store-map-experience: 205ec4f184741be612438735560578afe8a1adff.
- Fetched origin with pruning and created the local tracking map branch.
- Merged origin/main into the map branch: 70649bfae86d38bf0f61c5313a85c8a954475c69.
- No conflicts, conflict resolutions or history rewriting.
- Final main verification/publication results will be recorded below.

## Scope

The incoming map branch changes:

- apps/web/src/components/store-network-map.tsx
- apps/web/src/components/home-store-network.tsx
- apps/web/src/components/home-store-network.module.css
- apps/web/src/lib/store-locations.ts

Corrections additionally touch apps/web/src/lib/translations.json for three map-specific RU/TJ/EN strings. Evidence is stored beside this report.

The canonical eight coordinates and full addresses are preserved. Popups/directory use existing branch name, address, city and OpenStreetMap coordinates. No hours, telephone numbers or services were invented.

Header, hover cards, Saved control, Cart/Language divider, burger preferences, commerce logic, backend, routing configuration and database are unchanged. The PostgreSQL volume was retained. No orders were created or stock changed by this acceptance run.

## Corrected issues

1. Overlapping labels now choose a free position around their geographic pin, avoiding other pins, labels and controls. Crowded labels collapse until hover, keyboard focus or selection. Geographic pin locations stay unchanged.
2. Leaflet alone owns the marker positioning transform; the root marker no longer has a competing CSS transition.
3. Reselecting the same directory entry reopens its closed popup.
4. Language changes reapply the selected marker and popup after Leaflet recreation.
5. Panning finishes before opening a popup. Leaflet auto-pan padding avoids zoom controls, and the decorative count badge hides while a popup is open.
6. Keyboard label focus handlers attach after the initial view creates Leaflet marker elements.
7. Added missing translations for the map introduction, Supermarket and Open on map.
8. Initial format:check failed for home-store-network.tsx on the incoming branch; scoped Prettier formatting fixed it.

## Frontend checks

All commands actually passed on the corrected feature branch:

| Command | Result |
| --- | --- |
| npm run lint | PASS, zero ESLint warnings |
| npm run format:check | PASS |
| npm run typecheck | PASS |
| npm run build | PASS, 22 static pages |
| npm run test:catalog | PASS, 13 tests, zero failures/skips |
| npm run test:shopping | PASS, 6 tests, zero failures/skips |
| npm run | Inspected; no additional test scripts |
| git diff --check | PASS |
| git grep for line-start conflict markers | No matches |

The Node test runner retains its existing MODULE_TYPELESS_PACKAGE_JSON warning. Tests pass; package module semantics were not changed for this map task.

## Real browser acceptance

Executed against the production Docker frontend in Chromium 154.0.8037.98 using Playwright. This is automated browser acceptance, not manual hardware testing.

Evidence: [browser-results.json](store-map-integration/browser-results.json) and [screenshots](store-map-integration/screenshots/).

### Inputs and synchronization

PASS: mouse drag; wheel zoom (13 to 14); zoom buttons; double-click zoom; focused keyboard arrow/+; ordinary page scrolling outside the map; directory-to-marker synchronization; marker-to-directory synchronization for a previously unselected branch; popup reopening; focus/hover reveal; selection after resize/language change; normal animated and reduced-motion panning.

The first keyboard harness used literal '+' rather than the physical Shift+Equal combination Leaflet recognizes through keyCode. The corrected test passes. An initial responsive assertion treated the vertical scrollbar's negative width difference as overflow; corrected measurement compares scrollWidth with clientWidth. An initial regression locator assumed empty Saved/Cart pages had h1; their actual empty states use h2. Corrected assertions pass. These harness issues were not application regressions.

### Markers and popups

Markers show Paykar identity, branch name and short address, rather than anonymous numbers. Initial visible labels have zero pairwise overlap. Desktop shows 6–7 labels; narrow mobile shows two and reveals crowded labels on interaction. All eight full directory entries remain available.

Tested these popups at every width/theme:

- Пайкар 1 — ул. Айни 16б
- Пайкар 5 — пр. Рудаки 66
- Пайкар 8 — ул. С. Носира 25

Each shows supermarket/city metadata and an OpenStreetMap action with correct coordinates, target=_blank and rel=noopener noreferrer. Popups stay within the map, avoid zoom controls, and their close button cannot be covered by the decorative badge.

### Themes and responsive matrix

PASS: dark and light at 320, 390, 768, 1024 and 1440px. Ten cases: no horizontal page overflow, no overlapping visible labels, loaded tiles, readable markers/directory/controls, and all three tested popups contained and usable.

Loaded screenshots were reviewed. Dark tiles retain street labels with the branch's moderate brightness/saturation/contrast filter. Popup, labels and controls follow the application theme.

### Touch evidence and limitation

Chromium CDP synthetic touch input at 390px passed:

- One-finger drag moved the map approximately 40px horizontally, with zero page scroll.
- Two-finger pinch changed tile zoom from 12 to 14.

Map options enable scrollWheelZoom, touchZoom, dragging, doubleClickZoom, keyboard and zoomControl. No global scroll blocking was introduced.

**touchpad hardware verification pending**

Automation cannot verify the user's physical laptop touchpad, OS event mapping or a physical touchscreen. Synthetic input does not replace that check.

### Storefront regression smoke

PASS: homepage, catalog, Saved/Cart empty states, My Shopping, product detail (/product/raisin-bun), actual RU/TJ/EN header controls, actual light-theme switch and persisted preferences after reload. Tajik sets html lang=tg. The phone journey renders four steps and advances to Delivered. No browser page exceptions were recorded.

This is a rendering/presentation smoke, not a fresh full checkout/ORS acceptance run.

## Docker runtime

Used the existing ignored environment file without printing secrets:

~~~powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env config --quiet
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up --build -d
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env ps
~~~

PASS: configuration validity, image builds, healthy postgres/api/web.
GET /api/v1/health returns status=ok; GET /api/v1/health/db returns database=connected.

## Final main verification

Pending the requested feature push, ordinary main merge, final checks and main push. This section will be updated with actual results before publication.

## Remaining issues

Physical laptop touchpad verification remains pending. No remaining known application failures from map acceptance. The existing non-failing Node module warning remains outside scope.
