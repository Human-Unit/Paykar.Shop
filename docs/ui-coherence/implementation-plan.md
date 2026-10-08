# UI coherence implementation plan

Status: **proposal — not authorized for source implementation yet**.

Read [audit](audit.md), [design system](design-system.md) and [route matrix](route-matrix.md) together. The route matrix defines what survives; do not interpret “simplify” as permission to delete useful content.

## Scope contract

This is frontend presentation convergence. No dependency additions, backend/API/migration changes, storage changes, new account/recommendation/payment features or map relocation. No automatic commit/push/branch creation. Preserve pending hero work and all accepted behavior.

Approve the design rules and anchor direction before beginning. This plan contains later test gates; the audit did not execute the implementation test suite.

## Dependency-aware sequence

| Stage | Depends on | Work / likely owners | Exit criteria |
|---|---|---|---|
| 0. Freeze baseline | Approval | Recheck branch/status; preserve current dirty files; use these screenshots/measurements; inventory current fixture availability | Equivalent before evidence and protected-file list; no stale assumption about current HEAD/data |
| 1. Opt-in foundations | 0 | `styles/tokens.css`, `components.css`, `page-patterns.tsx`; define compact commerce intro, heading/action spacing, surface/radius aliases | Lint, format, typecheck, build; old consumers still render; no indiscriminate global token replacement |
| 2. Shared shell | 1 | `shell.tsx`, `site-navigation.tsx`, `styles/chrome.css`, relevant saved utility styles | Full Saved label or intentional accessible icon mode; no overlap; nav tests immediately; keyboard/drawer/mega-menu sanity |
| 3. Homepage anchor composition | 1–2 | `home.tsx`, `styles/home.css`; preserve pending `home-hero.tsx` unless a demonstrated shared-rule regression requires a narrow fix | Eight-section narrative unchanged; quieter promo framing; aligned section headers. Phone/maps untouched |
| 4. Product card/image contract | 1, homepage direction | `product-card.tsx`, `styles/shop.css`; verify asset mapping and explicit image context; standard card/status rules | One canonical card in home/catalog/saved/related contexts; no fake SKU photography; save/quantity behavior preserved |
| 5. Catalog | 2,4 | `catalog.tsx`, `catalog-filter-dialog.tsx`, `styles/catalog.css` | Mobile shopping area closer to title; all filters/sort/search accessible; query/keyboard/request tests green |
| 6. Product Detail anchor | 1,4 | `product-detail.tsx`, `catalog.css`, `product-content.css`; narrowly retire conflicting detail selectors in `site-polish.css` | No orphan enrichment column; price/stock/action hierarchy; both food and household content; recommendation tests |
| 7. My Shopping anchor + template presentation | 1,4,6 | `my-shopping.tsx`, `shopping-workspace-cards.tsx`, `my-shopping.module.css` | Overview direction retained; compact image-led rows in existing detail/editor data flow; fresh and populated scenarios preserved |
| 8. Anchor convergence gate | 3–7 | Compare all three screens together, not isolated screenshots | Common widths/headings/surfaces/actions in both themes; specified anchor screenshots reviewed; resolve disagreements before propagation |
| 9. Saved Items | 4,8 | `saved-items-page.tsx`, shared state styles | Fresh state useful; populated grid consistent; stale IDs/errors remain visible |
| 10. Cart | 4,8–9 | `cart-page.tsx`, relevant `checkout.css` rules | Consistent product rows and summary; no quantity/price/persistence changes |
| 11. Checkout + confirmation | 10 | Presentation-only markup/classes in `checkout.tsx`, `order-confirmation.tsx`, `checkout.css` | Form hierarchy/status/readability improved; full protected commerce smoke; no new persistent test order by default |
| 12. Promos | 3–5,8 | Promotions branch of `store-pages.tsx`, `pages.css` | First products no longer buried under two promotional frames; actual sale grid/pagination/error/empty rules unchanged |
| 13. Stores/Contacts framing | 1,8 | Surrounding text/panels in `store-pages.tsx`, narrowly scoped styles | Contacts remains map-free; Stores map/network components and their dimensions/behavior unchanged; truthful labels |
| 14. Information pages | 12–13 (shared renderer ownership) | Sequential How to Buy → Delivery → Payment → Returns → About → Brands; `store-pages.tsx`, `delivery-page.tsx`, `pages.css` | Keep/remove table respected; no invented policy or contact data; no duplicated generic CTA/FAQ restoration |
| 15. Blog/articles | 14 | `article-card.tsx`, article branch of `store-pages.tsx`, `pages.css` | Same reading/card rules across all four articles; preserve 820px reading width and related content |
| 16. Mobile + localization reconciliation | All changed routes; mobile checks also occur earlier | Review composition at 320/390/768/1024/1440; coordinated `translations.json` edits | No clipped labels/glyphs or accidental horizontal overflow; keyboard and long copy usable |
| 17. Final acceptance/report | 16 | Static tests, targeted browser flows, matrix and Docker production runtime | Evidence-backed before/after report; explicit unverified/blocked items; no publication without separate request |

