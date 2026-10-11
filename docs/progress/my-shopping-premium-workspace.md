# My Shopping premium workspace

Date: 2026-10-10. Scope: `/my-shopping` overview only. No commit or push.

## Implementation

The overview now uses a centered 1120px workspace. Recent orders carry the strongest heading and a large centered active card with subdued neighboring previews. Personal templates retain large overlapping product photographs in a horizontal carousel. Charcoal-to-green surfaces, restrained borders, and the existing low-opacity Paykar symbol connect these cards to the homepage without introducing another graphics scene.

Composition: introduction → recent orders when present → personal templates when present → contextual starter when needed → secondary curated carousel. Fresh visitors receive one compact create-template action and real curated sets instead of two large empty panels. Existing one/two-card collection guides remain purposeful; unnecessary personal carousel controls stay hidden.

### Files changed in this task

- `apps/web/src/components/my-shopping.tsx`: overview ordering, compact fresh state, scoped carousel hooks, opt-in curated carousel.
- `apps/web/src/components/my-shopping.module.css`: incremental overview-scoped geometry, imagery, gradients, watermark, typography, responsive rules, and restrained hover depth.
- `apps/web/src/components/shopping-carousel.tsx`: optional presentation `className`; controller, navigation, snapping, and pagination unchanged.
- `apps/web/src/components/shopping-workspace-cards.tsx`: opt-in overlapping curated images and full-name title on personal templates; existing actions unchanged.
- This report.

Unrelated pending homepage/hero changes were preserved. The header/footer, editor/detail layout, checkout, maps, phone animation, APIs, backend, database, translations, and storage schemas were not edited in this task. No new assets or dependencies.

## Preserved behavior and functional evidence

Browser QA used `http://localhost:3000/my-shopping`, served by the actual rebuilt Docker web service. The in-app Browser reported `No browser is available`; QA therefore used Playwright Chromium, not the disconnected Browser plugin.

Real API checks used existing persisted orders, including `2f9c7fcb-0745-4bf2-88b7-4a2c2333d7b3` (historical total 82.00). No new orders were created. Personal-template fixtures were derived from actual curated API products and seeded only into disposable browser contexts; the user's browser data was not changed.

Passed:

- Repeat fetched current prices/availability and added real products to cart.
- Save order created a personal template; navigation/reload preserved it.
- Template add-all refreshed the real preview; edit/save persisted the changed name.
- Existing order view and confirmation reload retained the historical 82.00 total.
- Curated save retained its immediate-save behavior with no naming prompt.
- Order and template ArrowLeft/ArrowRight navigation worked; resize retained the active order.
- Template menu Escape closed the menu and restored focus.
- Chromium touch emulation successfully swiped the template carousel at 390px.
- Actual stock checks used product 1 (one unit available), product 9 (out of stock), and nonexistent product 999999: the cart received only one unit of product 1. Relevant missing/unavailable/quantity-adjustment messages remained visible, with a missing-image fallback and no overflow.
- Intercepted 503 responses for order, preview, and curated requests displayed retryable errors; removing interception and retrying recovered real API data. Delayed order loading remained visible.
- An intercepted failed repeat request left the existing cart unchanged and displayed its status error. These failures were simulated, not real-provider outages.
- Normal desktop hover moved a card by only 2px; reduced motion disabled that lift. Existing reduced-motion carousel behavior remained intact.

An initial QA harness incorrectly waited for an alert role after failed add; the existing component announces that error through its status region. The selector was corrected and the check passed without an application change.

## Responsive and localization acceptance

The populated overview passed all 24 combinations: 390/768/1024/1440px × RU/TJ/EN × dark/light. Checks covered active-card centering, product image loading, long template names, action containment, document overflow, document language, and browser errors/warnings. No horizontal document overflow, clipped active actions, broken loaded images, or application console warnings/errors were found in that matrix.

| Width | Active multi-order card width | Personal template width | Result |
| --- | --- | --- | --- |
| 1440 | about 488px including active scale | 340px | Centered dominant order, dim neighboring cards; large template rail |
| 1024 | 420px | 340px | Neighbor previews remain; actions fit |
| 768 | 380px | 340px | Responsive summary wrapping; large horizontal cards |
| 390 | 310px | 302px | Stacked order actions, swipeable rails, narrow neighbor hints |

