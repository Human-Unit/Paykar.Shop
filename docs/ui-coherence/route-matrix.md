# Route-by-route coherence matrix

Status: **audit and proposed changes only**. No route has been redesigned during this task.

Evidence scope: Homepage, milk Product Detail and populated My Shopping have all four requested width/theme anchor captures. Other listed rendered examples have 1440 dark RU and 390 light RU captures unless marked source-only. See [screenshot index](screenshots/README.md). Route loading and measured layout are not equivalent to completed functional acceptance.

## Commerce and shopping routes

| Route / inspected example | Current strengths | Current problems | Canonical pattern / proposed change | Protected behavior |
|---|---|---|---|---|
| `/` | Clear pending hero CTA; distinct eight-section narrative; genuine sale products; image-led discovery | Promo watermark/tints create another card personality; section framing varies; mobile hero consumes most of first view | Retain pending hero; unify SectionHeader/gaps, quiet promo framing, align utility/product sections. Keep all eight sections in current order | Independent sale request; successful empty hides; failures/retry visible; phone, map/directory internals untouched |
| `/catalog` | Shared cards; search, sort and rich filters; readable desktop sidebar | Mobile first product ~624px; title/count/category rail/toolbar consume significant space | Compact commerce intro, consistent control heights and gaps; preserve category rail and full filter access | Query parameters, request state, pagination, filters, sorting, counts, cart/saved controls |
| `/catalog/[slug]` — dairy | Breadcrumb context; shared catalog implementation | Additional category copy pushes mobile first product to ~688px | Same compact intro/toolbar; keep category identity; remove presentation-only duplication | Slug/category semantics, active Catalog matching, request/error handling |
| `/product/[slug]` — milk | Clear price/stock/cart affordance; useful enrichment; connected products | Nested panels; large category photograph; orphan enrichment grid cell; mobile cart action below initial viewport | Product anchor: compact purchase hierarchy and deliberate description/specification layout; truthful image treatment | Exact product facts/disclaimers, stock limits, cart, manual connections, ID deduplication, visible errors |
| `/product/[slug]` — dish-soap | Household specifications show enrichment is not nutrition-only | Same panel/layout issues; generic household photograph | Same anchor must support specifications as well as food/nutrition; do not force food labels | Existing household content, related products, unavailable/error states |
| `/saved` — populated | Actual product grid; bulk-add and clear controls | Large intro competes with products; action styles differ from workspace | Compact page header plus toolbar, canonical ProductCard | Saved IDs/storage, stale-item removal, bulk-add stock validation, warnings/errors |
| `/saved` — fresh | Useful Catalog action already exists | Giant “nothing saved” card replaces normal page context | Keep page identity, short positive explanation and Catalog action; no fake saved items | Fresh state distinction, storage failure visibility |
| `/cart` — populated | Images, inline quantity, clear totals and recommendations | Intro consumes mobile space; summary and row surfaces differ from shopping workspace | Compact intro and shared product-row visual rules; retain summary composition | Persistence, quantity/removal, stock checks, pricing, checkout link, suggestions |
| `/cart` — fresh | Catalog recovery | Oversized absence-focused state | Compact next-action state under retained page identity | No fabricated cart; errors distinct from empty |
| `/checkout` | Logical form stages, map, order summary, visible payment choice | Large title/step band/panels delay first fields; bright stage tokens compete | Align form title/spacing/control roles, quiet completed stage treatment without changing state meaning | Fields/validation/focus, delivery map/ORS, quote invalidation, payment sandbox, cart-preservation/submission logic |
| `/order/[id]` — existing test order | Confirmation readable; totals and repeat/save access | Large success hero precedes order; full capability ID visually prominent; text-only product rows; repeated save-link guidance | Compact confirmation header, quiet but complete ID, shared row/status/action grammar; preserve all data | Reload, capability URL, payment/status, history registration, repeat/save, no new order required for QA |
| `/my-shopping` — populated | Strong visual workspace; conditional history/templates, current estimates, curated cards | 1280px inner alignment; sparse latest-order preview wastes width; card action spacing | Retain accepted structure; align outer edge and use content-sized previews, shared headings/actions | Conditional sections, real IDs, all-orders access, current-price/stock previews, repeat/save/edit/bulk-add and persistence |
| `/my-shopping` — fresh | Useful curated sets; contextual creation; no fake history | Intro and cards somewhat tall, but direction already correct | Light coherence only; preserve useful content | No pointless personal empty panels, warnings/API errors |
| `/my-shopping/templates/new` | Focused named template and real product picker | Older form controls, text-heavy picker, large empty workspace | Same page intro and form rules; compact image-led product rows where data already exists | Creation, search/picker, quantity/removal, save, storage warnings |
| `/my-shopping/templates/[id]` — personal | Explicit quantity and remove; editable name | Admin-like rows; name and controls far apart; oversized right void | Bring identity/quantity/actions together, reuse existing product preview data; keep purposeful form width | Stable IDs, editing/saving/deleting, preview errors, storage schema |
| `/my-shopping/templates/curated-family` | Real item list, availability and quantity; manual curated meaning | Text-only detail loses overview's grocery identity; mobile columns squeeze names | Shared product row, wrap metadata; retain current-price estimate and existing actions | Manual set contents, current stock/prices, bulk-add, no fake personalization |
| `/promotions` | Genuine old/new prices, sale badges, cart actions | Framed intro plus framed count strip before first product | Compact commerce intro/count with shared grid; remove redundant decorative framing | Real sale endpoint, pagination, filters applied by endpoint, cart; useful Catalog action if empty |