### Why this differs slightly from a simple page list

- Homepage composition is settled first, but ProductCard is implemented before finalizing its product rows; otherwise card changes would invalidate homepage acceptance.
- Product Detail and My Shopping complete the anchor set before propagating into Saved/Cart/Checkout.
- Mobile composition is designed at each stage, then reconciled globally; it is not postponed until the end.
- Shared informational renderer edits are sequential to avoid repeated conflicting rewrites.
- Pure active-route tests run immediately after shell edits, not only at final QA.

## Anchor visual acceptance

These are proposed targets, measured with equivalent viewport, locale, theme and fixture content.

### Homepage

- Preserve current hero asset, contained grocery image, Catalog CTA and quiet delivery link.
- No extra shopping-step/banner/curated grid blocks; maintain the eight-section order.
- Promos remain actual sale products, independently loaded; empty success hidden, error/retry visible.
- Standard section alignment/gaps; product rows provide visual richness rather than repeated percentage art/green panels.
- My Shopping shortcut remains compact. Phone and store network receive no internal changes.

### Product Detail

- Food and household examples both show all supplied information with no empty orphan desktop column.
- Name, price, availability and cart action form the main hierarchy.
- At 390×844, milk's primary purchase action should be visible before supplementary service content; achieve this with composition/spacing, not reduced font or touch size.
- Long TJ/EN names may wrap naturally; no fixed height clipping to force the target.
- No mandatory nutrition section for nonfood items; disclaimers remain.
- Connected/current product IDs excluded before secondary recommendation limits; successful empty row hidden, failures visible.

### My Shopping

- Latest order/personal templates appear only when real local data exists; curated sets stay useful.
- Preserve preview images, estimates, positive counts, warning/recovery states and contextual creation.
- Single-product orders do not reserve the same blank preview width as a four-image collage.
- Template editor/detail resembles the visual workspace using existing product data; preserve all controls and operations.
- No fake order/template filler; no storage/schema changes.

### Cross-anchor screen set after each anchor

Capture and inspect:
- 1440 dark RU
- 1440 light RU
- 390 dark TJ
- 390 light EN

Also compare same-condition RU images to this audit baseline for reliable before/after evidence. The localized captures are additional layout checks, not substitutes for comparable before/after pairs.

## High-conflict files and ownership

| Files | Risk | Work rule |
|---|---|---|
| `styles/tokens.css`, `components.css`, `app/globals.css` | Global cascade changes reach every route, including protected features | One foundation pass; opt-in aliases; keep import layers; inspect computed styles |
| `app/paykar-theme.css`, `app/site-polish.css`, `app/legacy-base.css` | Still active palette/layout rules under current styles | Remove only selectors whose replacement/consumer set has been proven |
| `components/page-patterns.tsx` | Shared intros/sections/steps used widely | Introduce minimal explicit compact/standard usage; no new abstraction framework |
| `shell.tsx`, `site-navigation.tsx`, `styles/chrome.css`, `lib/navigation.ts` | Active rules, offsets, focus, responsive shell | Preserve canonical route model; presentation-only changes where possible |
| `home.tsx`, `home-hero.tsx`, `styles/home.css` | Pending accepted hero edits | Baseline includes dirty work; do not overwrite with HEAD or restart design |
| `product-card.tsx`, `styles/shop.css` | Image mapping and cart/saved actions shared everywhere | Keep behavioral handlers intact; test image contexts across all consumers |
| `styles/catalog.css`, `product-detail.tsx`, `product-content.css` | Detail/catalog styles overlap | Separate selector ownership; avoid broad `.product-image` override |
| `my-shopping.tsx`, `my-shopping.module.css`, `shopping-workspace-cards.tsx` | UI colocated with accepted storage/actions | Limit changes to presentation; diff handler/storage imports carefully |
| `checkout.tsx`, `order-confirmation.tsx`, `styles/checkout.css` | Financial/quote/submission flow alongside styling | Small reviewable patches; no effect/dependency/state-machine changes |
| `store-pages.tsx`, `styles/pages.css` | Public pages and global Leaflet rules share files | Edit page scopes only; protect Leaflet selectors and map mounting |
| `lib/translations.json` | Many routes share exact-string keys | Gather copy inventory first; add RU/TJ/EN together; no unrelated rewrites |

## Protected-file and behavioral checks

Use the audit's [source baseline](source-baseline.json) as historical evidence, not a future reset script. Rebaseline current worktree before implementation.

Map protection includes `store-map.tsx`, `store-network-map.tsx`, delivery map components, `home-store-network.tsx`, its module CSS, store coordinates and global Leaflet rules. Do not refactor/remount them to improve surrounding layout.

