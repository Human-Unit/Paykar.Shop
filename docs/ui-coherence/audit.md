# Paykar UI coherence audit

Status: **AUDIT / PROPOSAL ONLY — awaiting implementation approval**
Date: 2026-10-07
Checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop-main`
Baseline: `main` at `9b72b2a7a0abd1e03161bf7d6651816209e7a27c`, including the pending homepage-hero changes.

## Assessment

Paykar has a recognizable grocery identity, useful commerce behavior, and several strong components. It needs convergence rather than another visual concept. The largest gaps occur between related experiences: visual shopping cards lead to text-heavy template editors; product photography leads to a database-like details panel; concise navigation leads to oversized page introductions.

The proposed direction is **product-led, neutral, compact where users act, spacious where users discover**. Preserve the current logo, bundled Noto Sans, green, dark/light palette, homepage narrative and accepted behavior. Reduce decorative framing and give related routes the same layout grammar.

This audit changes documentation only. No branch, commit, push, application source change, dependency installation, database mutation, checkout submission or new order was made.

## Evidence and limits

- Inspected the actual source and running Docker storefront at `http://localhost:3000`, backed by the API at port 8080. Frontend, API and PostgreSQL were healthy at inspection.
- Captured Homepage, milk Product Detail and populated My Shopping at **1440 dark/light and 390 dark/light**, RU: 12 anchor screenshots.
- Captured 25 additional route/state examples at 1440 dark RU and 390 light RU: 50 screenshots, with headings, page height, overflow and map-count measurements.
- Added 23 detail, fresh-state, navigation and lower-homepage captures: **85 PNGs total**. See [evidence index](screenshots/README.md), [measurements](evidence.json).
- Visually reviewed representative images across all three anchors, commerce, catalog, public pages, editorial, maps, navigation and fresh states. The route sweep provides DOM/source coverage plus screenshots; it is not a full interaction acceptance run for every route.
- Populated screenshots use isolated browser local-storage fixtures with real API product IDs, an existing local template and existing persisted test orders. Fresh states use clean isolated contexts. Existing user browser storage was not changed.
- Confirmation evidence masks the full order identifier and customer-details block. Pink masks are evidence redactions, not UI defects.
- Captures use reduced motion to stabilize layout. Normal-motion findings below are source-based, not a claim that a complete animation cycle was retested.
- No horizontal page overflow was measured in the 62 anchor/route captures. This does **not** prove 320px, tablet, all-language or interaction-state acceptance.
- This is a RU visual baseline. TJ/EN, full 30-case matrix, fault interception and commerce regression belong to the later implementation gates.
- Lint, format, typecheck, build, unit suites and Docker rebuild were intentionally **not run**, as requested for this audit-only phase.

## Current design architecture

| Area | Existing authority | Consequence |
|---|---|---|
| Import/cascade | `apps/web/src/app/globals.css`: vendor and legacy layers, then current unlayered feature styles | Keep the layering. Removing legacy files wholesale would remove live layout/palette rules. |
| Palette | `app/paykar-theme.css`, consumed by `styles/tokens.css` | Existing theme variables should remain the authority; no parallel palette. |
| Layout/shape | `styles/tokens.css`: 1320px container, 32/24/16 gutters, 72/60/48 section rhythm, several radii | Good foundation; individual modules and page styles diverge from it. |
| Typeface | Bundled variable Noto Sans Latin/Cyrillic, 100–900 | Preserve family, glyph coverage, weights and language persistence. |
| Shared patterns | `components/page-patterns.tsx`, `styles/components.css` | SectionHeader, PageIntro, steps, FAQ and CTA exist; not every route uses them consistently. |
| Product merchandising | `product-card.tsx`, `styles/shop.css` | Reused cards/actions work well; ProductImage also owns demo image substitution. |
| Product detail | `product-detail.tsx`, `catalog.css`, legacy `site-polish.css`, `product-content.css` | Old two-column description layout remains active under newer enrichment content. |
| Shopping workspace | `my-shopping.tsx`, `my-shopping.module.css`, related template components | Overview is visual; editor/detail styles retain an older text/form layout. |
| Navigation | `lib/navigation.ts`, shell, site-navigation, Catalog mega-menu, chrome styles | Canonical shopping-first destinations already exist. Preserve model and interaction logic. |
| Public pages | `store-pages.tsx`, `delivery-page.tsx`, `styles/pages.css` | Shared information patterns coexist with a separately scaled Delivery layout. |
| Motion | `motion-primitives.tsx`, motion/premium-motion/theme-wave CSS | Shared reveal defaults are 560ms/18px; CSS durations are 140/220/360/620ms; decorative loops remain. |