## Physical stores, help and company

Keep/remove boundaries below preserve the earlier shopping-first cleanup. Changes are presentation/copy consolidation, not another content rewrite.

| Route | Keep | Remove/change | Pattern | Protected behavior |
|---|---|---|---|---|
| `/stores` | Actual configured address and single-store map, external map access | Clarify that current page shows configured store; reduce surrounding generic prose/tinted icon framing | Compact page intro, InformationCard | `store-map.tsx`, mounting/config/coords/styles/popups/gestures unchanged. Full home network is a separate implementation; do not move it |
| `/contacts` | Real existing address and truthful support instructions; Find store action to `/stores` | Tighten gaps/panel framing; do not make generic “contact” claims imply nonexistent channels | Concise contact/support content | **No map here**; no invented phone/email/hours/policies; configured address/error handling retained |
| `/how-to-buy` | Complete six-step purchase instructions, payment context, final Catalog action | Quiet repeated title/eyebrow treatment; align steps instead of adding journey previews | PageIntro + StepFlow + compact final action | Complete factual instructions, RU/TJ/EN, no duplicated mini-journey/FAQ restoration |
| `/delivery` | Identity, supplied route illustration, benefits, destination → calculate → confirm sequence, CTA, pricing/ETA/stale-quote FAQ | Common typography/spacing; reduce decorative green/loop competition only after visual comparison | InformationCard, shared title/section rules; illustration exception | No geographic map refactor; preserve delivery facts and quote semantics, no promises invented |
| `/payment` | Cash and sandbox-card options; warnings, recovery, test-flow steps | Reduce nested hero/payment mock-card framing and repeated generic eyebrow; do not remove sandbox warning for visual cleanliness | Compact intro, InformationCard, StepFlow | No real gateway claims; failure recovery and test scenarios preserved |
| `/returns` | Practical steps and Contacts action | Repeated “Обсудите решение” step/final heading; align step spacing | StepFlow and quiet support action | No invented return guarantees, policy deadlines or legal claims |
| `/about` | Introduction and feature content | Reduce generic green tiles/oversized intro where it delays substance; no extra shopping banner | PageIntro + InformationCard | Truthful content, branding, existing destinations |
| `/brands` | Honest manufacturer-information explanation and Catalog access | Generic category collage should not imply a real brand directory; simplify presentation | Compact information page | No invented brands or new brand-search functionality |

