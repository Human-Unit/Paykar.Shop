# Full-site final design and UX polish

Date: 2026-10-05. Checkout: `D:\Workshop\Paykar\Test_Task_Paykar_Shop`.

## Audit before implementation

The running application and route/component sources were audited before edits. Browser selection returned `No browser is available`; discovery returned `[]`. Findings below are source/HTTP evidence, not screenshot observations.

All requested route families were checked over HTTP: homepage, catalog, a real category/product, cart, checkout, order missing-state, delivery, payment, how-to-buy, returns, promotions, blog/article, brands, about, contacts, stores, custom 404. Seventeen existing routes returned 200; unknown order/page returned expected 404. API and database health returned 200; SKU search found the chosen product; delivery configuration reported available. No order or routing-provider request was created.

### P0 issues found

No P0 failure established in the available source/HTTP checks. This is not a visual or end-to-end acceptance claim.

### P1 issues found

| Finding | Source evidence | Planned correction |
| --- | --- | --- |
| Secondary actions look primary | JSX uses `button secondary`, but no `.secondary` CSS exists | Add neutral secondary surface, border, hover/active/focus treatment |
| Payment choice layout inherits text-field geometry | `.checkout-panel label` sets column direction; input rules set 44px minimum height and 12px padding; radio rule only resets width/height | Scope row layout to payment labels and fully reset radio dimensions/padding |
| Form boundaries are much weaker than control text | Inputs share decorative `--line` (8% white in dark / `#e3e6e1` in light) | Separate interactive border token from quiet panel borders |
| Suggestion content has no viewport height bound | `.search-dropdown` uses `overflow: hidden` without max-height; names and fixed price share a flex row | Bound height, allow scrolling, wrap names, give narrow-screen prices a second row |
| Footer hover color ignores light-theme accessible brand ink | Footer uses raw brand green on white | Use theme-aware brand ink and underline on hover/focus |
| Static dense surfaces still use translucency | Promo cards use blur; store list uses 94% surface; discount panel and 404 use 85% surface | Reserve glass for layered chrome/overlays and make these surfaces opaque |
| Form/control radius varies arbitrarily | Buttons/quantities/inputs use 7px, mixed with 6px header controls | Reuse one 6px control token, retaining existing 8px panel and 12/16px overlay scale |

### P2 issues left for later

No speculative hero crop, section ordering, heading resizing, catalog density, or menu-column changes without rendered evidence. The long historical CSS cascade can be consolidated after presentation; it is not being rewritten during this pass.

## Short design plan

1. Keep existing Paykar green, Noto Sans, four surface levels, 1440px grid and responsive gutters. Refine shared actions, form boundaries and states first.
2. Keep header/menu/drawer structure. Make suggestions usable in constrained viewports and align footer interaction feedback with the rest of the site.
3. Preserve homepage composition and recent content-driven side-card sizing; reduce translucency behind static content.
4. Retain commerce density and product-card flex alignment. Apply shared action/form treatment to catalog, product, cart, checkout and confirmation without changing state or handlers.
5. Preserve distinct delivery, public and editorial compositions. Keep store map logic, markers and existing layouts; refine only its list surface and floating badge radius.
6. Run required checks, rebuild web, repeat read-only route/API checks, verify protected-file hashes and bundled typography. Record exact browser/manual acceptance limits.

Implementation and final verification results will be recorded below.