File size is not itself a defect. The important evidence is overlapping ownership: the product-description grid lives in the legacy layer while newer files style its surface and appended content.

## Prioritized findings

P0 means a **coherence blocker**, not a broken transaction or production incident.

| ID | Priority / class | Observed issue and evidence | Proposed response |
|---|---|---|---|
| C01 | P0 · layout/content | Product enrichment occupies the left cell of a full-width two-column panel; most of its lower right area is blank. [Detail panel](screenshots/coherence-product-info-1440-dark.png). Legacy `site-polish.css:475` defines the grid; `product-content.css` does not place the new block across it. | Explicit description/specifications composition; balanced desktop columns or full-span enrichment. Keep every supplied fact/disclaimer. |
| C02 | P0 · journey/cards | Visual My Shopping overview opens text-only template rows with distant quantity/remove controls. [Overview](screenshots/coherence-shopping-curated-1440-dark.png), [editor](screenshots/coherence-template-edit-1440-dark.png), [curated detail](screenshots/coherence-template-curated-390-light.png). | Reuse image-led shopping-row presentation using already loaded product data. Preserve editor operations and schemas exactly. |
| C03 | P1 · density/responsive | Introductions and stacked chrome delay shopping. Mobile catalog first product starts at ~624px; category at ~688px. Promo products start at ~623px on desktop. Milk purchase action is below the initial 390×844 viewport. [Catalog](screenshots/coherence-catalog-390-light.png), [promos](screenshots/coherence-promotions-1440-dark.png), [product](screenshots/coherence-product-390-light.png). | Compact commerce introductions/toolbars; compose mobile product identity and purchase before secondary service detail. Do not hide filters or shrink touch targets. |
| C04 | P1 · imagery | Category placeholders substitute for specific items: milk/cheese represents yogurt, bakery collage represents individual rolls, household bottles represent bin bags. Ready-made breakfast repeats the same dairy image. [Promos](screenshots/coherence-promotions-1440-dark.png), [curated cards](screenshots/coherence-shopping-curated-1440-dark.png). Source: ProductImage in `product-card.tsx`. | Distinguish verified SKU imagery from category fallback. Audit existing assets; use truthful fallback when exact imagery is absent. No invented packshots or product claims. |
| C05 | P1 · hierarchy/surfaces | Product detail nests a framed purchase area inside another framed panel, then adds tinted delivery copy and two framed service links. Other routes use large green-backed intro/status blocks. [Product](screenshots/coherence-product-1440-dark.png), [payment](screenshots/coherence-payment-390-light.png), [confirmation](screenshots/coherence-confirmation-1440-dark.png). | One clear surface boundary per group; quiet supporting rows; primary CTA remains dominant. |
| C06 | P1 · states | Fresh Saved and Cart replace the page identity with large negative empty-state cards. A useful Catalog action exists, but absence dominates. [Saved](screenshots/coherence-saved-fresh-390-light.png). My Shopping already uses useful curated content. | Preserve title/breadcrumb and present a compact positive next action. Do not fabricate personal content. Keep request failures visibly distinct. |
| C07 | P1 · navigation/content | Home contains an eight-store directory; `/stores` contains one configured store. Contacts correctly has no map. [Home network](screenshots/coherence-home-stores-1440-dark.png), [Stores](screenshots/coherence-stores-1440-dark.png). | Clarify surrounding labels using known facts. Record directory ownership as a separate product decision; do not move, merge or refactor either map in this pass. |
| C08 | P2 · typography/alignment | Page titles vary between workspace 40px, PageIntro up to 52px, Delivery up to 68px; workspace is 1280px within a 1320px shell. | One page-title scale and outer alignment; explicit hero/editorial exceptions. |
| C09 | P2 · navigation | Saved label is ellipsized even at 1440px. Mobile has a constrained search between utility controls. [Header](screenshots/coherence-home-1440-light.png), [mobile](screenshots/coherence-catalog-390-light.png). | Budget control widths deliberately; use existing icon/accessibility treatment at the appropriate breakpoint rather than a half-visible word. Preserve search and counts. |
| C10 | P2 · cards/space | One-item latest order reserves a large thumbnail column; sparse curated cards retain substantial space before actions. [Workspace](screenshots/coherence-shopping-1440-light.png). | Content-sized preview allocation; shared action baseline without arbitrary minimum heights. Never add fake images/items to fill space. |
| C11 | P2 · motion | Floating empty-state icons, repeated glow/float loops and hover lift on informational panels compete with meaningful feedback. Source: `components.css`, `pages.css`, `motion-primitives.tsx`. | Remove decorative state loops; shorten ordinary reveals and limit lift to actionable surfaces. Keep accepted theme wave and phone journey behavior. |
| C12 | P2 · editorial/support | Returns repeats “Обсудите решение” as step and final action heading; articles reuse the homepage bag image; support pages often carry a generic “Покупателям” eyebrow even when the title is enough. | Simplify redundant presentation/copy; retain factual instructions, article contents and honest imagery. |

