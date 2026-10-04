# Pre-presentation header and homepage hero polish

Date: 2026-10-04. Checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

## Plan

Inspect the current header, search/navigation handlers, hero/promo markup, stylesheet cascade, and existing photo. Apply scoped presentation changes, preserve localization and behavior, run frontend checks, rebuild only web, then verify served markup/assets and record browser limitations.

No commit, push, pull, reset, backend change, package installation, or functionality expansion.

## Files changed in this pass

- `apps/web/src/components/shopping-banner.tsx`: conditionally retain the banner logo only for non-hero usage.
- `apps/web/src/components/home.tsx`: remove forced line breaks from the two side-card headings; preserve translated phrases.
- `apps/web/src/components/site-navigation.tsx`: add current-page attributes to informational navigation; preserve existing handlers/effects.
- `apps/web/src/app/site-polish.css`: scoped header/search/navigation and homepage hero/promo presentation rules.
- This report.

`shell.tsx`, `search-box.tsx`, the catalog mega-menu, drawer handlers, logo/photo bytes, global font CSS, language/theme preferences, routes, APIs, checkout, delivery, maps, and prior public-page components remain unchanged.

## Hero duplicate-logo fix

Homepage `ShoppingBanner` no longer renders `<Brand />`. The site-wide header brand remains, as do the footer, closed drawer, and non-hero catalog banner brands. HTTP markup inspection confirmed exactly one brand image inside the header and zero inside the homepage hero.

## Hero composition

- Desktop copy occupies 46% of the hero, with vertically centered content and bounded headings. The remaining space is the photography area; the photo can extend beneath the gradient.
- Eyebrow → heading is 14px; heading → description 18px; description → CTA 26px.
- Noto Sans headline uses weight 800, `clamp(36px, 3.4vw, 52px)`, line-height 1.05, and restrained negative tracking. All existing source copy and translation keys are retained.
- The previous 360px desktop minimum remains; no fixed/max hero height was added. Content and side cards can grow for longer translations.
- Hero/catalog CTA controls share green color, dark text, 48px minimum height, 6px radius, hover/pressed/focus feedback, and 180ms transitions.

## Image crop and gradient

The inspected existing photo is 1536×1024, with green background to the left and the grocery arrangement to the right. Its asset bytes are unchanged.

Desktop uses full-height, intrinsic-width photography bounded to the hero, `object-fit: contain`, and `object-position: right center`. A mask feathers only the photo's left edge. A separate graduated dark-to-transparent overlay protects copy while leaving the right-side products visible; the hero background adds a restrained green glow. This avoids adding a hard vertical photo boundary or stretching the asset.

At 768px and below, copy is first and photography second in the visual grid. Photography uses natural height, containment, a 300px maximum display height, and no desktop overlay/mask. This preserves the source arrangement instead of applying a wide-screen crop to mobile. Exact rendered image scale and tablet spacing still need visual review.

## Delivery and shopping promo cards

- Desktop main/side grid changes from 3:1 to 2.4:1 with a 20px gap, giving the cards more usable width within the existing page maximum.
- Icons are in a dedicated grid cell next to the eyebrow, rather than absolutely positioned over copy.
- Titles, descriptions, and links span the card width with natural wrapping. Forced title `<br>` elements were removed; source phrases are unchanged.
- Card content has explicit spacing, readable 13px description/link text, bounded children, and no overflow clipping. Automatic row sizes accommodate differing content while keeping the side stack aligned with the hero.
- No new promo description or marketing copy was invented.

## Header, search, and navigation

The existing brand → search → cart structure and catalog/information row remain. Header gaps are 28px on larger screens and compress to 20px, then existing mobile layout spacing.

Search is 52px tall, with a slightly elevated surface, clearer border, fully opaque muted placeholder, visible green buttons, hover feedback, and a 3px green focus ring. Light theme uses the existing white surface token. Input text can ellipsize visually at narrow widths; its value, label, submit action, debounce, suggestions, and keyboard behavior are unchanged.

Navigation uses 13px secondary text on desktop, quieter than the primary catalog button; it compresses to 12px at 1024px and below. Gaps are 24/20/16px as available width decreases. Existing responsive visibility rules remain. Hover, focus, expanded dropdown feedback, and current-section underline/color are explicit. Current blog highlighting also applies to article URLs. Normal links retain their existing lack of chevrons.

The header remains non-sticky. No z-index, fixed/sticky header positioning, or transform was introduced. Source layering remains:

| Surface | Existing stacking |
| --- | --- |
| Leaflet/store-map container | 0 |
| Main navigation | 1000 |
| Catalog mega-menu | 30 inside navigation |
| Information panel | 1200 inside navigation |
| Search/suggestions | Search context at 1100 |
| Burger dialog | Native modal dialog top layer |

Source comparison confirms unchanged event handlers/effects; actual overlay interactions still require a browser.

## Contrast

Computed ratios for declared flat colors, rounded to two decimals:

| Pair | Dark | Light |
| --- | --- | --- |
| Normal navigation text/header | 11.05:1 | 8.72:1 |
| Placeholder/search surface | 6.53:1 | 5.48:1 |
| Promo description/normal card surface | 7.49:1 | 5.48:1 |
| Active navigation/header | 6.22:1 | 5.81:1 |