## Editorial and boundary states

| Route | Current strengths | Current problems | Proposed change | Protected behavior |
|---|---|---|---|---|
| `/blog` | Featured article and readable image-led cards | Large intro/feature; repeated grocery-bag asset competes with homepage | Shared intro and card radius/spacing, retain editorial hierarchy | Existing article routes/content, no new CMS |
| `/blog/weekly-shopping` | 820px readable column; practical sections | Hero photo postpones body on mobile; repeated numbered treatment | Keep reading width, quiet metadata, smaller supporting mobile image/spacing | Article content, related reading, actions |
| `/blog/fruit-and-vegetables` | Topic-relevant produce image and storage guidance | Same inherited editorial spacing/number style | Same article template; retain truthful guidance | No exaggerated food/health claims |
| `/blog/delivery-guide` | Useful delivery explanation and links | Bag photo weakly distinguishes this from shopping article | Prefer an existing truthful topic asset if available, otherwise keep honest generic image; common article rhythm | Route/pricing explanation and destination links |
| `/blog/checkout-checklist` | Practical pre-order checklist | Same intro/image scale and repeated decorative numbers | Common article template and quieter structure | Contact/quote/confirmation guidance remains |
| Unknown route — `/audit-route-does-not-exist` | Clear recovery to shopping | Large decorative state dominates | Compact recovery state with shared page identity | Correct not-found behavior and links |
| Request failures / `app/error.tsx` / component loading | Shared Failure with retry and accessible status; purpose-specific skeletons | Generic large state treatment can dominate a small failed section | Inline/section scale matching owner; retain retry/errors and skeleton structure | **Source audit only** for induced failures; no audit-time fault suite claimed |
| Missing product/category/order/template variants | Existing handlers/recovery | Need visual consistency with route identity | Reuse shared scoped state rules | **Source audit only**; later targeted fixtures/interception, not fabricated success |

## Shared surfaces beyond individual routes

| Surface | Evidence / strength | Proposed coherence work | Preserve |
|---|---|---|---|
| Desktop header | Four clear primary destinations; search/counts/preferences | Resolve Saved text truncation, consistent utility sizing | Sticky header, active route rules, search keyboard flow, counts/preferences |
| Catalog mega-menu | Opaque multi-column category groups with images | Only shared radius/typography adjustments if necessary; no new layout concept | Hover/click/keyboard, close/focus restoration, hierarchy/API/error state |
| Drawer | Shopping, Customer Help, Company groups; mobile preferences | Current neutral grouping is a canonical pattern; tighten only if measurements justify | Dialog semantics, focus/scroll lock, all links |
| Mobile bottom bar | Four shopping-first actions and active states | Retain composition; verify long labels/safe area | Hidden on checkout, cart count, deep-link active matching |
| Footer | Supporting navigation and real address | Shared headings/spacing; keep secondary emphasis | Existing real details, RU/TJ/EN, no invented support channels |
| Home store network | Eight real source entries, visible labels and directory | Surrounding rhythm only | Component/CSS, selection, labels, popups, gestures, coordinates, tile attribution |
| Order phone | Accepted product-led service storytelling | Surrounding section alignment only | Journey stages, interaction, timing, localization and reduced motion |

## Evidence interpretation

The dedicated Stores page and the homepage network were both rendered; Contacts had zero Leaflet containers at desktop/mobile. This verifies current separation, not every map gesture. The audit did not create an order or change templates. Isolated fixture data is described in [audit.md](audit.md); confirmation redaction is intentional.

Recommendations here are bounded by the [design system](design-system.md). If a route would require new data, new behavior or map relocation to meet a visual idea, record it as a future opportunity instead of expanding this pass.
