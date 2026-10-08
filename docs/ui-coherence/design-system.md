# Proposed Paykar design system

Status: **proposal, not implemented**. Derives from current ProductCard, My Shopping workspace, shell and page patterns. No new library, framework or asset-generation dependency.

## 1. Layout

| Rule | Desktop | Tablet | Mobile |
|---|---|---|---|
| Primary container | 1320px maximum | Same container | Same container |
| Minimum side gutter | 32px above 1100px | 24px at 641–1100px | 16px at 640px and below |
| Page top after shell | 28px | 24px | 16px |
| Breadcrumb → title group | 24px | 24px | 20px |
| Title group → first content | 32px | 24px | 24px |
| Main section gap | 64px | 48px | 40px |
| Related subgroups | 32px | 24px | 24px |

- Keep the current centered shell and logo/search/nav alignment. Align workspace outer edges with it; do not add another 1280px centering layer.
- Reading content remains max **820px**, centered. Text inside a wide panel should generally stay at 60–70ch.
- Template forms may use a purposeful **900px** working region. Do not stretch labels across it: product identity and controls belong together.
- Cart/checkout retain two-column desktop composition and their existing collapse threshold. A 360–400px summary is an intentional exception.
- Full-bleed background is allowed; content stays on the shared grid. Homepage hero, accepted phone and maps retain their current internal composition.
- Do not alter sticky-header measurement or safe-area/bottom-navigation behavior through fixed page padding guesses.

## 2. Spacing scale

Use **4, 8, 12, 16, 20, 24, 32, 40, 48, 64px** for migrated rules.

| Tier | Use |
|---|---|
| 4 / 8 | Icon-label, badge, adjacent metadata, label-to-input |
| 12 | Small control groups and compact row internals |
| 16 | Mobile card padding, product grid gap, stacked controls |
| 20 / 24 | Desktop card padding, image-to-copy, related content |
| 32 | Desktop section heading to content; independent card groups |
| 40 / 48 / 64 | Mobile/tablet/desktop section separation |

Card title → body: 8px. Body → metadata: 12px. Content → actions: 20px desktop / 16px mobile. Section heading → cards: 24px desktop / 20px mobile. Page intro uses the layout table above.

Equalize cards within a row through natural grid alignment; do not set large arbitrary minimum heights merely to fill a rectangle. Empty content must not reserve phantom space.

These values are migration rules, not permission to blindly replace all current numbers. Protected map/phone geometry and tightly tuned hero positioning stay unchanged.

## 3. Typography

Keep bundled **Noto Sans**, real variable weights, existing Cyrillic Extended coverage and the current font loading method.

| Role | Desktop | Mobile | Weight / line height |
|---|---|---|---|
| Hero display | Existing responsive hero, approximately 48–54px | Existing 32–36px localized composition | 800–900 / 1.06–1.12 |
| Page title | 40px | 28px | 800 / 1.15 |
| Section title | 28px | 24px | 750–800 / 1.2 |
| Card title | 18px; feature card up to 20px | 16–18px | 700 / 1.3 |
| Body | 16px | 16px | 400–500 / 1.55 |
| Supporting text | 14px | 14px | 400–500 / 1.5 |
| Metadata | 12–13px | 12–13px | 500–600 / 1.4 |
| Eyebrow, only when useful | 12px | 12px | 700 / 1.4 |

- Product price remains a separate commercial scale: existing card 22/19px; detail approximately 36/32px. Do not make every number a display heading.
- Avoid a second title scale just because a page has an illustration. Delivery's supplied content/illustration stays; common title role can converge after anchor approval.
- Prefer natural wrap to ellipsis for page/card headings. Product cards retain the accepted two-line title treatment.
- Keep numeric amounts and units readable; wrap metadata groups rather than clipping controls.
- TJ check strings: Қаҳрамон; Ҷумҳурии Тоҷикистон; Ғизо; Ҳама чиз; Ӯ; Тоҷикӣ; Рӯдакӣ; мағоза; фармоиш; расонидан.
- Verify Қ қ Ҳ ҳ Ҷ ҷ Ғ ғ Ӯ ӯ Ӣ ӣ at 400/500/600/700/800/900. No synthetic bold or font-family changes.
- Preserve RU/TJ/EN preferences and `html lang="ru"/"tg"/"en"`. Do not translate live address values into invented facts.

## 4. Color and surfaces

