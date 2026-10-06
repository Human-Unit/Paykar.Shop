# Header preferences relocation

Date: 2026-10-06. Workspace: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`. Branch: local `main`, continuing from the Diyor integration and the uncommitted catalog-filter pass.

**HEADER PREFERENCES RELOCATION — ACCEPTED**

## Implementation

- Moved language and theme into the main header row, immediately before the cart. Removed the duplicate utility-strip theme control and both preference sections from the drawer. The burger remains in its existing utility-strip position; the drawer retains its 11 navigation links.
- Language uses a compact RU/TJ/EN trigger and a custom, themed radio menu. The current option is marked. Enter/Space open it; arrows, Home and End move focus. Selection and Escape return focus to the trigger. Tab dismisses and advances; outside pointer clicks dismiss without stealing focus from the clicked control.
- Theme uses the existing Lucide icons and cycles **System → Light → Dark → System**. Its localized accessible label/title identifies the current preference and next action. System mode follows live OS color-scheme changes. The existing theme reveal and reduced-motion behavior remain in use.
- Both controls use the existing `PresentationProvider` and `paykar-presentation-v1` storage. The provider, document-language mapping and persistence implementation were not changed. Language autonyms were retained; the new “Switch to” phrase has TJ/EN translations.
- Utilities have at least 44×44px touch targets. Mobile gaps and cart padding are compact; the brand uses the available grid space at 320px. The language panel is positioned within the viewport without changing navigation measurements.
- Existing sticky behavior remains: desktop navigation hides on downward scroll and returns on upward scroll while the main row stays visible; mobile's brand/utility row scrolls away while search stays sticky. No header-scroll hook changes were needed.

No catalog, product, cart, checkout, routing, payment, connection, backend, dependency or database logic was changed by this pass. Earlier uncommitted catalog work and `.gitignore`/`grafify` artifacts were preserved.

## Checks actually run

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run format:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS — production build, 20 generated routes |
| `docker compose up --build -d` | PASS — production frontend rebuilt and stack started |
| `docker compose ps` | PostgreSQL, API and web healthy |
| `git diff --check` | PASS |

An initial typecheck caught a widened `string` type for the system-theme snapshot. The external-store hook now explicitly returns `"dark" | "light"`; subsequent typecheck and both local/Docker builds passed. No TypeScript errors were suppressed.

## Actual browser acceptance

Connected Playwright Chrome ran against `http://localhost:3000` using the rebuilt Docker production web/API. Automated browser acceptance is **PASS** for this header task.

- RU/TJ/EN selection updates the UI and current-language indicator, persists after reload, and sets `html lang` to `ru`/`tg`/`en`.
- Keyboard menu navigation, checked-option marking, selection/Escape focus return, Tab dismissal, outside-click focus and burger Escape focus return passed.
- Light/dark/system preferences persist through reload; system mode follows emulated OS light/dark changes without losing the system preference. Normal-motion theme reveal finishes without errors; reduced-motion interaction also passed.
- The responsive matrix passed **36 combinations**: RU/TJ/EN × light/dark × **320, 390, 768, 1024, 1440, 1920px**. Measurements verified page width, control bounds, 44px touch targets, search/cart separation, dropdown viewport fit, menu hit targets and exactly one language/theme pair.
- Desktop sticky controls remained visible, scroll-up navigation returned, and the language panel worked in the sticky state. Existing mobile sticky search remained at the expected position.
- Catalog mega-menu keyboard opening, real SKU search suggestions, header cart navigation and the drawer's delivery link passed. The drawer contained zero preference controls.
- No console errors or JavaScript exceptions occurred in the passing acceptance batches. Existing resource-preload warnings are not failures.

One navigation harness attempt clicked the Catalog link expecting its popup to remain open. That link intentionally navigates and closes the popup. The check was corrected to use its existing focus/ArrowDown interaction and passed; no catalog code was changed.

Evidence: [browser results](header-preferences/browser-acceptance.json) and [12 screenshots](header-preferences/screenshots/) at 390px/1440px, all languages and both themes. Representative RU dark mobile, TJ light mobile and EN light/dark desktop screenshots were visually inspected. Browser preferences were restored to RU/light; unrelated tabs were left untouched.

## Files changed in this pass

- `apps/web/src/components/preferences.tsx`
- `apps/web/src/components/shell.tsx`
- `apps/web/src/components/site-navigation.tsx`
- `apps/web/src/styles/chrome.css`
- `apps/web/src/lib/translations.json` — one new phrase, preserving earlier catalog translations
- This report, browser acceptance JSON and screenshots

No remaining acceptance blocker. No commit or push was made.
