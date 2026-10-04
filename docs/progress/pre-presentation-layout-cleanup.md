# Pre-presentation public-page layout cleanup

Date: 2026-10-04. Working checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

Frontend presentation scope only. No commit, push, pull, reset, or rebase. Existing uncommitted Noto font and language-bootstrap changes were preserved byte for byte.

## P0 issues found

No new functional P0 issue was established by this pass. Browser access was unavailable, so this statement does not certify rendered layouts, interaction, or hydration.

## P1 issues found

- Every illustrated public intro used the same bordered panel with 40px padding, despite different content needs. Payment added another 60px of vertical padding around its illustration. This created avoidable space and nested panels.
- The payment sandbox badge was positioned absolutely beside the card icon, which could overlap longer translated text. The cash note used negative spacing and another bordered box.
- Payment added a large generic shopping CTA between sandbox instructions and FAQ, interrupting the requested reading order.
- Promotions used a large decorative illustration and repeated its title/discount explanation before the actual product grid.
- Contacts and Stores placed a decorative location panel and redundant map jump CTA before the primary location section.
- Brands presented its ordinary manufacturer-data limitation as an oversized empty-state card alongside a tall image grid and duplicate catalog action.
- About used four separate bordered feature cards, making a short introduction unnecessarily fragmented.
- The initial HTTP check for visible custom 404 markup failed. Unknown public/blog URLs return 404 and include `NotFoundView` in the client payload, but their raw HTML has no visible custom heading. Display after hydration remains unverified.

## Pages and shared components changed

| Surface | Change |
| --- | --- |
| `/payment` | Tighter copy/card composition; flow-based sandbox badge and cash note; methods → retry/help → sandbox steps → FAQ. Removed the intervening generic shopping CTA. |
| `/how-to-buy` | Content-driven intro; shopping preview uses separators instead of nested panels. Numbered journey and FAQ retained. |
| `/returns` | Smaller illustration canvas, compact intro, four steps retained. FAQ now precedes the contact CTA; removed the duplicate intro contact action. |
| `/promotions` | Compact visual intro; removed repeated illustration caption; hide decoration on mobile so products take priority. Count, fetching, pagination, and product cards unchanged. |
| `/blog` | Compact text intro with consistent section spacing; editorial cards retained. |
| `/blog/[slug]` | Removed excess intro padding; retained reading-time metadata, image, article sections, and related articles. |
| `/brands` | Small assortment images in the intro; normal informational text below. Existing truthful limitation and catalog CTA retained; no invented manufacturers. |
| `/about` | Bounded image and natural-height intro; feature content arranged with separators and inline icons. |
| `/contacts`, `/stores` | Text intro leads directly to location section. Mobile presents the existing map first. Address/config loading and map behavior unchanged. |
| Custom 404 | Added bounded, wrapping heading/body text. Existing navigation actions and route behavior retained. Rendered acceptance pending. |
| `/`, `/delivery` | Audited as protected references; component files and existing styles unchanged. HTTP 200 smoke checks passed. |

Changed implementation files:

- `apps/web/src/components/page-patterns.tsx`
- `apps/web/src/components/public-page-visuals.tsx`
- `apps/web/src/components/store-pages.tsx`
- `apps/web/src/app/site-polish.css`

## Empty-space, PageIntro, and payment fixes

`PageIntro` now supports `text`, `compact`, and `rich` variants, with a separate bounded visual wrapper. Existing text-only commerce consumers retain their layout. New styling is scoped to public/article pages and the custom 404.

Illustrated public intros use natural content height, balanced grid columns, 24px vertical padding, and a single bottom separator. Rich visuals are capped at 400px wide; compact visuals occupy a smaller column. There is no fixed/minimum intro height and no hard maximum height that could clip translated text.

Payment removes the previous illustration padding (`16px` top + `44px` bottom) and reduces the surrounding intro padding from 40px to 24px. The card heading uses normal flex flow so the sandbox badge wraps without absolute-position collisions. The cash note follows the card without negative margins or another panel. The chip is hidden on small screens; the test badge and warning remain visible.

The requested 25–35% reduction is a visual target, **not a measured result**: no browser was connected to measure the old/new hero. The removed padding and tighter card address the source of avoidable height without imposing a brittle pixel height.

## Responsive fixes and UX audit

- Desktop intro-to-content spacing is 48px, then 40px at tablet widths and 32px on small screens. Existing breadcrumb spacing remains 24px.
- At 1024px, gaps/compact visual columns reduce; at 768px, intro columns stack naturally.
- At small widths, promotional decoration and CTA art are hidden, and payment decoration reduces. Useful content and translated controls remain present.
- Visual wrappers and columns use bounded widths and `minmax(0, ...)`; existing wrapping controls, section headings, and Noto typography remain intact.
- About feature rows use separators; Brands no longer stretches an empty-state panel. Returns and Payment no longer duplicate nearby CTA destinations.
- No new animation, CDN, dependency, external font request, fake control, business behavior, or manufacturer/contact claim was added. Existing reduced-motion rules remain.