Keep Paykar green **#00a82d** and existing dark/light semantic palette. Use existing `--ink`, `--muted`, `--surface`, `--line`, `--brand-ink`, `--on-accent` rather than introducing route-specific colors.

| Surface role | Treatment |
|---|---|
| Page | Existing near-black / paper background; no new decorative wash |
| Primary group | Neutral surface, subtle 1px boundary |
| Secondary group | Quiet tonal area or divider; usually no separate border/shadow |
| Interactive card | Same neutral base; stronger boundary on hover/focus |
| Selected | Subtle green tint plus clear selected indicator/text |
| Overlay | Opaque or near-opaque panel and current scrim; readable underlying separation |

Radius roles for **migrated** components: major feature/panel 24px; ordinary card 18px; image stage 12–16px; controls 12px; small badge/pill fully rounded. Hero's existing 32px silhouette can remain a deliberate exception. Do not modify the root radius alias until protected consumers have been checked.

One outer border per decision group. Price inside product information can use spacing/divider instead of a second card. Explanatory text does not need a tinted box unless it is a notice.

Ordinary cards use the existing subtle card shadow or none in dark mode. Reserve floating shadow for menus/dialogs. No default green glow on every card. Noninteractive content must not lift on hover.

Keep visible focus: 2px semantic focus ring, offset from the control, adequate contrast in both themes. Do not rely on color alone for selected/error/stock state.

## 5. Four card families

| Family | Structure | Where / exceptions |
|---|---|---|
| Product Card | Image + sale/save affordance → name/unit → price → Add/quantity | Catalog, promos, saved, recommendations. Preserve shared component and behavior. |
| Shopping Card | Real product previews → title/status → count/current estimate → primary action + quiet alternatives | Orders, templates, curated sets. Reuse accepted overview direction. |
| Information Card | Optional small icon → concise title → readable content → optional quiet link | Support, delivery/payment explanations. Default is content-sized, not promotional. |
| Compact Utility Card | Title + optional small preview/icon → short description → one destination | Homepage Promos/My Shopping, contextual shortcuts. Preserve recent hero work. |

Product rows in cart/template/confirmation are a compact presentation of existing product data, not a fifth independent card personality. Keep image, name, metadata, price and controls aligned. Do not force a price where a persisted template row does not yet have one; preserve loading/unavailable states and existing data boundaries.

For sparse latest orders, let preview width depend on actual preview count; do not reserve a collage-sized void for one item. Keep current estimate labels and stock limitations next to the relevant action.

## 6. CTA hierarchy

- **Primary:** green fill with existing dark on-accent text. The action that advances this decision: Add, repeat, save editor changes, calculate delivery or submit at the appropriate stage.
- **Secondary:** neutral surface/outline. Alternate useful action: save as template, edit, continue browsing.
- **Tertiary:** text with a small arrow when it means navigation. No oversized icon tile or surrounding card solely for the link.
- **Destructive:** restrained semantic danger treatment; preserve accessible name and existing safeguards. Do not make Remove compete with Save.

Normally one green action inside a small card. Product grids may legitimately have one Add per product. Independent checkout stages may each have their own primary action; do not merge their behavior.

Minimum interactive target: 44×44px. Standard form/action height: 48px; existing compact quantity controls may remain 44px; hero can remain 56px. Mobile text inputs should be at least 16px. Stack long actions full-width on narrow screens; leave tertiary links visually quiet.

## 7. Status

Use one compact badge grammar: 12–13px medium/semibold text, 6–8px inline padding, 4px block padding, optional 14px icon, text always present when needed for meaning.

| Meaning | Treatment |
|---|---|
| Order state | Neutral by default; green only for a genuine success/completion meaning |
| Availability | Compact green text/tint when available; neutral when unavailable; retain quantities/warnings |
| Promotion | Existing percentage/old-price semantics, green commercial emphasis |
| Delivery state | Neutral before quote; green for valid calculated result; warning for stale/invalid result |
| Failure | Existing error/warning color plus text and recovery action |

Do not reinterpret order status semantics or substitute a display badge for validation. Never communicate quote validity solely through animation/color.

## 8. Product imagery

