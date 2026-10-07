# Paykar premium motion and order-phone showcase

Verified: 2026-10-06. **PAYKAR MOTION LAYER — ACCEPTED**.

Implementation and rendered acceptance cover the current Diyor storefront. This is a presentation layer; checkout, routing, payments, order creation, backend, database, and catalog business rules were not changed. No commit or push was performed.

## Implementation

- Existing `LazyMotion` / `MotionConfig` / `m` infrastructure retained; no dependency or lockfile changes.
- Hero, bento, categories, editorial/service blocks receive restrained green surface reactions. The illumination uses `#00a82d`: dark edge/ambient alpha 18%/10%, light 12%/6%. Product cards use weaker shadows, a 2px lift, and image scale 1.015. Selected larger surfaces lift 3px. Micro interactions remain around 180–220ms; surface transitions 220–260ms. Quantity press scales to .97 without duplicating the count animation.
- Local pointer lighting on the hero and phone stage updates CSS custom properties through requestAnimationFrame. No global pointer listener or pointer-driven React state. Pointer exit/cancel clears tracking.
- New homepage section follows early product discovery and precedes curated connections. The phone is HTML/CSS/React: inset screen, dark metal rim, speaker/camera, restrained reflection, and soft shadow. Perspective 1000px; spring stiffness 130, damping 22, mass .8. Pointer targets are clamped to ±5° X / ±7° Y, depth 12px, scale 1.01; they return to rest on exit.
- Phone entrance runs once over .62 seconds (opacity, 30px rise, 6° Y rotation, .96 scale). The order timeline now plays once after the phone enters view: accepted → preparing → courier on the way → delivered. Each step updates the status card and progress markers; it holds on delivery and does not loop.
- Product/category discovery renders immediately; product-card scroll reveals and staggering were removed. Existing card actions and quantity behavior are retained.
- The screen is explicitly a demo: `DEMO-001`, black tea 15.00, oat cookies 12.00, flower honey 32.00; subtotal 59.00, example delivery 20.00, total 79.00 TJS. These are snapshots from `db/seed/products.json`, not live cart prices or a live delivery quote. Existing thumbnails, translations, icons, and money formatter are reused. The showcase does not read customer/order records, call an API, submit an order, or mutate the cart.
- Added RU/TJ/EN showcase copy. All demo text switches with the existing preference system.
- Reduced motion renders reveals fully visible with no transforms, disables pointer lighting and phone tilt, and removes selected surface transitions. Coarse/touch pointers receive a static phone and no pointer-following effects; no orientation/gyro access.
- With reduced motion enabled the timeline shows a stable final delivered state; the automatic stage sequence is skipped. See the order-journey follow-up below for current verification.
- Decorative phone subtree is `aria-hidden` with no focusable controls. Visible adjacent copy explains guest shopping, delivery before confirmation, and payment on receipt. The catalog CTA remains keyboard accessible with its focus outline.

## Commands actually executed

From `apps/web`:

```powershell
npx prettier --write src/components/motion-primitives.tsx src/components/home-hero.tsx src/components/product-card.tsx src/components/home.tsx src/components/order-showcase.tsx src/styles/premium-motion.css src/app/globals.css src/lib/translations.json
npm run lint
npm run format:check
npm run typecheck
npm run build
```

All passed. ESLint ran with zero warnings permitted. Next.js 16.3.8 production build generated 20 pages; TypeScript errors were not suppressed.

From repository root:

```powershell
docker compose up --build -d web
docker compose ps
git diff --check
```

All passed. PostgreSQL, API, and web reported healthy at final inspection. Browser acceptance ran against the rebuilt production web service at `http://localhost:3000`.

Existing Graphify graph was queried for navigation; relevant source was inspected directly because the graph predates these changes. No graph regeneration or architecture change was needed.

## Browser acceptance

The in-app Codex Browser connection was unavailable (`No browser available`, browser list empty). **No in-app Browser verification is claimed.** Standalone Playwright successfully drove actual Chrome **154.0.8037.98** against the production Docker build. Automated Chrome acceptance below is PASS.

Machine-readable observations: [browser-acceptance.json](premium-motion/browser-acceptance.json).