Source-level audit covered 1440/1024/768/390/320 breakpoint behavior. Actual overflow, glyph clipping, above-the-fold position, CTA fit, and wrapping at those sizes are **PENDING** for RU/TJ/EN in dark/light themes.

## TJ typography preserved

- SHA-256 comparisons confirmed 139 protected files unchanged from the start of this pass, including `globals.css`, `layout.tsx`, bundled font/license, translation dictionaries, presentation preferences, delivery, commerce, backend, and database files.
- Current bundled Noto Sans contains all 78 checked Russian/Tajik glyphs with nonempty outlines at weights 400, 500, 600, 700, 800, and 900. This includes `Ғ ғ Ӣ ӣ Қ қ Ӯ ӯ Ҳ ҳ Ҷ ҷ`.
- Existing homepage Tajik translations, font families, sizes/weights, Leaflet font rules, and persisted RU/TJ/EN behavior were preserved. Document language mapping remains `ru → ru`, `tj → tg`, `en → en`.
- Local font returned HTTP 200, `Content-Type: font/woff2`, 545,544 bytes, matching the source file exactly. SHA-256: `38380deb88a61eeac95620609b56a8919512a0055ffb1d49d4f64b417692414c`.
- These are font/source/runtime asset checks; they do not establish rendered glyph or language-switch acceptance.

## Commands executed and verification

From `apps/web`:

| Command | Result |
| --- | --- |
| `npx prettier --write src/components/page-patterns.tsx src/components/store-pages.tsx src/components/public-page-visuals.tsx src/app/site-polish.css` | PASS |
| `npm run lint` | PASS; zero warnings |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; all 21 static pages generated, dynamic routes compiled |
| `npm run format:check` | PASS |

From the repository root:

| Check | Result |
| --- | --- |
| `docker compose up --build --no-deps -d --wait web` | PASS; web production build passed and container healthy. API/PostgreSQL were not recreated. |
| `docker compose ps` | API, PostgreSQL, web running and healthy |
| `git diff --check` | PASS |
| Protected-file SHA-256 audit | PASS; 139 unchanged files |
| FontTools glyph/variable-weight audit | PASS; 78 glyphs at six requested weights |
| Promotions and StoreLocation source comparison against HEAD | PASS; resource fetching/pagination/config/map logic unchanged |
| HTTP checks against rebuilt container | PASS for the 18 existing routes below, payment section order, compact location intros, Brands content, stylesheet, and local font |

HTTP 200 routes: `/`, `/payment`, `/how-to-buy`, `/returns`, `/promotions`, `/blog`, `/brands`, `/about`, `/contacts`, `/stores`, `/delivery`, all four existing `/blog/[slug]` articles, `/catalog`, `/cart`, `/checkout`.

HTTP 404 verified for `/pre-presentation-missing-page` and `/blog/pre-presentation-missing-article`. The initial stronger assertion requiring custom 404 server markup **FAILED**. A temporary metadata fallback experiment also did not produce that markup and was reverted; neither route module has a final change. Custom-page client rendering still requires browser acceptance. Required lint/typecheck/build/format commands had no failures.

Ignored local evidence: `.cache/pre-presentation-baseline.json`, `.cache/pre-presentation-source-results.json`, `.cache/pre-presentation-http-results.json`, `.cache/pre-presentation-404.html`. These are source/HTTP evidence, not screenshots or browser acceptance.

## Visual acceptance

**VISUAL ACCEPTANCE — PENDING**

The Codex Browser connection list returned `[]`. No pages were rendered by browser automation, no new screenshots were captured, and no manual acceptance is claimed for this pass.

Before presentation, inspect the public pages, homepage, delivery reference, article, and custom 404 in Chrome at 1440, 1024, 768, 390, and 320px. Check RU/TJ/EN and dark/light themes, especially payment badge wrapping, above-the-fold map/method visibility, long Tajik headings, and custom 404 navigation after reload.

## Remaining presentation risks

1. Exact visual balance, the payment height reduction, above-the-fold positions, and overflow need browser confirmation.
2. Unknown public/blog URLs require verification that the custom 404 appears after hydration; raw HTML lacks its visible content despite correct HTTP status/client reference.
3. Map tiles and client-loaded promotion/location content need live browser review. HTTP/source checks cannot certify those interactions.
4. Existing Tajik font/language work remains uncommitted, as requested. No typography or business logic was changed during this cleanup.

No Phase 1/Day 3 expansion, backend edits, payment-flow edits, commit, or push was performed.