CTA text/green is 5.96:1, and text/pressed green is 4.90:1. These calculations exceed 4.5:1 for the listed flat-color pairs; they are not a rendered WCAG audit of photography/gradients. The supplied PNG brand, including its embedded tagline, was preserved without recoloring or replacing it.

## Responsive and accessibility

Source review covered 360, 390, 768, 1024, 1280, 1440, and 1920px:

- 1280–1920: existing bounded page container, hero/side layout, balanced header gaps and compressed navigation spacing.
- 1024: side cards move below the hero in two columns.
- 768: hero copy/photo stack; no desktop mask or dark overlay on the photo.
- 360–390: existing brand/cart/search rows and burger menu retained; full-width hero CTA, naturally stacked promo cards, bounded/wrapping text.

Semantic header/nav/main/section, real links/buttons, search combobox labels, dialog semantics, and keyboard handlers remain. Current-route navigation gains `aria-current`. Focus feedback is explicit on search buttons, nav entries, catalog/hero CTA, and promo cards. Only 180ms interaction transitions were added, with matching reduced-motion overrides.

No horizontal-overflow, clipping, exact fold position, focus-rendering, or visual-balance PASS is claimed without rendering.

## TJ typography preserved

All translation strings in the three changed TSX files match the pre-pass list. Translation dictionaries, `html lang` bootstrap (`ru/tg/en`), persisted language/theme settings, global Noto/Leaflet font rules, and bundled font/license were unchanged.

FontTools verified nonempty outlines for 78 Russian/Tajik glyphs at weights 400, 500, 600, 700, 800, and 900, including `Ғ ғ Ӣ ӣ Қ қ Ӯ ӯ Ҳ ҳ Ҷ ҷ`. The served local font returned HTTP 200 and matched its 545,544-byte source exactly. Glyph appearance and RU/TJ/EN switching in the rendered hero remain pending visual acceptance.

## Verification

| Command/check actually executed | Result |
| --- | --- |
| `npx prettier --write src/components/shopping-banner.tsx src/components/home.tsx src/components/site-navigation.tsx src/app/site-polish.css` | PASS |
| `npm run lint` | PASS; zero warnings |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; all 21 static pages generated |
| `npm run format:check` | PASS |
| `docker compose up --build --no-deps -d --wait web` | PASS; production container rebuilt and healthy; API/database not recreated |
| `git diff --check` | PASS |
| Protected-file SHA-256 audit | PASS; 291 files unchanged, including prior uncommitted font/public-page work and protected business code |
| CSS AST preservation audit | PASS; every pre-pass CSS rule preserved, including public-page cleanup |
| Navigation JSX handler/effect AST comparison | PASS; existing handlers and effects unchanged |
| Controlled catalog/navigation handler regression | PASS; 13 checks, using actual TSX with hook/focus/timer doubles, not a browser |
| Russian/Tajik variable-font glyph audit | PASS; 78 glyphs at six weights |
| Deployed markup, CSS, image, and font checks | PASS, details below |
| Credential scan of 36 deployed static files | PASS; zero matches for the configured ORS key/database password; no public ORS variable |

Controlled handler checks cover hover/delayed close, pointer transition to panel, keyboard open/ArrowDown, Escape/focus restoration, internal/outside focus, outside click, link close, mobile resize behavior, shared menu exclusion, route-change close, late close handling, and presence of the burger catalog link. They do not test rendered CSS, native dialog focus trapping, autocomplete interaction, or browser pointer movement.

Rebuilt-container HTTP 200 checks: `/`, `/payment`, `/delivery`, `/blog/weekly-shopping`, `/promotions`, `/catalog`, `/cart`, `/checkout`. Each retained one header brand and search form/combobox. Homepage hero had no brand. Active navigation attributes were verified for Payment, Delivery, Blog article, and Promotions. Served CSS contained the new scoped rules; photo, logo, and font bytes matched local assets.

No new package, font/image asset, API call, external URL, or stylesheet asset/network dependency was introduced. Browser network capture was unavailable; the credential check inspected actual compiled files copied from the rebuilt web container.

No required command or additional verification check failed.

Ignored local evidence: `.cache/header-hero-baseline.json`, `.cache/header-hero-preservation-results.json`, `.cache/header-hero-source-evidence.json`, `.cache/header-hero-handler-verification.json`, `.cache/header-hero-http-results.json`, `.cache/header-hero-security-results.json`.

## Visual acceptance

**VISUAL ACCEPTANCE — PENDING**

The Codex Browser connection list returned `[]`. No automated page rendering, screenshots, or manual acceptance was performed in this pass. Viewing the local grocery asset is not browser acceptance.

Before presentation, inspect the homepage in Chrome in RU/TJ/EN, dark/light, at 360, 768, 1280, and 1920px; also check 390 and 1440px. Confirm hero composition/photo scale/gradient, card title wrapping, search prominence and suggestion layering, catalog disclosures, burger behavior, focus states, and overflow. Reload language/theme preferences as part of that review.

## Remaining risks

1. Browser verification is still needed for exact crop/scale, gradient blending, Tajik heading wrapping, card alignment, and useful content appearing in the initial desktop viewport.
2. Overlay stacking was preserved and source/controlled-handler checks passed, but dropdown/search/dialog interactions and rendered focus remain unverified.
3. The original grocery photo's own boundaries and logo's embedded tagline remain unchanged; this pass only changes their presentation.
4. All work remains local and uncommitted, including the earlier typography and public-page cleanup, as requested.
