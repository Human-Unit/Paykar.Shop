# Pre-presentation catalog mega-menu fix

Date: 2026-10-05. Working checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

Current status: the visual redesign implementation is recorded in the **Visual redesign pass** section below. Its independent-column layout supersedes the initial row-grid layout. Browser visual acceptance remains PENDING.

## Initial opacity/UX pass

Frontend navigation presentation only. Existing local motion/glass work was preserved. No commit or push was performed; HEAD remains `44f3d55` and the Git index is empty.

**ROOT CAUSE:** The recent presentation glass groups in `site-polish.css` included `.site-header .catalog-mega-panel`, overriding the original solid background with a surface mixed with transparency and an 18px backdrop blur. The original panel also had a thick green top edge, 80px shortcut indentation, and a three-column medium-width layout.

**FILES CHANGED (this task):**

- `apps/web/src/components/catalog-mega-menu.tsx`: backdrop portal and dismissal integration, geometry updates, 52px image props, five-shortcut limit and localized parent-category action.
- `apps/web/src/components/catalog-mega-menu.css`: opaque surface, backdrop, spacing, grid, scrollbar, link/focus states and reduced-motion rules.
- `apps/web/src/app/site-polish.css`: remove only the catalog panel from shared glass groups and remove its extra green top-edge override. Shared reduced-motion behavior remains covered by the dedicated menu stylesheet.
- `apps/web/src/lib/translations.json`: add `Смотреть все` → `Ҳамаро дидан` / `View all`.
- This report.

**OPAQUE PANEL:** `.site-header .catalog-mega-panel` uses `var(--elevated-surface)`, with both backdrop-filter properties explicitly `none`. Existing tokens resolve to `#161616` in dark mode and `#f1f3ef` in light mode. The open panel's opacity is 1. Its border is neutral 1px, bottom radius 16px, and dark shadows use 52% / 28% black with softer 18% / 10% light shadows. No `!important` was introduced. Source and served production CSS inspections found no competing transparent panel background rule. Search, information dropdowns, header, burger drawer and promotional glass rules remain intact. This intentionally supersedes the catalog-glass portion of the earlier motion/glass report.

**OVERLAY:** A native button portal to `document.body` uses fixed positioning, 60% black dimming and static 3px blur where supported. Its top is measured from the navigation's viewport bottom, so it covers page content and visible footer below the header. Portaling outside the glass header avoids its backdrop-filter establishing a containing block for a fixed descendant. `tabIndex={-1}` keeps the backdrop out of ordinary Tab navigation; its accessible label uses the existing localized close-menu key. Pointer down preserves the current link focus, the document outside handler excludes the backdrop, and its click uses the existing close/focus-restoration path exactly once.

**STACKING:** Body portal backdrop 1000 < header stacking context 1100. Within the header, existing search 1100 > navigation 1000; the panel remains at 30 inside navigation. The global glow and ordinary content stay below the backdrop. Existing isolated map containers and native dialog top-layer behavior were retained. Rendered overlap acceptance remains pending.

**PANEL HEIGHT:** Retains a CSS variable max-height with a dynamic viewport fallback. While open, resize/ResizeObserver measurements and a passive, animation-frame-coalesced window scroll handler update both available panel height and backdrop top. Height is clamped to the viewport minus a 24px bottom allowance. The panel uses `overflow-y: auto` and `overscroll-behavior: contain`; the desktop page receives no scroll lock. Scrollbar is thin, 6px in WebKit, with a 40% green-tinted thumb and transparent track. Source checks and controlled short-viewport measurements passed; actual scrolling to the final group remains pending.

**GRID:** Four `minmax(0, 1fr)` columns with 32px gaps at ≥1280px. Two columns with 24px gaps at 769–1279px. Desktop panel, backdrop and chevron are hidden at ≤768px. Source rules were checked at 360, 390, 768, 769, 1024, 1279, 1280, 1440 and 1920px; these are CSS rule checks, not rendered viewport tests.

**CATEGORY BLOCKS:** Header uses a `52px minmax(0, 1fr)` grid with a 12px gap. Titles remain real Next.js links with 15px/700 text, existing href generation, prefetch setting, navigation callback and current-route semantics. Heading row has 24px padding and a divider; grid padding is 24px top/horizontal and 32px bottom. The existing all-catalog link remains `/catalog`, with restrained border, green text and a 44px minimum height.

**IMAGE SIZE:** Existing category artwork and slug mapping are unchanged. Image props and CSS are 52×52px, cover fitting, 12px radius and a subtle border. The existing icon fallback remains.

