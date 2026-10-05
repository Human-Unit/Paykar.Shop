# Pre-presentation motion and glass pass

Date: 2026-10-05. Workspace: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

Implementation and automated/source/runtime checks are complete. **VISUAL / MOTION ACCEPTANCE — PENDING**: Codex Browser reported `No browser is available`; discovery returned no connected browsers. No browser screenshots, animation playback, hydration-console inspection, or manual visual acceptance were performed for this pass.

## DEPENDENCY

Framer Motion version: **14.0.0**, declared as `^14.0.0`, locked to 14.0.0. Installed with `npm install framer-motion` inside `apps/web`.

Only `framer-motion` was added directly. Its added transitive packages are `motion-dom@14.0.0` and `motion-utils@14.0.0`; its existing `tslib` dependency was reused. Existing dependency/devDependency versions remain unchanged. No packages are removed in the final lockfile. npm also updated peer metadata on existing entries without changing their versions.

Windows npm initially pruned four optional `@emnapi` lock records. Linux Docker `npm ci` exposed the missing entries. Those exact existing platform records were preserved, and Linux `npm ci` and the production Docker build subsequently passed. No animation CDN, new environment variables, secrets, or runtime font provider was introduced.

`npm audit` reports the same **five existing high-severity findings** before and after this change: `@next/eslint-plugin-next`, `braces`, `eslint-config-next`, `fast-glob`, and `micromatch`. The baseline lockfile was audited separately in an ignored directory. None of these findings belongs to the added Motion packages. No forced dependency upgrade was performed.

## MOTION ARCHITECTURE

Shared primitives: `motion-primitives.tsx` exports a stable `MotionProvider`, `useReveal`, `MotionLink`, `MotionImage`, and the lightweight `m` elements. The provider uses `LazyMotion`, `domAnimation`, and `MotionConfig reducedMotion="user"`; strict mode guards against accidentally adding the full motion components.

The provider replaces Shell's fragment and produces no layout wrapper. It is not keyed by route, theme, or language. Cart/checkout providers retain their placement and identity. There is no routing animation, exit delay, layout animation, or state remount strategy.

`useReveal` applies directly to existing semantic elements. Default entrance: 380ms, 12px vertical rise, opacity fade, ease `[0.22, 1, 0.36, 1]`. Viewport reveals use `once: true, amount: 0.15`. Hover lift is 2px with a 180ms target transition. No width/height/top/left/filter animation, continuous motion, or extra sizing/overflow wrapper was introduced.

