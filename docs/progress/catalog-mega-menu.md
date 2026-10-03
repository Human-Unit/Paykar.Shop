# Catalog mega menu

Date: 2026-10-02. Scope: shared catalog navigation and frontend presentation.

**CATALOG MEGA MENU — IMPLEMENTED**

**VISUAL / INTERACTIVE ACCEPTANCE — PENDING**

No commit or push was performed. Earlier uncommitted commerce, payment, branding, delivery-page and documentation changes were preserved.

## 1. Behavior

The desktop catalog link now reveals a full-width category panel on hover or keyboard focus. It remains a normal link to `/catalog`. Pointer departure schedules closure after 150ms; re-entry cancels that timer. Keyboard focus inside the wrapper keeps the panel open until focus leaves, an explicit close or navigation occurs. Moving between trigger and panel does not immediately dismiss it.

Escape closes the panel both when focus is inside it and when it was opened by hover while focus remains elsewhere. Outside pointer clicks, focus leaving the wrapper, item navigation and a route change also close it. The catalog and information disclosures share one active state, so opening one closes another. A delayed catalog close cannot accidentally dismiss an information panel opened afterward.

The information architecture was informed by the category groups and nested links in [Paykar's public catalog navigation](https://paykar.shop/), inspected through the public page content. Live interaction on the original site was not browser-verified. The implementation uses our catalog, imagery, theme and layout rather than copying the original taxonomy or visual assets.

## 2. Trigger logic

`CatalogMegaMenu` renders the existing green catalog link, grid icon and a small absolute-positioned chevron. Its existing padding/minimum height remain governed by the shared navigation styles; the chevron does not participate in width calculation. It rotates when expanded. Actual header/button dimensions still need browser measurement.

The link exposes `aria-expanded` and `aria-controls`. ArrowDown reveals the panel and schedules focus on its first link after rendering. Ordinary click/Enter retains normal link navigation. All catalog links disable Next.js prefetch, so revealing the panel does not automatically request category/product pages.

The controlled state includes the pathname, which prevents a disclosure from remaining open after navigation. Timers, animation-frame callbacks, outside-event listeners and resize observers are cleaned up appropriately. Focus restoration suppresses the resulting trigger focus event so Escape does not immediately reopen the menu.

## 3. Category source and navigation targets

Actual groups and descendants come from the same existing `GET /api/v1/categories` endpoint used by home/catalog. The live data contains **seven categories: six roots and one real fruit child**. Grouping uses `id`/`parent_id`, handles deeper/unsorted descendants and avoids revisiting IDs. Every real category link uses its actual slug, safely encoded in `/catalog/{slug}`.

Category images were moved from the existing home component into shared `category-presentation.ts`; the same six local WebP images continue to serve home and navigation. Unknown categories receive a grid icon instead of a broken image.

Additional product-family labels are small presentation metadata keyed by existing category slugs. They link to the supported category route with the existing `q` search parameter. For example, Milk links to `/catalog/dairy?q=Молоко`. This uses the current product search/filter behavior; it introduces no database categories, pretend category IDs, unsupported subcategory route or ignored `subcategory` parameter. Real descendants appear before these shortcuts. Matching real labels are not duplicated.

The runtime check verified **all 30 product-family searches** returned matching products in the appropriate real category. The fruit link uses the real `/catalog/fruit` route. All seven actual category routes returned HTTP 200. No product catalog is fetched by the menu. Desktop category metadata loads when the shared navigation mounts, independently of open state, and is reused across hover/focus changes. Retry is an explicit action if loading fails. At mobile widths the menu's category resource is disabled.

Labels are localized; search terms remain the stable terms matching the current backend product names. No search implementation, product filtering rule, category endpoint, seed or schema was changed.

## 4. Desktop layout and layers

The panel is absolutely positioned immediately below the navigation and fills the existing shared container width. It uses the 1440px maximum width and responsive gutters already applied to the header. The panel uses elevated theme surfaces, subtle borders, green accents and a restrained shadow.

Above 1100px the grid has four columns; from 769–1100px it has three. Each group has a 64px local image, bold parent link and smaller muted descendant/search links. Images reduce to 56px on smaller desktop/tablet layouts. Links wrap and turn to the theme-aware green on hover/focus. The corresponding parent group is subtly highlighted when viewing it or a real descendant; exact real category links expose `aria-current="page"`.

Each group renders at most eight child/shortcut links, followed by “+ Ещё” linking to the parent when additional entries exist. The current longest group has seven entries. No expansion widget or unsupported category filtering was added.

The maximum panel height is calculated from the actual navigation bottom and viewport height, leaving a 24px bottom allowance. Internal scrolling, contained overscroll and a thin themed scrollbar handle short viewports. A resize observer keeps the allowance aligned with the header geometry.

Layering follows the current repository, rather than replacing its scale: page/map containers use their existing lower stacking contexts; main navigation is 1000; the catalog panel is layer 30 within that context; search remains 1100. The native modal drawer's top layer sits above navigation and page content. The panel has no backdrop that captures search/cart interactions. Outside clicks close it through the document listener. Layer behavior over actual Leaflet and the native drawer remains on the manual checklist.

## 5. Tablet and mobile

| Width | Implemented catalog behavior |
| --- | --- |
| 1440 | Four-column panel, full shared content width |
| 1024 | Three-column panel, smaller local thumbnails |
| 768 | Desktop panel disabled; catalog link and burger remain available |
| 390 | Desktop panel disabled; direct catalog link in burger |
| 320 | Same mobile behavior with existing responsive header/drawer |

These are CSS/handler implementation rules, not measured browser acceptance. Closing the viewport down to mobile hides/inerts the panel, closes its state and restores focus to the catalog trigger when needed. Returning to desktop does not restore an old open state. Mobile does not rely on hover. A catalog link was added as the first item in the existing burger navigation; the dialog's close, focus return and language controls retain their existing behavior.

Desktop shortcut links use a compact minimum height of 32px with fine pointers; devices reporting any coarse pointer use at least 44px. Category image/title links are at least 64px high; the trigger and other controls retain at least 44px targets. Long translated labels wrap rather than forcing the header/panel wider.

## 6. Accessibility

This is normal site navigation, with semantic links, category lists and a labeled `nav`; no ARIA `menu`/`menuitem` roles are used. The closed panel is both `inert` and `aria-hidden`, with visibility/pointer rules that prevent hidden links from receiving ordinary focus. The trigger remains a link, not a button posing as navigation.

Tab follows the catalog link into the panel links before continuing through the navigation. ArrowDown provides an additional entry action. Escape returns focus to the trigger if the panel held focus; it preserves outside focus when dismissing a hover-only panel. Internal focus movement does not close it; leaving the wrapper does. Focus outlines are visible. Category thumbnails and icons are decorative.

Controlled handler checks executed the actual TSX handlers with hook, timer and focus doubles. They verified delayed closure/cancellation, focus entry, ArrowDown, Escape without reopening, outside blur/clicks, navigation closure, mobile resize, disclosure exclusion and pathname closure. This is supplemental component logic verification; it is not real browser focus/pointer/keyboard acceptance.

## 7. Localization and themes

All category names, family labels, panel headings, loading/error/retry/empty states and “+ Ещё” use the existing presentation dictionary. Added **45 TJ/EN pairs** and preserved all **486 existing pairs**. The dictionary now contains 531 entries. The whole-frontend source audit covers 440 distinct UI strings and finds no missing translations.

The panel uses existing dark/light surface, text, border and brand ink tokens. Small green text uses the light theme's darker brand ink. Default dark mode, preferences, locale persistence and the supplied Paykar logo are unchanged. Actual long TJ/EN wrapping and contrast at each viewport remain pending manual review.

## 8. Animation

Opening transitions opacity from 0 to 1 and vertical translation from -6px to 0 over 180ms. Closing becomes inert immediately while the subtle visual exit completes. The chevron rotates through the same restrained duration. Reduced-motion preference disables both transitions and translation. There is no bounce, scaling animation, heavy accordion/menu dependency or new icon package.

## 9. Source files changed

- `apps/web/src/components/catalog-mega-menu.tsx`: catalog trigger, category groups, disclosures, focus and viewport handling.
- `apps/web/src/components/catalog-mega-menu.css`: scoped panel/trigger/grid states, scrolling, pointer targets, responsive and reduced-motion rules.
- `apps/web/src/lib/category-presentation.ts`: shared local imagery, canonical category grouping and supported search shortcuts.
- `apps/web/src/components/site-navigation.tsx`: integration, single active disclosure state, mobile burger catalog link.
- `apps/web/src/components/home.tsx`: import shared image metadata instead of defining a second image map.
- `apps/web/src/lib/translations.json`: localized new labels and states.
- `docs/progress/catalog-mega-menu.md`: this report and acceptance checklist.
- `docs/progress/catalog-mega-final/source-audit.json`: localization/source audit.
- `docs/progress/catalog-mega-final/handler-verification.json`: controlled handler checks.
- `docs/progress/catalog-mega-final/runtime-verification.json`: real API/HTTP/asset and preservation evidence.

Verification helpers and before-state snapshots live under ignored `.cache/`. SHA-256 comparison found **zero changes in 65 protected files**, including backend/database, cart, search, checkout, payments, confirmation, API client, shared shell/footer, theme/global CSS and the previous delivery redesign. No dependency, database category, production image or backend behavior was added.

## 10. Checks and regression evidence

Run in `apps/web`:

```powershell
npm run lint
npm run typecheck
npm run build
npm run format:check
```

All passed. Initial lint identified the reserved React `children` prop being used for category data; it was renamed `subcategories`, and lint/typecheck/format/build were rerun successfully. No lint rule or TypeScript error was suppressed. A focused follow-up added document Escape handling for hover-only opening and reran the relevant checks.

Supplemental checks:

```powershell
node .cache/mega-source-audit.cjs
node .cache/catalog-mega-handlers.cjs
node .cache/catalog-mega-runtime.cjs
docker compose config --quiet
docker compose up --build --no-deps -d --wait web
docker compose ps
```

Source, controlled-handler and runtime checks passed. The web image was rebuilt and started healthy against the existing API/PostgreSQL containers. The deployed header includes the proper catalog anchor and a closed inert/aria-hidden panel, and the production assets include the new CSS.

Real API checks verified the canonical seven-category tree, all 30 shortcut queries and the existing apples search. Seven category page routes plus catalog, a category/search URL, cart, checkout, delivery, how-to-buy, payment and contacts returned HTTP 200 with the shared shell. The home response was also checked. All six reused category WebPs were served successfully.

The credential scan checked 13 public JS/CSS assets referenced by the home response, plus fetched API/page responses. It found zero ORS key matches and zero provider-domain matches in those assets. The secret was read privately for comparison and was never printed. This is a bounded asset/response scan, not a browser network trace.

No order was created, no basket was modified and no ORS request was needed for this navigation task. Backend tests and live checkout/provider flows were not rerun here because their code/settings were unchanged; existing health endpoints returned `ok`. HTTP success and source preservation do not prove shopping controls or native dialogs work in a real browser. Those remain explicitly pending below.

## 11. Visual and interactive acceptance

Automated browser review: **UNAVAILABLE**. Selection returned “No browser is available”; discovery returned `[]`. No new browser screenshots, header measurements, pointer-path observation or interactive cart/search/checkout tests were produced. Earlier manual acceptance of other pages does not accept this new navigation.

Manual acceptance: **PENDING**. Review the rebuilt app at `http://localhost:3000` at **1440, 1024, 768, 390 and 320px**, in **dark/light** and **RU/TJ/EN**. Capture accepted screenshots under `docs/progress/catalog-mega-final/screenshots/` when available.

- [ ] Hover Catalog: the panel opens below the navigation, aligned with the shared page grid.
- [ ] Cross from trigger into panel: no flicker or premature dismissal. Leave both: panel closes after the short delay, with keyboard focus retained when appropriate.
- [ ] Click/Enter Catalog: navigates to `/catalog`. Open/reopen on that same route remains usable.
- [ ] Focus Catalog, then Tab/Shift+Tab: every visible category/search link can be reached; no hidden panel link receives focus when closed.
- [ ] ArrowDown enters the panel; Escape closes it and returns focus when inside, without reopening. Escape after hover opening preserves outside focus.
- [ ] Click outside or move focus outside: closes normally; active focus remains visible.
- [ ] Open another information disclosure: only one panel remains open. Its original preview/URL behavior still works.
- [ ] Category and fruit links reach the correct routes; family links display matching filtered products. Parent/child active states are coherent.
- [ ] Images remain 56–64px and don't dominate; labels, columns, hover/focus styling and dark/light contrast remain readable.
- [ ] Short viewport: panel stays within the usable height, scrolls internally and can reach its last link.
- [ ] At 768/390/320 no desktop panel opens. Burger Catalog works; burger close, Escape, language controls and focus return remain usable.
- [ ] Header height and Catalog button dimensions match the prior layout; long TJ/EN labels cause no clipping or horizontal overflow.
- [ ] Header search still supports suggestions, keyboard navigation and normal submission; cart count/link and basket persistence work normally.
- [ ] Theme/language switching and reload persistence remain intact; global branded background and delivery layout look unchanged.
- [ ] Menu layers above page cards and actual Leaflet maps; the modal burger drawer layers above it.
- [ ] Reduced motion removes the transition; no console/hydration errors appear.
- [ ] Network inspection confirms hover/reopen does not fetch products/category pages or trigger a quote/ORS request. Initial category metadata/local image loading is expected on desktop.

The remaining acceptance blocker is the disconnected browser. No frontend check, supported navigation target or runtime API/HTTP check remains failing.