**SUB-LINK ALIGNMENT:** Removed the 80px/64px indentation. Shortcut lists begin at the image's left edge, with `margin: 12px 0 0`, no list padding and a 6px entry gap. The small green hover/current indicator is absolutely positioned inside the category block padding and does not shift text.

**SUB-LINK CONTRAST:** Existing secondary text tokens give the following calculated normal-text contrast. These are palette calculations, not a browser screenshot audit:

| Theme | Text | Opaque panel | Contrast | Active group wash contrast |
| --- | --- | --- | --- | --- |
| Dark | `#a3a3a3` | `#161616` | 7.17:1 | 6.89:1 |
| Light | `#646b65` | `#f1f3ef` | 4.91:1 | 5.06:1 |

Hover uses primary text, including an explicit selector overcoming the existing light-theme general navigation hover rule. Current shortcuts use brand text and weight 600. Panel links/buttons have a single 2px focus outline with a 3px offset and no additional shadow ring.

**СМОТРЕТЬ ВСЕ:** Show at most five original category/family shortcuts. Only groups with more than five get the localized action and arrow, linking to the original parent category href. Current seed data exercises truncation for dairy and bakery; groups with five or fewer have no extra action. `catalogGroups`, `catalogGroupLinks`, `categoryHref` and `categoryImages` were not modified.

**TRIGGER:** Existing `/catalog` click-through, `prefetch={false}`, expanded/control attributes and desktop ArrowDown behavior are preserved. A sufficiently specific focus-visible selector sets exactly one 2px outline with 2px offset and no box shadow. The expanded chevron rotates 180°. No menu/dialog popup semantics were added to this navigation disclosure.

**ANIMATION:** Panel uses opacity plus `translateY(-8px)` → 0 over 180ms ease-out; no scale or bounce. The backdrop fades on opening over 180ms; blur is static. Existing 150ms hover-close delay and shared Framer Motion architecture remain.

**REDUCED MOTION:** Panel and chevron transitions/translation are disabled; backdrop animation and shortcut-indicator transition are disabled. Existing shared reduced-motion rules for other presentation elements are preserved.

**MOBILE:** Existing burger drawer and direct Catalog link are unchanged. No second drawer or new mobile accordion. The existing desktop media subscription prevents category-resource loading on mobile and closes the desktop disclosure on a mobile resize; the backdrop is removed with it.

**ACCESSIBILITY:** Category navigation retains `nav > ul > li > a` semantics, current-route attributes and inert/hidden closed-panel handling. No focus trap, modal role or desktop body scroll lock. Controlled handler checks exercised hover delay/re-entry, ArrowDown, Escape/focus return without reopening, focus leave, outside click, backdrop click without double-close, shared disclosure exclusion, route-change close, mobile fallback, loading/error/retry/empty, nested category links and truncation. Tab/Shift+Tab remain native; their rendered navigation order requires browser acceptance.

## Verification actually executed

| Check | Result |
| --- | --- |
| `npm run lint` | PASS, zero warnings |
| `npm run typecheck` | PASS, Next route type generation and TypeScript |
| `npm run build` | PASS, 21 static pages generated; dynamic routes retained |
| `npm run format:check` | PASS |
| `docker compose up --build --no-deps -d --wait web` | PASS, production image rebuilt and web healthy |
| `docker compose ps` | PASS, web/API/PostgreSQL all healthy; only web recreated |
| `docker compose config --quiet` | PASS |
| `git diff --check` | PASS; Git emitted only existing LF/CRLF normalization notices |
| Actual TSX handler harness with controlled hook/DOM/timer doubles | PASS, 21 check groups; not browser automation |
| PostCSS source-rule/contrast/preservation audit | PASS; only four existing files differ from the pre-task tracked-file SHA-256 baseline |
| Rebuilt Docker HTTP check | PASS: `/`, `/catalog`, `/delivery` return 200 |
| Served production CSS inspection | PASS: solid panel surface, no competing transparent panel rule, backdrop styles and other dropdown blur retained |
| RU/TJ/EN action dictionary check | PASS; existing translation entries preserved |
| Connected browser discovery | Unavailable: `agent.browsers.list()` returned `[]` |

No application check remains failed. The first local CSS audit attempt failed because its helper selected only the last conditional rule rather than accumulating base declarations; the helper was corrected and rerun successfully. This was an audit-harness issue.

Detailed local evidence is in ignored `.cache/catalog-menu-fix/{handler,style,runtime}-verification.json` and the pre-task SHA-256 baseline. Harnesses execute actual source handlers or inspect CSS/HTTP assets; they do not emulate or verify a rendered browser. Existing business logic, APIs, backend, database, ORS, checkout, orders, cart, search and map implementations were not edited by this task.