Implementation references: [Motion LazyMotion documentation](https://motion.dev/docs/react-lazy-motion) and [reduced-motion documentation](https://motion.dev/docs/react-use-reduced-motion). Installed package types and actual React server rendering were also checked.

## HOMEPAGE HERO

Eyebrow: 10px/0ms; headline: 16px/60ms; description: 12px/120ms; CTA: 10px/180ms. These use one entrance per component mount and retain whole text elements and existing line breaks. Language/theme changes do not key or remount them.

Photography: one 500ms **opacity-only** entrance. The optional scale was omitted to preserve the previously fixed image fit and crop. The same asset, dimensions, object-fit, mask, breakpoints, and composition remain in place. Non-hero shopping banners retain their existing static behavior.

Side cards: 10px fades with 100/170ms delays, 2px hover lift, restrained border/shadow refinement. CTA arrows have a 3px hover movement only on hover-capable devices without reduced motion.

Section reveals: benefits, category grid, section headings, product cards, shopping steps, delivery CTA, and editorial grid. Homepage product delays use 50ms increments capped at 250ms. Product-card availability, prices, cart controls, and callbacks remain unchanged.

## PUBLIC / TASK PAGES AND MAPS

Shared PageIntro fades without translation; SectionHeader, StepFlow and CTASection use restrained one-time viewport reveals across public pages. The custom delivery page has a fading introduction and reveals on headings, steps and its main CTA. Existing direct-child spacing selectors still match: no new layout wrappers were added.

Cart/checkout introductions inherit only PageIntro's fade; no checkout form, quote, cart, payment session, or order-creation logic was edited. Product-detail shared headings/cards inherit the shared presentation layer. Order confirmation has a single 0.94-to-1 success icon entrance, a 12px heading entrance, and an opacity-only details reveal; no confetti or looping effect.

Store network: the map shell uses opacity only. No y/scale/transform target is applied to the map shell or its ancestors. The directory rises 10px; it is a sibling of the map. Leaflet internals, resize/invalidateSize handling, marker/popups, and list-selection handlers are untouched. The map shell now isolates its existing badge layer locally.

## GLASS

- Header: remains non-sticky; 82% dark / 96% light header surface with static 16px blur and 125% saturation where supported.
- Search: 96% elevated surface, static 8px blur, existing green focus ring and keyboard semantics.
- Suggestions, information dropdowns and catalog panel: 92% dark / 96% light surface, static 18px blur / 120% saturation, existing borders and restrained shadows. Information/search openings add a 180ms opacity animation; catalog keeps its existing opening behavior.
- Burger drawer: elevated translucent surface, static blur, opacity opening; native dialog, backdrop, focus restoration and close handling are unchanged.
- Promo cards: 92% dark / 96% light surface, static 14px blur and green border. Normal information panels were not converted to glass.
- Store badge: opaque fallback; enhanced 92% dark / 96% light surface, 14px blur / 120% saturation, existing green border. Directory remains mostly solid.
- Fallback: unprefixed or WebKit `backdrop-filter` support is detected with `@supports`. Outside that block, surfaces stay opaque.
- Light theme: separate opacity tokens and the existing light surface/text palette. Secondary copy and header accent colors are slightly strengthened to compensate for transparency.

Header stacking is explicitly contained at 1100 above page/maps. Existing search 1100 and navigation 1000 layers retain their relative ordering inside that context. Catalog/info overlays retain their anchors and controlled exclusion behavior. Native dialog remains in the browser top layer. Map badge 650 remains inside its isolated map shell. This is source verification; rendered overlay behavior is still pending.

A calculated source-token contrast model used an upper bound combining the existing ambient glows and watermark peaks. It is not sampled browser pixels:

| Copy                 | Dark before / after | Light before / after |
| -------------------- | ------------------- | -------------------- |
| Secondary navigation | 10.99 / 13.26       | 8.75 / 12.42         |
| Active navigation    | 6.22 / 6.31         | 5.84 / 5.99          |
| Search placeholder   | 6.54 / 8.07         | 5.48 / 6.55          |
| Promo description    | 7.49 / 9.98         | 5.48 / 8.08          |

Promo-title contrast remains above 16.9:1 in that model. Hero copy/background were not changed. Actual rendered contrast, especially overlapping translucent panels, remains part of pending visual acceptance.

## REDUCED MOTION

`useReducedMotion` sets zero-duration/no-delay targets and disables hover translation. `MotionConfig` also uses the user preference. Global `prefers-reduced-motion: reduce` rules make reveals immediately opaque with `transform: none !important`, including before hydration and when the preference changes. Overlay opening animations and catalog transitions are disabled. Arrow motion only exists inside the no-preference media query.

The map's existing reduced-motion-aware directory scrolling remains unchanged. No decorative drift or parallax exists.

## SSR / HYDRATION

New motion code is client-side, but server and initial client styles remain identical for normal, unknown and reduced-motion preferences. There are no new server-render branches based on window/document/matchMedia. No initial display/height changes are used.

The existing early preference script, document language mapping (`ru`, `tg`, `en`), translation dictionary, self-hosted Noto Sans, and font preload are unchanged. A `<noscript>` style keeps reveal content visible when JavaScript is disabled. Focus-within makes reveals immediately visible so keyboard focus cannot remain concealed.

Actual React/Motion server rendering passed for RU/TJ/EN under dark/light fixture attributes using the existing translation dictionary and a presentation stub. Hero image dimensions stayed 1536x1024, localized headlines were present, and the map-shell fixture emitted no transform. These checks do not establish browser hydration or visual correctness. Controlled early-preference-script checks passed all six saved language/theme combinations.

## FILES CHANGED

- `apps/web/package.json`, `apps/web/package-lock.json`
- `apps/web/src/components/motion-primitives.tsx` (new)
- `apps/web/src/components/shell.tsx`
- `apps/web/src/components/shopping-banner.tsx`
- `apps/web/src/components/home.tsx`
- `apps/web/src/components/page-patterns.tsx`
- `apps/web/src/components/product-card.tsx`
- `apps/web/src/components/order-confirmation.tsx`
- `apps/web/src/components/delivery-page.tsx`
- `apps/web/src/components/home-store-network.tsx`
- `apps/web/src/components/home-store-network.module.css`
- `apps/web/src/app/site-polish.css`
- `apps/web/src/app/layout.tsx` (no-JavaScript reveal fallback only)
- `docs/progress/pre-presentation-motion-glass-pass.md` (this report)

Source/hash/AST comparison confirms backend/database/ORS files, cart/presentation state, checkout/search/navigation/mega-menu handlers, translations, and font assets are unchanged. In modified presentation files, prior API calls, state/effects, JSX handlers, localized strings, and money conversions match the starting source. All preceding site-polish CSS rules are preserved.

## VERIFICATION

Commands executed in `apps/web` unless otherwise indicated:

| Check                                                    | Result                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `npm install framer-motion`                              | PASS; only specified direct dependency added                            |
| `npm ls framer-motion motion-dom motion-utils --depth=1` | PASS; 14.0.0 versions                                                   |
| `npm run lint`                                           | PASS; no warnings                                                       |
| `npm run typecheck`                                      | PASS; route generation and TypeScript                                   |
| `npm run build`                                          | PASS; 21 static pages generated                                         |
| `npm run format:check`                                   | PASS                                                                    |
| Root `docker compose config --quiet`                     | PASS                                                                    |
| Root `docker compose up --build --no-deps -d --wait web` | PASS after lockfile repair; Linux npm ci, production build, healthy web |
| Root `docker compose ps`                                 | PASS; web, existing API and PostgreSQL healthy                          |
| Root `git diff --check`                                  | PASS; no whitespace errors                                              |
| Source/AST/hash preservation audit                       | PASS                                                                    |
| Actual shared-component React/Motion SSR fixtures        | PASS with the explicit scope above                                      |
| Controlled reduced-motion/CSS/preference checks          | PASS; browser execution not asserted                                    |
| Existing mega-menu handler regression harness            | PASS, 13 checks using controlled hooks/timer/focus doubles              |
| Production HTTP smoke                                    | PASS, 15 routes returned 200                                            |
| Deployed assets/security comparison                      | PASS; all 37 static files scanned, no configured ORS key matches        |
| Existing API health and DB health                        | HTTP 200; read-only checks                                              |
| Browser rendered acceptance                              | PENDING; no connected browser                                           |

HTTP routes: `/`, `/payment`, `/delivery`, `/catalog`, `/product/oranges`, `/cart`, `/checkout`, `/stores`, `/how-to-buy`, `/returns`, `/promotions`, `/blog`, `/brands`, `/about`, `/contacts`.

Production HTML contains existing search combobox/dialog semantics, the local font preload and no-JavaScript fallback. All 37 deployed static assets (1,269,926 bytes) were compared against the configured ORS key without printing the key; zero matches. HTML for the 15 routes also had no key matches or external script tags. This is asset/HTTP evidence, not browser network capture.

The deployed Noto Sans (545,544 bytes), hero (105,540 bytes), and logo (133,477 bytes) match local source byte-for-byte. Font SHA-256 remains `38380deb88a61eeac95620609b56a8919512a0055ffb1d49d4f64b417692414c`.

Ignored, local audit scripts/results are under `.cache/motion-glass/`; the existing controlled mega-menu harness was also run. These are not browser automation.

Resolved failures encountered:

1. Typecheck initially rejected the union of ordinary Next Link/Image and broad MotionProps. The shared helper now returns only the motion fields it actually supplies. No compiler suppression or `any` was added.
2. The first format check found a generated audit JSON accidentally placed inside the frontend directory. It was moved into the root ignored cache; the subsequent full format check passed.
3. Docker was initially stopped. Docker Desktop was started and the daemon became available.
4. The first Linux Docker build failed on Windows-pruned optional `@emnapi` lock entries. The previous platform entries were preserved; the repeated clean installation/build passed.

## VISUAL / MOTION ACCEPTANCE — PENDING

No connected Codex Browser was available. No automated or manual rendered acceptance is claimed. Existing earlier manual acceptance does not verify these new effects.

Pending browser matrix: 360, 390, 768, 1024, 1280, 1440, 1920px; RU/TJ/EN; dark/light; normal/reduced motion. Highest priority homepage widths: 390, 768, 1440 and 1920.

Inspect `/`, `/payment`, `/delivery`, `/catalog`, `/product/oranges`, `/cart`, `/checkout`, `/stores` for entrance timing, no replay on preference changes, reduced motion, actual glass contrast, search suggestions/keyboard controls, catalog/info exclusion, native drawer focus/backdrop, map/popups/badge layering, hero image fit, side-card wrapping, horizontal overflow, startup flashes and hydration warnings. Confirmation success animation and persisted commerce behavior also need a rendered regression check when browser access returns.

## REMAINING RISKS

The missing browser is the remaining presentation acceptance blocker. Source and SSR checks cannot prove rendered font baselines, responsive wrapping, animation smoothness, overlays, hydration-console cleanliness, Leaflet popup placement, or real cart/checkout interactions. The existing five npm audit findings remain unchanged.

No commit or push was performed. No backend, ORS, database, cart/checkout state, or payment behavior was changed.
