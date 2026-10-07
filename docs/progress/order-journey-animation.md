# Order journey inside the phone mockup

Verified locally: 2026-10-07. **ORDER JOURNEY — ACCEPTED**.

This is a decorative presentation animation in the existing homepage phone. No backend, checkout, cart, orders, routing, payment, database, dependency manifest, or lockfile changes. No commit or push was performed.

## Implementation

- Explicit accepted → preparing → courier → delivered stages keep the existing `t(...)` localization and demo products/totals/CTA.
- An IntersectionObserver starts the sequence once when 35% of the phone stage becomes visible. Chained 1400ms timeouts advance three times and stop at delivered. Scrolling away and back does not replay the mounted demo.
- Each stage has its own icon, title, subtitle and progress label. Icon opacity/scale and text opacity/4px rise take 240ms; connecting lines fill over 320ms. Completed/current/future markers remain distinct.
- Existing phone dimensions, frame, entrance, desktop spring tilt and local pointer light are retained. Touch pointers remain static.
- Reduced motion shows delivered without journey timers, stage transitions or tilt. A hydration-safe media-query subscription also handles enabling reduced motion during playback; disabling it afterward retains delivered.
- Effect cleanup disconnects the observer, clears the pending timeout and cancels the reduced-motion state-commit animation frame. The decorative phone stays aria-hidden, with no live regions or focusable descendants.

## Changed files

- `apps/web/src/components/order-showcase.tsx`: stage definitions, icon/text motion and reduced-motion behavior.
- `apps/web/src/styles/premium-motion.css`: filling connectors, marker states and four-label spacing.
- `apps/web/src/lib/translations.json`: RU-source subtitles with TJ/EN translations.
- `apps/web/src/components/saved-items-page.tsx` and `apps/web/src/context/saved-items.tsx`: formatting only, fixing existing format-check failures inherited from the integrated shopping-assistance work.
- This report, [browser observations](order-journey/browser-acceptance.json), [screenshots](order-journey/screenshots/), and the follow-up note in [premium-motion.md](premium-motion.md).

## Commands actually executed

From `apps/web`:

```powershell
npx prettier --write src/components/order-showcase.tsx src/styles/premium-motion.css src/lib/translations.json
npx prettier --write src/components/saved-items-page.tsx src/context/saved-items.tsx
npm run lint
npm run format:check
npm run typecheck
npm run build
```

Final results: **all PASS**. ESLint allows no warnings. The production Next.js build generated 21 pages. Formatting initially failed on the two existing saved-items files listed above; after formatting them, the full check passed. No TypeScript errors were suppressed.

From the repository root:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up --build -d --no-deps web
git diff --check
```

Both passed. Only the existing web service was rebuilt, using the existing ignored environment file; API and PostgreSQL were not recreated. Acceptance ran against the production service at `http://localhost:3000`.

## Browser acceptance

The in-app Codex Browser was unavailable (browser list empty). **No in-app Browser verification is claimed.** Standalone Playwright drove actual Chrome **154.0.8037.98** in temporary isolated contexts, closed after testing. The screenshots were also visually inspected for the desktop preparing/delivered states, 320px TJ/light and 390px EN/dark.

| Check | Result |
| --- | --- |
| Offscreen phone waits before playback | PASS; still accepted after 1600ms |
| Observed four-stage cadence | PASS; 0 / 1420 / 2822 / 4228ms |
| Current/completed markers and computed connector fill | PASS at every stage |
| Final state holds after waiting and scrolling away/back | PASS |
| Desktop 3D tilt/local light and pointer-exit cleanup | PASS |
| Four-stage playback at 390px in RU/TJ/EN, dark/light | PASS; stable phone height throughout |
| Touch layout at 320, 390, 768, 1024, 1440px × RU/TJ/EN × dark/light | PASS, 30 combinations; all four labels visible, no clipping or horizontal overflow |
| Reduced motion at the same widths/languages/themes | PASS, 30 combinations; delivered, static transforms, filled connectors |
| Reduced final state remains stable | PASS, six language/theme checks |
| Enabling reduced motion mid-sequence, then disabling | PASS; jumps to delivered and stays there |
| Navigate to catalog while a journey timeout is pending | PASS; active timers 1 → 0, cleared 0 → 1; no later firing after 1600ms |
| Reduced motion schedules no 1400ms timers | PASS |
| Decorative accessibility / console / page / hydration errors | PASS; no live regions/focusables inside phone, no captured errors |

Machine-readable results are in [browser-acceptance.json](order-journey/browser-acceptance.json). Four desktop stage screenshots, eight touch captures and two reduced-motion captures are saved in [screenshots](order-journey/screenshots/).

## Corrections and limits

Browser testing caught a connector CSS specificity error; the completed-state selector was corrected, the production build/web image rebuilt, and the final desktop/touch/reduced-motion suites passed. A preliminary timer-cleanup probe checked immediately after the URL changed, before React detached the phone; the corrected probe waits for detachment and verifies no later timeout fires.

A temporary local preview on port 3001 could not fetch catalog data because the existing API CORS configuration allows the normal port 3000. Testing moved to the rebuilt standard Docker origin; no CORS or backend change was made.

There are no remaining blockers for this presentation-only request. These checks do not claim a new end-to-end checkout, database persistence or real ORS regression run. The in-app Browser connection remains unavailable; Chrome acceptance was completed through standalone Playwright.