## Strongest existing patterns

1. **My Shopping overview**, especially curated/personal image previews, estimates, conditional personal sections and primary/secondary/text actions. This is the strongest product direction, though sparse-card density needs tuning.
2. **Shared ProductCard**: image, price, useful sale/availability state, saved control and inline quantity action. Keep its recognizable shape and behavior.
3. **Pending homepage hero**: the grocery bag, clear Catalog action and quieter delivery link are a sound baseline. Preserve this work; do not restart the hero redesign.
4. **Shopping-first navigation and drawer grouping**: Catalog, My Shopping, Promos, Stores with supporting links elsewhere. The opaque mega-menu is useful and legible.
5. **Delivery's explanatory sequence**: destination → calculation → confirmation, with truthful pricing/ETA/stale-quote information. Preserve its illustration and logic while aligning common spacing/typography later.

## Anchor directions

### Homepage

Retain Hero → Promos → Categories → Everyday products → My Shopping → Phone → Stores → Blog. Use the existing hero, not a new composition. Let sale prices/product photography communicate urgency; reduce the large percentage watermark and repeated green washes. Align section headers and product rows. Categories remain image-led discovery, not a second promo personality. My Shopping remains one compact shortcut. Frame phone and maps with the same outer rhythm without touching their internals. Blog remains visually secondary editorial content.

### Product Detail

Keep image and a clear identity/purchase stack on desktop. Remove nested framing around price; keep one primary Add/quantity action. Place delivery/payment links as quiet support. Make description, specifications/nutrition and use/features an intentional composition with no orphan grid cell. On mobile show product name, compact complete image, price, stock and cart action before support copy. Do not add sticky buying UI, tabs or new features. Preserve manual connections and ID-based deduplication.

### My Shopping

Keep Latest order → Personal templates → Ready-made baskets when personal data exists; keep useful curated content and contextual creation when it does not. Align the workspace to the global container, tighten sparse previews and standardize headings/actions. Carry its existing visual language into template detail/editor using existing data, without changing current-price preview, save, repeat, bulk-add, warnings or persistence.

## Explicit answers to the eleven audit questions