Phone/theme protection includes `order-showcase.tsx`, journey logic, `theme-wave.css` and relevant preference/transition code. Shared motion/token changes can affect these without a direct file diff; browser comparison is required.

Behavioral protection includes API helpers/contracts, cart/saved contexts, shopping storage/hooks, ID-based recommendation logic, checkout/quote state and payment flow. A visual pass is not permission to refactor those modules.

## Later verification gates — not executed by this audit

### Static gates

From `apps/web`:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run test:navigation
npm run test:recommendations
npm run test:catalog
npm run test:shopping
```

From repository root:

```powershell
git diff --check
```

Run relevant gates after foundational/shared changes and each affected domain; run all at final acceptance. Navigation tests immediately after shell work. Do not write tests that only mirror CSS literals.

### Targeted browser checks

1. Primary/supporting links, Catalog active on category/product, My Shopping active on template routes, path boundaries.
2. Catalog mega-menu hover/click/keyboard, drawer focus restoration/escape/scroll lock, search suggestions, filter/sort URL persistence, mobile bottom bar.
3. Real sale products plus **intercepted** promo failure/empty success; categories/everyday still usable.
4. Product image/loading fallback; food and household enrichment; ID deduplication; **intercepted** secondary-recommendation failure and empty result.
5. My Shopping: fresh, history-only, templates-only, both, single-item and multi-item previews; unavailable products; preview API errors; storage warning. Use isolated browser contexts.
6. Template create/edit/save/delete, repeat, bulk-add, current-price/stock checks and reload persistence; no schema changes.
7. Saved fresh/populated/stale/unavailable/error; cart quantity/remove/reload; useful recovery.
8. Existing persisted test order for confirmation reload and repeat. Avoid creating another order. Use intercepted failed-checkout responses to verify cart preservation; distinguish this from real provider/creation testing.
9. Delivery quote/map regression with configured real backend only where necessary; explicitly report whether real ORS was exercised. Never report an intercepted quote as real.
10. Preserve theme/language persistence, document lang, reduced-motion visibility, phone journey and theme wave. Check normal-motion and reduced-motion separately.
11. Stores/home maps: labels, popup selection, repeated selection, directory scrolling, wheel/touch behavior, keyboard-accessible links, attribution. Contacts must have no map.

### Responsive matrix

Full **30 cases on shared shell/homepage**:
`320, 390, 768, 1024, 1440 × RU, TJ, EN × dark, light`.

For each case: no page overflow, usable search/navigation, no clipped text, intentional heading wraps, complete grocery image, correct CTA order, readable product cards, proper bottom-bar clearance.

Representative desktop/mobile coverage for every changed route; both themes distributed across cases. Target TJ long labels, template controls, product names, forms and breadcrumbs. Do not multiply every informational route into 30 cases without evidence that a shared defect warrants it.

### Production runtime

Use the existing Compose project/environment, not a parallel stack against another worktree:

```powershell
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env build web
docker compose -p test_task_paykar_shop --env-file D:\Workshop\Paykar\Test_Task_Paykar_Shop\.env up -d --no-deps web
```

Verify the env-file path and running project still match before running these later; never display the secret file. Recheck frontend health/assets and targeted anchor/navigation/commerce rendering against the rebuilt production service. Configuration validity alone is not runtime acceptance.

## Copy and asset discipline

Inventory changed strings before editing components. Update RU/TJ/EN together through the established translation surface. Keep supplied product facts, estimates, availability, address data, sandbox labels and delivery qualifications. Do not invent new contact channels, policies, promotion urgency or health claims.

Asset substitutions need a verified source-product relationship. Lack of exact imagery is an explicit limitation, not permission to generate fictional packaging.

## Risks, tradeoffs and stop conditions

- Global token changes may subtly alter maps, phone and hero; use scoped adoption and before/after measurements.
- A universal compact header could harm editorial reading or Delivery's accepted identity; use explicit commerce versus editorial/illustration roles.
- Image fitting is asset-specific; changing all cover rules to contain is unsafe.
- Template data may lack a live image/price during loading or failure; do not fetch through a new contract or hide the warning to complete a visual row.
- The Stores directory mismatch needs a separate product decision if relocation is desired; keep this pass to truthful surrounding content.
- Long localized content wins over arbitrary equal heights.
- If a visual idea requires changing protected behavior, stop that sub-change and document it as a future opportunity.
- Browser/provider unavailability must be reported as BLOCKED, not replaced with a static-check success claim.

## Final implementation report requirements

Provide:
- revised route keep/remove table;
- before/after anchor evidence with matching viewport/theme/data;
- actual commands and results, including failures;
- clearly separated real API, intercepted-failure, browser-interaction and source-only checks;
- all preserved-feature checks and remaining visual limitations;
- changed-file list and confirmation of no backend/storage/map behavior changes;
- commit/push status.

Do not declare the coherence pass complete from lint/build alone. Stop after this audit until the user approves implementation.