- Keep current grid image ratio ~**1.14 desktop / 1.08 mobile** until anchor comparison justifies a change; it supports the accepted card geometry.
- Use the shared neutral pale stage in both themes.
- **Verified packshot:** `object-fit: contain`, 12–16px breathing room, entire package/produce visible.
- **Existing editorial/category photo:** intentional `cover` crop in category/hero/article context. It must not silently imply an exact SKU match.
- **Missing exact product image:** retain an honest category/fallback treatment without inventing packaging. Use only already verified assets in this pass. Document unresolved image sourcing separately.
- Do not globally change all `.product-image` rules from cover to contain: those selectors also serve hero/category-like sources, cart and detail.
- Thumbnails: 64px standard, 56px dense mobile, up to 80px for cart. Preview strips retain the accepted overlapping/grouped treatment and truthful +N count.
- Maximum four preview images where current components already support it. Never duplicate an image to fill a missing item.
- Keep alt text, image-failure handling, aspect-ratio reservation and existing lazy-loading behavior.
- Detail image may be smaller on mobile to bring price/action forward; no crop of essential product content.

## 9. Page and section headers

Page: breadcrumb → title and optional one-sentence description → content. Optional eyebrow only if it adds context not repeated by breadcrumb/title. Put page-level actions alongside the heading on desktop and below copy on mobile.

SectionHeader remains the shared implementation authority:
- title first; optional eyebrow above;
- description immediately below, max 60–70ch;
- one quiet destination aligned with title baseline on desktop;
- wrap destination below on mobile without shrinking text;
- no compulsory icon, eyebrow or action.

Promos and Saved use a compact commerce intro. Information pages may retain a meaningful illustration, but an illustration is not permission for an oversized shopping-page hero.

## 10. Responsive composition

- Preserve existing catalog/product-grid breakpoints and 5/4/3/2 behavior unless anchor evidence shows a specific defect.
- Shopping cards retain 3 → 2 → 1; rows collapse image/identity above controls without separating quantity from the item.
- Product detail: desktop image/purchase columns; mobile identity, compact image, purchase, then secondary information. Do not introduce a new sticky bar.
- Catalog mobile: preserve category rail and every filter/sort control. Reduce redundant intro padding and organize existing controls into compact rows; no new filter logic.
- Header: use a deliberate utility-label breakpoint, preserve accessible names/counts, keep search usable, retain drawer language/theme access.
- Mobile nav stays Catalog → My Shopping → Promos → Cart; checkout remains without bottom bar. Keep safe-area clearance.
- Cart/checkout stack summary after relevant content under existing breakpoint; preserve field labels/errors, anchor focus and map mounting.
- Articles keep the narrow reading column. Mobile images should support rather than postpone reading.
- Test wrapping at 320/390/768/1024/1440. Do not trade overflow for clipped Tajik glyphs or undersized controls.

## 11. Motion

| Role | Proposed default |
|---|---|
| Color, border, press feedback | 140–180ms |
| Ordinary panel/menu transition | 180–220ms |
| Section entry | 240–360ms, 8–12px maximum travel, once |
| Actionable-card hover | 0–2px lift or boundary change, not both glow and large lift |
| Theme wave / phone journey | Keep accepted choreography and timings |
| Reduced motion | No travel/tilt/decorative loops; immediate usable content |

Retain existing ease-out `cubic-bezier(0.22,1,0.36,1)`. Do not change shared timing defaults until caller audit shows maps/phone are insulated. Reduce decorative floating empty icons, pulsing state halos and noninteractive panel lifts first. Keep loading indicators understandable; never hide failure behind an animation. Theme and phone may be deliberate exceptions to ordinary motion timings.

## 12. Fresh, loading and error states

- Keep page identity and context when Saved or Cart is fresh.
- Present a compact useful next action using existing Catalog access; do not lead with a giant absence statement.
- My Shopping keeps curated sets/contextual creation without fake history/templates.
- Successful empty supplementary promos/recommendations disappear. Dedicated filtered catalog retains useful clear-filter/Catalog recovery.
- Loading reserves the intended content shape; generic four-card skeleton should not dictate the final five-column design.
- Failure remains visible, scoped to its section, with existing retry. A failed promo request must not suppress categories/everyday products.
- Storage failure, unavailable products, stale prices/quote and sandbox disclaimers remain visible.
- Preserve live-region semantics and error focus. Visual convergence does not alter state machines.

## Implementation contract

Use incremental opt-in classes/token aliases and existing shared components. Remove old selectors only after proving no remaining consumer needs them. No global CSS rewrite, new abstraction hierarchy, new dependency, API contract or storage change.

Anchor approval must validate these rules in both themes before route propagation. See [implementation plan](implementation-plan.md) for gates and protected-file checks.