1. **Five biggest reasons it feels unfinished:** older detail/editor layouts beneath newer surfaces; inconsistent page-intro/spacing scales; repeated category images presented as distinct products; too many nested/tinted groups; mobile compositions that delay the main task. C01–C05 give evidence.
2. **Strongest page/component:** My Shopping overview's image-led cards and conditional content, followed by shared ProductCard. Their logic and direction should survive.
3. **Canonical patterns:** 1320px shell, Noto Sans, shared ProductCard, visual ShoppingCard, quiet InformationCard/utility row, SectionHeader, one primary CTA per decision group, purposeful fresh state.
4. **Delete:** orphaned layout overrides after migration, repeated nested surface wrappers, oversized absence-focused states, repeated generic eyebrows, redundant support banners, purely decorative state loops. Do not delete useful text, error states or legacy files wholesale.
5. **Green overuse:** promo watermark/wash/context bar, stacked product service accents, informational icon tiles and confirmation background compete with CTA green. Keep green for price/sale cues, actions, selected state and meaningful status; maps/phone remain protected.
6. **Wasted space:** product facts lower-right blank area, template editor's distant controls/right-side void, fixed preview allocation for one-item orders, promo intro + count panel, oversized fresh-state card. Reading-width article margins are intentional, not waste.
7. **Admin-like pages:** template editor and curated-template detail most clearly; expanded product facts and text-only confirmation rows to a lesser degree. Their information is useful; presentation should become more product-led.
8. **Mobile inconsistency:** unrelated breakpoints/scales, stacked desktop surface hierarchy, oversized intro/image blocks, different form/control heights and header width competition. No overflow was observed in sampled routes; density and priority are the larger issue.
9. **Useful animation:** drawer/menu orientation, cart feedback, restrained first reveal, accepted theme wave and order journey. Maintain reduced-motion alternatives.
10. **Reduce/remove:** infinite empty-state floating/pulsing, noninteractive panel lift, repeated decorative glow and button sheen. Shorten ordinary 560ms reveals; do not retime the phone/theme choreography as part of token consolidation.
11. **Highest leverage:** establish shared intro/spacing/surface rules; fix product enrichment composition; bring template rows into the workspace language; clarify fallback imagery; prioritize product/price/action on mobile. Validate anchors before propagating.

## Protected boundaries and risks

- No changes to backend, contracts, migrations, pricing, stock validation, storage keys/schemas, cart, templates, order history, ORS, payment or quote rules.
- Preserve real failures, retry actions, stock warnings, sandbox labels, demo disclosures and approximate nutrition qualifications.
- No map component, mounting, coordinate, Leaflet selector, label, popup, marker, gesture or directory-selection changes. Surrounding alignment must not alter map dimensions unexpectedly.
- Preserve phone journey, theme wave, RU/TJ/EN persistence, `ru/tg/en` document language, bundled Cyrillic coverage and reduced motion.
- Shared `--radius`, surface, font and motion tokens affect protected consumers indirectly. Prefer scoped aliases and opt-in migration over global overrides.
- Product asset accuracy is a content dependency. CSS cannot create a truthful product photograph.
- Runtime data may change. Compare future screenshots with equivalent fixtures, not stale prices/counts.
- Existing hero edits are uncommitted; preserve them and review against this baseline, not just HEAD.

## Future product opportunities — not in this implementation

- Decide whether the full physical-store directory should eventually live on `/stores`; this requires explicit scope and map acceptance.
- Obtain verified product-specific photography where current assets are only category illustrations.
- Any new product-saving controls, sticky purchase bar, account system or personalized recommendations require separate product approval.

## Deliverables and next step

- [Proposed design system](design-system.md)
- [Route matrix](route-matrix.md)
- [Dependency-aware implementation plan](implementation-plan.md)
- [Screenshot index](screenshots/README.md), [measurements](evidence.json)
- [Source baseline](source-baseline.json), [integrity result](integrity-result.json)

**Stop here. Implementation begins only after approval of the proposed rules, anchor directions and phased scope.**
