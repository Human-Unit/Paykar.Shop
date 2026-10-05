# Header alignment and hero side-card balance

Date: 2026-10-05. Working checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

Implemented the supplied header/hero alignment brief on the existing local tree. No commit or push was made. Visual acceptance remains pending because the in-app Browser has no connected browser.

## Layout changes

**HEADER ALIGNMENT:** Both header rows already use the same `.container` width and gutters. At widths of 1280px and above, the navigation band now uses an explicit one-column grid and centers the complete navigation group within that shared container. No arbitrary left margin or change to the logo/search/cart grid was introduced.

**CATALOG BUTTON:** Symmetric 20px inline padding, 10px gaps, and centered inline-flex alignment keep the icon, label, and chevron together. The chevron now participates in normal flex flow rather than sitting outside the centered content. Its existing 180ms expansion rotation remains intact.

**NAV CENTERING:** Desktop links use a controlled gap of `clamp(20px, 1.25vw, 24px)`. `safe center` centers the group when it fits and falls back to start alignment if space is insufficient, keeping the beginning accessible. This balances the space before Catalog and after Contacts. Actual rendered alignment for each language still requires browser inspection.

**RIGHT CARD STACK:** Automatic rows now explicitly align to the top, with `align-self: start`, `align-content: start`, and `align-items: start`. Automatic height and a reset minimum height prevent the column from stretching to fill the hero. The desktop/intermediate card gap is 22px; the existing narrow-mobile 16px gap remains.

**DELIVERY CARD:** Content remains unchanged. The title and description have a 400px maximum width and continue wrapping within their grid track. The card uses content-driven height and 26px padding.

**SECOND CARD:** Existing label, heading, icon, and CTA remain. It uses the same content-driven sizing and 26px padding, without forced equal height or empty filler content.

**ICON INSET:** Both icons share the first grid row and right column. The 24px icon aligns to the right edge of the content area, with 26px card padding on the top and right. Long translated labels can increase that first row; exact optical alignment is pending browser inspection.

## Responsive scope

Desktop centering applies only at `min-width: 1280px`. Existing navigation visibility, scrolling, burger, and mobile breakpoints remain. Existing promo behavior remains two columns below the main hero at 1024px and below, then a single column at 640px and below.

| Width | Source configuration | Rendered acceptance |
| --- | --- | --- |
| 1920 | Centered desktop nav, 24px gap, automatic side-card stack | PENDING |
| 1440 | Centered desktop nav, 20px gap, automatic side-card stack | PENDING |
| 1280 | Centered desktop nav, 20px gap, existing compact main-header spacing | PENDING |
| 1024 | Existing navigation breakpoint behavior; promo cards below hero | PENDING |
| 768 | Existing mobile hero/navigation rules; automatic promo sizing | PENDING |
| 390 | Existing mobile navigation; single-column promo stack | PENDING |

**RESPONSIVE:** Source rules inspected. Overflow, wrapping, balance, and interactions at these widths have not been verified in a rendered browser. RU/TJ/EN in dark/light themes are also pending visual inspection; no translations, typography, or theme rules were changed.

## Verification

Commands ran from `apps/web` unless specified otherwise:

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | PASS | Exit 0 |
| `npm run typecheck` | PASS | Exit 0 |
| `npm run build` | PASS | Production build completed; 21 static pages generated |
| `npm run format:check` | PASS | All checked files formatted correctly |
| `docker compose up --build --no-deps -d --wait web` (root) | PASS | Docker production build completed; recreated web container healthy |
| `docker compose ps` (root) | PASS | Web, API, and PostgreSQL healthy; web available at `http://localhost:3000` |
| `git diff --check` (root) | PASS | No whitespace errors; Git emitted existing LF/CRLF conversion notices |
| Source preservation and served CSS audit (root) | PASS | Temporary ignored script `.cache/header-hero-alignment/verify.cjs` exited 0 |
| Browser availability probe | UNAVAILABLE | `agent.browsers.list()` returned `[]` |

The HTTP audit fetched `/`, `/catalog`, and `/delivery` from the rebuilt container: all returned 200. Both homepage CSS assets returned 200 and include the updated navigation centering, 20px Catalog padding, automatic side-stack alignment, and 26px card padding. This verifies deployed assets, not rendered layout or interactions.

A SHA-256 comparison against a pre-task snapshot found changes to only these existing tracked files:

- `apps/web/src/app/site-polish.css`
- `apps/web/src/components/catalog-mega-menu.css`

The report is the only added project deliverable. Existing uncommitted work was preserved. Hero selectors, including hero height, split, image sizing/crop, gradient, headline, subtitle, and CTA rules, compare identically with the pre-task CSS. The entire presentation motion/glass section also compares identically. No JSX, handlers, ARIA, routes, translations, assets, search/cart logic, backend, or database files were changed in this pass.

## Visual acceptance

**VISUAL ACCEPTANCE: PENDING.** Automated browser inspection was unavailable because Codex Browser is disconnected. No new manual browser acceptance evidence was provided for this change.

Remaining presentation check: inspect the homepage at the six widths above, in RU/TJ/EN and dark/light themes. Confirm Catalog internal spacing, nav centering and balanced trailing space, content-driven card heights, icon inset, wrapping, no horizontal overflow, and existing keyboard/menu/search/cart behavior. No command/build failures remain; rendered browser acceptance is the outstanding verification step.
