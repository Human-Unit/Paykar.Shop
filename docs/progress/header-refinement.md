# Header controls and motion refinement

**HEADER REFINEMENT — ACCEPTED**

Verified on 2026-10-06 in the current `main` checkout at `D:\Workshop\Paykar\Test_Task_Paykar_Shop`. Existing uncommitted catalog, header preferences, animated search, and Graphify work was preserved. No commit or push was made.

## Implementation

- One compact theme button shows Sun for light and Moon for dark. Clicking toggles light/dark; no system/laptop control is exposed.
- Legacy `system` preferences resolve once from the OS preference and are saved as explicit light/dark under the existing `paykar-presentation-v1` key. Language is retained. If storage writes fail, controls remain usable in memory for the tab; persistence cannot be guaranteed while storage is blocked.
- The burger now sits after the cart in the desktop main header. The upper strip contains only location and is 28px tall instead of 44px.
- Mobile uses two rows: logo/language/theme/burger above search/cart. Controls remain at least 44px in both dimensions. Existing scroll-direction navigation behavior and mobile sticky search/cart are retained.
- Existing Framer Motion/LazyMotion supplies a 200ms theme icon transition, 180ms burger icon transition, and 160ms language-menu opacity/-4px/0.98-scale transition. Icon layers have a fixed footprint. The native modal drawer keeps its existing animation and focus containment. The previous full-page circular theme reveal was removed.
- Exiting language menus become inert and aria-hidden immediately. Reduced motion removes icon/menu transforms and durations and disables sticky navigation sliding.
- Theme action labels are translated through the existing RU/TJ/EN dictionary. Document language remains `ru`/`tg`/`en` and language preferences remain persistent.
- Browser QA found an existing 2px drawer clipping issue at 320px with a visible scrollbar. The mobile drawer now uses the available viewport percentage instead of `100vw`.

## Verification actually performed

Final-source commands run from `apps/web`:

| Command | Result |
| --- | --- |
| `npm run lint` | PASS, no warnings |
| `npm run format:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS, Next.js 16.3.8, 20 generated pages |

From the repository root, `docker compose up --build -d` passed after the final drawer fix, including a production frontend build. `docker compose ps` reported web, API, and PostgreSQL healthy. `git diff --check` passed. Framer Motion was already installed; no dependency or lockfile changes were required.

### Automated browser acceptance — PASS

Playwright exercised the actual Docker production site at `http://localhost:3000`, not a component mock.

- All 36 combinations of 320/390/768/1024/1440/1920px, RU/TJ/EN, and light/dark passed. Checked document overflow, control overlap, touch targets, dropdown viewport bounds, visible cart count, one theme button, no Monitor/Laptop icon, and burger placement. Repeated the complete matrix after rebuilding the final source.
- Six legacy migrations passed (three languages, OS light/dark). Changing OS theme afterward did not override the explicit mode. Both toggle directions survived reload. Simulated blocked storage preserved live control behavior and Tajik language.
- Language ArrowDown/ArrowUp/Home/End, selection, Escape focus return, Tab exit, outside click, rapid reopen, and TJ/EN reload persistence passed.
- Native drawer opening focus, modal focus containment, close button, Escape, backdrop dismissal, and navigation to `/delivery` passed. Its settled geometry fit at 320/390/1440px; the mobile drawer has no internal horizontal overflow.
- Observed real Framer Motion intermediate icon styles and language menu entry (`opacity: 0`, `translateY(-4px) scale(0.98)`). Verified exiting language menu inertness and removal. Reduced-motion icon/menu transforms and drawer/sticky transitions passed.
- Desktop header remained at y=0 on scroll; navigation hid on scroll down and returned on scroll up. Mobile search/cart stayed visible at scroll y=700.
- Animated search examples remained decorative: no idle query request, one animation layer, focus suspension, real product suggestions and keyboard selection for `молоко`, empty-input restart, and static reduced-motion behavior passed.
- No page errors or browser console errors were reported. An existing Noto Sans preload timing warning remains; it is unrelated to this header change.

### Visual inspection

Inspected captured 320px dark RU, 390px light TJ, 1440px light EN, and 390px drawer screenshots. Header layout, localized text, focus outlines, and overlay presentation were consistent with the existing Diyor styling. This is automated browser evidence plus screenshot inspection; no separate user manual acceptance is claimed.

Detailed measured results: [browser-acceptance.json](header-refinement/browser-acceptance.json). Captures: [screenshots/](header-refinement/screenshots/).

Early harness attempts used an incorrect preference event and sampled a drawer before its CSS transition finished. Those harness checks were corrected and rerun. The actual 320px drawer clipping issue was fixed and verified against a rebuilt container. There are no remaining header acceptance failures.

## Files changed by this refinement

- `apps/web/src/components/preferences.tsx`
- `apps/web/src/components/shell.tsx`
- `apps/web/src/components/site-navigation.tsx`
- `apps/web/src/context/presentation.tsx`
- `apps/web/src/lib/translations.json`
- `apps/web/src/styles/chrome.css`
- `apps/web/src/styles/motion.css`
- This report and `docs/progress/header-refinement/` evidence.

Several of these files already contained uncommitted work from earlier tasks; the full Git diff includes that prior work. No new catalog, product, cart, checkout, ORS, payment, backend, or database source changes were made for this refinement. Backend tests and full checkout acceptance were not rerun for this presentation-only task.