**VISUAL / INTERACTION ACCEPTANCE — PENDING.** Automated browser access is unavailable and no new manual acceptance was provided. Do not treat source checks, builds, HTTP responses or controlled handler checks as browser acceptance.

## Recheck after the repeated brief

The same attachment was reviewed again against the current implementation on 2026-10-05. No additional application edits were needed. Lint, typecheck, production build, formatting, the controlled handler/source-style audits, Docker web build/start/health, Compose configuration, HTTP/served CSS checks and `git diff --check` were rerun and passed. Docker reused unchanged build layers. Web, API and PostgreSQL remain healthy. A fresh browser connection attempt for `http://localhost:3000/catalog` returned `No browser is available`; visual/interaction acceptance remains PENDING. This follow-up changes only this report and ignored local verification evidence. No commit or push.

**REMAINING RISKS:** Before presentation, manually inspect `/catalog` with the menu open at 1280/1440/1920px, medium 1024px, and mobile navigation at 360/390/768px in dark/light and RU/TJ/EN. Confirm opacity, backdrop alignment/blur, hover crossing, last-group scrolling, Tajik wrapping, no horizontal overflow, search/information/dialog stacking and real keyboard focus. Test hover open → move into panel → delayed leave; backdrop click; Escape and focus return; ArrowDown → native Tab/Shift+Tab; category/shortcut/all-catalog/view-all navigation. No commit or push; work stops after this verification.

## Visual redesign pass

**VISUAL REDESIGN PASS:** Implemented on 2026-10-05 against the subsequent “Real Catalog Mega-Menu Visual Redesign” brief. Changes in this pass are limited to `catalog-mega-menu.tsx`, `catalog-mega-menu.css` and this report. Presentation implementation and automated/source verification are complete; the brief's visual definition of done has not been confirmed.

**ROW-GRID REMOVED:** `.catalog-mega-grid` now uses `display: block` and CSS multi-column flow. Category sections no longer share grid rows. The 52px image/title header remains a small grid inside each independent section.

**MASONRY/COLUMN APPROACH:** Native CSS columns with `column-fill: balance`, full-width inline-block sections and `break-inside: avoid`. No fixed content height, category DOM measurements, runtime masonry calculation, explicit array redistribution, arbitrary CSS order or new viewport JavaScript. Existing DOM/category order reads down a column before moving to the next, and remains the native keyboard order. Responsive column rules:

| Viewport | Columns | Column gap |
| --- | --- | --- |
| ≥1280px | 4 | 28px |
| 900–1279px | 3 | 24px |
| 769–899px | 2 | 20px |
| ≤768px | Desktop menu disabled; existing burger unchanged | — |

**BEFORE HEIGHT:** No numeric browser measurement or before screenshot was captured. The source snapshot used two shared grid rows for six groups, with each row reserving its tallest group's height. A numeric before/after comparison would be speculative.

**AFTER STRUCTURE:** Independent compact category sections within balanced columns. The panel remains naturally sized with its existing viewport max-height/internal scrolling. Its horizontal edges are inset 12px from the navigation container. Heading padding is now 20px vertically / 24px horizontally; the all-catalog action retains a 44px target. No artificial 540–650px content height was imposed. The approximate height target at 1440px is still a rendered acceptance check.

**DEAD SPACE:** Removed the shared-row mechanism that reserved blank space under shorter neighboring groups. The content list has 20px top/horizontal and 12px bottom padding; group bottom margins add 20px, giving a nominal 32px end allowance. There is no fixed-height blank bottom rectangle. Uneven columns can still occur when indivisible category groups have different heights; the actual visual improvement and residual whitespace require inspection.

**CATEGORY BLOCK DESIGN:** Each category is now a contained section with 14px top, 16px horizontal/bottom padding, a 12px radius and a subtle neutral border. Dark sections use opaque `--hover-surface` (`#1c1c1c`) above the opaque panel (`#161616`); light sections use opaque white above the near-white panel. Hover/focus-within adds a restrained green border/wash. Active highlighting remains green, including in light mode. Titles stay 15px/700, shortcut links are now 13px/500 with 32px minimum height and 6px gaps. Coarse-pointer links retain 44px targets. Images stay 52×52px. The existing dot hover indicator remains without horizontal text movement.

**COLUMN BALANCE:** CSS balances the available content height while keeping sections unbroken and preserving category sequence. No shortest-column JavaScript reorder was introduced. Source rules were verified at 360, 390, 768, 769, 899, 900, 1024, 1279, 1280, 1440 and 1920px. These are rule checks, not rendered layouts. Actual distribution, Tajik/English wrapping and keyboard scanning remain pending.