| Check                                                                         | Result                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Normal motion: widths 320, 390, 768, 1024, 1440, 1920 × RU/TJ/EN × light/dark | PASS, 36 combinations                                                      |
| Reduced motion: same width/language/theme matrix                              | PASS, 36 combinations                                                      |
| Touch/coarse pointer at 320, 390, 768, 1024                                   | PASS, no tilt, tracked glow, clipped phone content, or horizontal overflow |
| Phone readability / section containment / screen text                         | PASS                                                                       |
| Desktop spring tilt, bounds, and return to rest                               | PASS                                                                       |
| Hero pointer light follows local coordinates                                  | PASS                                                                       |
| Settled hero/category/product hover measurements                              | PASS, lifts 3/3/2px and image scale 1.015                                  |
| First phone entrance and later section revisit                                | PASS, settles visible, entrance runs once                                  |
| Reduced motion fully visible static entrance/phone                            | PASS, computed transforms none, light layer hidden                         |
| Decorative subtree and catalog CTA keyboard focus                             | PASS, no focusables inside hidden phone; visible 2px outline on CTA        |
| Theme switching / reload persistence                                          | PASS                                                                       |
| Keyboard language selection / persistence / html lang=tg                      | PASS                                                                       |
| Add to cart / increase / decrease / reload                                    | PASS                                                                       |
| Search suggestions / keyboard selection                                       | PASS                                                                       |
| Catalog sort with retained in_stock URL parameter                             | PASS                                                                       |
| Mobile menu / Escape                                                          | PASS                                                                       |
| Captured browser console/page/hydration errors                                | None                                                                       |

Shopping smoke checks ran in a temporary isolated browser context, closed afterward. The existing browser cart was not modified. The main test tab was restored to the homepage, RU/light, normal motion, 1440px.

## Performance observations

During 80 phone pointer moves:

- No network requests, structural/text DOM mutations, recorded layout shifts, or long tasks.
- Phone section dimensions stayed unchanged.
- React host props identity stayed unchanged, corroborating the source's absence of pointer-driven state updates. This is a lightweight runtime probe, not a full React DevTools profiling session.
- 99 animation-frame intervals: mean 6.43ms, p95 6.5ms, max 18.3ms on this local display. This supports smooth local interaction; it is not a performance guarantee for every device.
- No large assets, added font requests, global cursor tracking, or mass `will-change` declarations.

## Screenshots

[Screenshots folder](premium-motion/screenshots/) contains desktop RU/TJ/EN in both themes, mobile captures, and the hovered bento. Representative inspected captures:

- [Desktop EN dark](premium-motion/screenshots/premium-motion-1440-en-dark.png)
- [Desktop RU light](premium-motion/screenshots/premium-motion-1440-ru-light.png)
- [Touch TJ light, 320px](premium-motion/screenshots/premium-motion-touch-320-tj-light.png)
- [Touch TJ light, 390px](premium-motion/screenshots/premium-motion-touch-390-tj-light.png)
- [Bento hover, RU dark](premium-motion/screenshots/premium-motion-bento-hover-1440-ru-dark.png)

The `touch-*` captures center the complete phone between the existing sticky header and mobile tabbar. Earlier whole-section mobile locator screenshots include fixed UI overlays while stitching an element taller than the viewport; use the touch viewport captures for mobile navigation/readability evidence.

## Corrected verification probes and limits

Initial browser harness probes needed three corrections: asynchronous spring/transition values require numeric tolerances or waiting for exact completion; progress connector pseudo-elements intentionally extend into the next cell and must not be treated as overflowing text; a product locator filtered by an add button stops matching after that button changes into quantity controls. Final reruns passed after correcting the probes. These were test-harness failures, not unresolved application failures. A preliminary source search also used an absent header filename; the actual shell/preferences components were inspected.

The original motion layer had no remaining blocker. In-app Browser connection remains unavailable; actual Chrome acceptance for that layer was completed using Playwright. Full checkout/order persistence, live ORS, and payment regression were not rerun for this presentation-only work and are not claimed here. Backend tests were not run because no backend files changed.

### Order timeline follow-up — 2026-10-07

The four-stage sequence now has stage-specific icons/subtitles, smoothly filling connectors, and a stable delivered state for reduced motion, including preference changes during playback. Frontend lint, formatting, typecheck, production build, and standalone Chrome acceptance passed. Current timing, viewport/language/theme checks, timer cleanup, and screenshots are documented in [order-journey-animation.md](order-journey-animation.md). The original Playwright matrix above predates this sequence; use the new report as evidence for the timeline. The in-app Codex Browser remains unavailable.

## Files changed for this task

- `apps/web/src/components/motion-primitives.tsx`
- `apps/web/src/components/home-hero.tsx`
- `apps/web/src/components/home.tsx`
- `apps/web/src/components/product-card.tsx`
- `apps/web/src/components/order-showcase.tsx` (new)
- `apps/web/src/styles/premium-motion.css` (new)
- `apps/web/src/lib/translations.json`
- `apps/web/src/app/globals.css`
- This report, `premium-motion/browser-acceptance.json`, and screenshots.

Pre-existing favicon changes in `apps/web/src/app/layout.tsx` and `apps/web/public/icon.png` were preserved and are separate from this motion task. No backend, database, dependency manifest, or lockfile changes.