Twenty additional RU/dark state checks passed: no orders/no templates, orders only, templates only, one order/one template, and multiple orders/templates at each of the four widths. Missing personal sections stayed hidden, useful create access and five real curated sets remained, sparse cards were centered, and single-card collections had no useless arrows/dots. Sparse single-order widths differ intentionally from the multi-order carousel.

All language/theme cases were captured; representative dark/light and long Tajik compositions plus fresh/sparse screenshots were visually inspected. Active mobile order actions are at least 44px high, primary buttons 48px. Scaled, dim neighboring previews are secondary to the active card; physical-device gesture ergonomics remain unverified.

## Visual comparison and mismatch ledger

| Before | After / remaining difference |
| --- | --- |
| Wide overview with small personal-template imagery | Narrower workspace; 340px personal cards and substantially larger overlapping real-image tiles |
| Personal templates competed with a dense curated grid | Curated content is a secondary carousel; orders remain the primary visual event |
| Two large fresh-state starters | One useful compact create starter with real curated shopping content below |
| Tiny template typography and weak hierarchy | Larger template names and live totals, muted metadata, clear dominant add/repeat actions |
| Active order composition was less prominent | Large centered active order with controlled radius, tonal depth, and restrained neighboring previews |
| Long names / availability messages varied in length | Names wrap to two lines with full accessible link text/title; stock/error content can increase card height rather than clip actions |
| Mobile has very little space for neighbors | Neighbor hints are intentionally narrow at 390px; preserving readable active content takes priority |

Only actual catalog imagery is used. Existing demo products sometimes share an image (for example bakery items); no invented product imagery was introduced. This remains a catalog-content limitation, not a rendering failure. Further cosmetic changes beyond these refinements would be subjective.

Local browser evidence (outside committed source):

- Before: `C:/Users/ahmad/AppData/Local/Temp/paykar-workspace-before-populated-1440.png` and `paykar-workspace-before-empty-1440.png`.
- After anchors: `paykar-workspace-final-history-1440-ru-dark.png`, `paykar-workspace-final-templates-1440-ru-dark.png`, `paykar-workspace-final-history-390-tj-light.png`, and `paykar-workspace-final-templates-390-en-dark.png` in the same directory.
- Matrix screenshots: `paykar-workspace-final-{history|templates}-{width}-{ru|tj|en}-{dark|light}.png`.
- State screenshots: `paykar-workspace-state-{empty|orders|templates|one-each|many}-{width}.png`.
- Structured browser results: `C:/Users/ahmad/AppData/Local/Temp/paykar-my-shopping-premium-validation.json`.

## Commands and runtime

Run frontend commands from `D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/apps/web`.

| Command | Actual result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; 22 generated pages. Final CSS also compiled in the subsequent production Docker build |
| `npm run test:shopping` | PASS: 6 tests, zero skipped |
| `npm run test:catalog` | PASS: 14 tests, zero skipped |
| `npm run test:navigation` | PASS: 4 tests, zero skipped |
| `npm run test:recommendations` | PASS: 3 tests, zero skipped |
| `npm run test:hero` | PASS: 6 tests, zero skipped |
| `npm run format:check` | FAIL: pre-existing unrelated `src/components/not-found-view.module.css`; preserved |
| `npx prettier --check src/components/my-shopping.tsx src/components/my-shopping.module.css src/components/shopping-carousel.tsx src/components/shopping-workspace-cards.tsx` | PASS |
| `git diff --check` | PASS |

Node's existing MODULE_TYPELESS_PACKAGE_JSON warning appears in pure test runs; all 33 tests passed without skips.

Actual Docker rebuild/recreation used:

```powershell
docker compose --project-directory 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main' -f 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/docker-compose.yml' -p test_task_paykar_shop --env-file 'D:/Workshop/Paykar/Test_Task_Paykar_Shop/.env' up -d --build --force-recreate --no-deps web
```

PASS. `test_task_paykar_shop-web-1` is healthy, serving localhost:3000, image `sha256:b2a7d03fb44aafb5eea194243f07f1f9b284817641a1ff0cdf4182f34e2e2bce`. Browser acceptance above checked that exact runtime, not a temporary preview.

Protected-file hashes confirmed unchanged homepage components/styles, shell, shopping actions, shopping data helpers, and shopping storage from the start of this task. A homepage runtime smoke also found no document overflow or overview-style leakage.

Remaining limits: full-repository formatting needs its unrelated existing correction; physical mobile hardware and Firefox/Safari were not tested. Browser acceptance is Playwright Chromium evidence, not manual Chrome sign-off or in-app Browser verification.