**GROUP SPACING:** 20px between category blocks. Shortcuts continue to align with the image's left edge. The localized parent-category “View all” action still appears only for more than five shortcuts, and now has 10px separation from the last shortcut (6px list gap plus 4px action margin); no extra bordered action was added.

**MOTION:** The panel retains its 180ms opacity/−8px entrance. Groups use the existing shared lazy Framer Motion architecture on semantic `m.li` elements: opacity and 6px vertical movement only, 130ms duration, 30ms stagger capped at 90ms so the final group settles by 220ms. Hover adds 1px upward emphasis. Links are not individually animated. No height, max-height, column-count or layout animation.

**REDUCED MOTION:** `useReducedMotion` removes group duration, stagger and hover movement. Existing global `data-reveal` reduced-motion/focus guards keep sections visible without translation when reduced motion is requested or a link receives focus. Dedicated group surface transitions are also disabled under reduced motion. The shared motion provider and other pages were not changed.

**PRESERVATION:** Opaque panel, 60% dim/3px blur backdrop, stacking, measured viewport limit, scrollbar, dismissal/focus handlers, 150ms hover delay, ArrowDown, native Tab/Shift+Tab, route-change close, loading/error/retry/empty states, five-link truncation, real parent hrefs and mobile fallback remain. No focus trap or desktop scroll lock. The category API/helpers, translations, Noto Sans/font assets, backend, cart, checkout, orders, ORS, search, delivery and maps were not edited. Pre-pass SHA-256 checks found only the two intended tracked component files changed; dismissal/geometry source was also checked unchanged.

**CONTRAST:** Calculated shortcut text contrast remains above 4.5:1 against panel, normal/hover section and active section surfaces. Normal section ratios: dark 6.76:1, light 5.48:1. Hover section ratios: dark 6.15:1, light 5.06:1. These are palette calculations, not browser computed-style measurements.

| Required check, rerun after redesign | Result |
| --- | --- |
| lint: `npm run lint` | PASS, no warnings |
| typecheck: `npm run typecheck` | PASS |
| build: `npm run build` | PASS, 21 static pages plus retained dynamic routes |
| format: `npm run format:check` | PASS |
| docker: `docker compose up --build --no-deps -d --wait web` | PASS, newly compiled production image and healthy web |
| docker: `docker compose ps` | PASS, web/API/PostgreSQL healthy; only web recreated |
| `docker compose config --quiet` | PASS |
| diff-check: `git diff --check` | PASS, existing LF/CRLF notices only |
| Controlled actual TSX handlers / motion props | PASS, 24 check groups; not rendered Framer/browser verification |
| PostCSS structure/contrast/preservation audit | PASS |
| Rebuilt service HTTP / compiled CSS | PASS: `/`, `/catalog`, `/delivery` 200; opaque panel and new 4/3/2-column rules served |
| Browser discovery | Unavailable, connected browser list `[]` |

Ignored local evidence: `.cache/catalog-menu-redesign/{handler,style,runtime}-verification.json`, baseline hashes and before component/CSS snapshots. No application check failed in this pass.

**VISUAL ACCEPTANCE: PENDING.** No automated or manual rendered acceptance was performed for this redesign. No numeric after height, viewport screenshots, overflow measurements or screenshot comparison is claimed. The code change is structural, but the brief's visual completion criterion requires real inspection.

Before presentation, inspect the rebuilt `http://localhost:3000/catalog` menu at 1440/1920/1280/1024px in RU/TJ/EN and dark/light. Confirm compact balanced columns, reduced dead space/height, bottom whitespace, long-word wrapping, all groups reachable by scrolling, and no horizontal overflow. Check 390/768px burger behavior and the preserved hover/keyboard/backdrop/navigation flows. No commit or push; HEAD remains `44f3d55`, index empty.

### Repeated redesign brief: current-state check

Rechecked on 2026-10-05 without additional application changes. The source/preservation audit and HTTP/compiled-CSS check passed again: the running web service serves the opaque panel and independent 4/3/2-column rules, and `/`, `/catalog`, `/delivery` return 200. Web, API and PostgreSQL are healthy; `git diff --check` passed. The lint/typecheck/build/format and Docker rebuild results above are from the implementation verification, not new runs during this unchanged-code follow-up. Browser connection was retried and returned `No browser is available`; discovery returned `[]`. **VISUAL ACCEPTANCE remains PENDING.** This follow-up edits only this report and ignored verification evidence. No commit or push.

### Catalog trigger alignment

On 2026-10-05, the Catalog trigger icon and label were given an explicit centered flex row with consistent spacing and line-height. The chevron is vertically centered while retaining its right-side placement and open-state rotation. Targeted Prettier check passed. This follow-up has not had rendered browser inspection.
