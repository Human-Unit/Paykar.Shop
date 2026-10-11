# Final UI consistency audit

Date: 2026-10-10. Branch: `main`. Checkout:
`D:/Workshop/Paykar/Test_Task_Paykar_Shop-main`. Existing uncommitted work was
preserved; this report describes only this pass. No commit or push.

## Runtime and method

Inspected the existing Docker frontend before editing, then rebuilt/recreated
the same `test_task_paykar_shop-web-1` service on `http://localhost:3000`.
Final healthy image:
`sha256:8f5ffd57371871698c0b9eb4184e0a55ab7606df62eb03ae3d2da12adb2ac96c`.

The in-app Browser returned “No browser is available.” Regular Playwright
successfully rendered the actual production runtime; no temporary preview was
used. Agent/testing guidance was read from `origin/chore/agent-web-guidelines`
because the repository-local testing skill was absent. No guidance branch merge
or application dependency change was performed.

## Routes reviewed

- Shopping: Home, Catalog, dairy category, catalog search, normal/sale/out-of-stock
  product detail, Cart, Saved Items, My Shopping, new/personal/curated template
  pages, Checkout and an existing persisted order confirmation.
- Public: Promotions, How to Buy, Payment, Returns, About, Contacts, Brands,
  Stores and Delivery.
- Editorial: Blog and all four current articles: weekly-shopping,
  fruit-and-vegetables, delivery-guide and checkout-checklist.
- Recovery: unknown-route 404, empty cart/saved items/promotions, missing products,
  unavailable stock, delayed address loading and retryable product API errors.
- Shared: ProductCard sale/favorite treatment, breadcrumbs, page headings,
  primary/secondary actions, focus, navigation drawer and carousel controls.

## Mismatch ledger and corrections

| Area                              | Before                                                                                            | Smallest coherent correction                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Public pages and Cart             | 1320px content span at desktop; titles around 52px, inconsistent with the approved shopping pages | Contain these pages at 1200px; responsive 30–46px titles and calmer section hierarchy                                         |
| Delivery / Stores / Saved         | Title scale drift                                                                                 | Align title scale; preserve Delivery composition, Stores map geometry and Saved content/grid                                  |
| Help / company pages              | Large flat panels and hover movement on non-interactive information                               | Scoped charcoal-to-green surfaces, 20–24px radii, restrained inset depth, compact padding; remove non-interactive panel lift  |
| Contacts                          | Two oversized framed information blocks                                                           | Plain support/address sections with quiet separators; keep the truthful address and existing Stores action; no map            |
| Promotions                        | Small image stages, oversized surrounding context, older shared sale badges                       | Larger square image stages, 4/3/2-column grid, compact context row; shared red 45° tape                                       |
| ProductCard consumers             | Catalog ribbon versus rounded badges elsewhere; favorite competes with sale corner                | Consolidate the existing Catalog ribbon into ProductCard styles; favorite uses the opposite corner and a 44px target          |
| Cart                              | Summary chrome and title scale lagged Checkout                                                    | Quiet gradient summary/items, stronger total, stable sticky offset and single-column tablet layout                            |
| Template editor/detail            | Broad workspace and flat nested surfaces                                                          | 1120px contained workspace, quiet picker/list/summary depth and explicit input focus; overview/carousel composition unchanged |
| Empty / failure / message loading | Oversized floating icon treatment and uneven recovery presentation                                | Compact shared surfaces, quiet state icons, readable copy, visible retry/Catalog focus; skeleton variants unchanged           |
| Carousel touch controls           | Some tablet targets measured 28–42px                                                              | 44px minimum for coarse pointers only; approved mouse layout and carousel logic unchanged                                     |
| 404 stylesheet                    | Existing Prettier failure                                                                         | Formatting only; no visual rule changes                                                                                       |

## Files changed in this pass

- `apps/web/src/components/support-workspace.module.css` (new)
- `apps/web/src/components/states.module.css` (new)
- `apps/web/src/components/store-pages.tsx`
- `apps/web/src/components/cart-page.tsx`
- `apps/web/src/components/delivery-page.tsx`
- `apps/web/src/components/saved-items-page.module.css`
- `apps/web/src/components/shopping-assistance.module.css`
- `apps/web/src/components/catalog.module.css` (remove duplicated ribbon rule)
- `apps/web/src/components/my-shopping.module.css` (template pages only)
- `apps/web/src/components/shopping-carousel.module.css` (coarse-pointer targets only)
- `apps/web/src/components/states.tsx`
- `apps/web/src/components/not-found-view.module.css` (formatting only)
- `docs/progress/final-ui-consistency-audit.md`

## Verification

| Command                                     | Actual result                                             |
| ------------------------------------------- | --------------------------------------------------------- |
| `npm run format:check`                      | PASS; initial pre-existing 404 formatting issue corrected |
| `npm run lint`                              | PASS, exit 0                                              |
| `npm run typecheck`                         | PASS, exit 0                                              |
| `npm run build`                             | PASS, exit 0; production Docker build also passed         |
| `node --test tests/*.test.mjs`              | PASS: 39 passed, 0 failed, 0 skipped                      |
| `git diff --check`                          | PASS                                                      |
| Docker build/recreate and health inspection | PASS; actual port 3000 serves the final image             |

The all-tests command includes Catalog, Navigation, Recommendations, Shopping,
Saved Shopping and Hero Policy tests. Node emits existing
`MODULE_TYPELESS_PACKAGE_JSON` warnings; no package mode change was needed.
Backend checks were not rerun: no backend-adjacent behavior, APIs, database or
storage schemas changed.

Production rebuild command, run from the current checkout:

```powershell
docker compose --project-directory 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main' -f 'D:/Workshop/Paykar/Test_Task_Paykar_Shop-main/docker-compose.yml' -p test_task_paykar_shop --env-file 'D:/Workshop/Paykar/Test_Task_Paykar_Shop/.env' up -d --build --force-recreate --no-deps web
```

## Browser coverage and evidence

- 480 route-layout cases: 20 remaining/public/template/recovery routes ×
  390/768/1024/1440 × RU/TJ/EN × dark/light.
- 80 additional protected-surface cases: 10 shopping routes × four widths ×
  dark/light in English. Normal/sale/out-of-stock products and the existing
  persisted confirmation were included.
- Home/My Shopping: 48 coarse-pointer cases across all widths/languages/themes;
  repeated 48 cases with reduced motion. No document overflow, clipped actions,
  broken loaded images, application overlays or unexpected console/page errors.
  Fractional button measurements during existing entrance motion were checked
  again settled/reduced-motion; no extra ProductCard resizing was warranted.
- Screenshot inspection covered desktop/mobile Contacts, Payment, Promotions,
  Saved Items, Returns and template pages; additional 768/1024 anchors covered
  Promotions, Cart and curated template detail. Before/after comparison confirmed
  narrower content, quieter Contacts and the unified ribbon. This is representative
  visual review, not a claim that every matrix screenshot received manual inspection.
- Keyboard: drawer open/Escape/focus restoration, carousel movement/focus and
  Delivery FAQ. Touch emulation: carousel target sizes, mobile cart/template actions.
- Real API/data: Cart increment/subtotal/reload/remove, promotion favorite
  toggle/reload/add, real recommendations, template create/edit/quantity/save/
  reload/add-all/delete, missing/out-of-stock recovery, repeat of an existing
  order, confirmation reload, Stores address tooltip/zoom/resize.
- Intercepted states: promotion 503 with retry back to real products, successful
  empty promotions with Catalog recovery; delayed real address request with a
  visible loading status. Expected injected HTTP errors are separate from normal
  console health. No order was created; fixtures lived only in disposable browser
  contexts.
- Two QA assumptions were corrected without application changes: cart removal
  needed an awaited React render, and the current Stores marker uses an address
  tooltip, not a popup.

Local evidence is outside the source tree under
`C:/Users/ahmad/AppData/Local/Temp/`:
`paykar-consistency-browser-results.json`,
`paykar-consistency-before-*.png`,
`paykar-consistency-after-*.png`,
`paykar-consistency-matrix-*.png`,
`paykar-consistency-final-reduced-*.png` and
`paykar-consistency-error-*.png`.
Full-page captures place fixed mobile navigation at the capture viewport boundary;
this is not an in-page layout overlap.

## Intentionally unchanged and remaining risks

- Source hashes confirmed no changes this pass to the hero scene/homepage
  composition, ProductCard handlers, Catalog/Product Detail component logic,
  My Shopping overview handlers, carousel logic, Checkout/Confirmation,
  navigation/shell, map components, theme wave, phone animation, translations,
  APIs or storage modules. Shared ProductCard sale/focus styling and coarse-pointer
  targets are the deliberate cross-route exceptions.
- Preserve practical payment/sandbox warnings, returns guidance, existing FAQs,
  editorial content, truthful contact data and useful empty-state recovery.
  No new policies, contact details, imagery or promotions were invented.
- No new WebGL, assets, dependencies, backend edits or persistent test orders.
- This pass does not recertify real ORS routing/order creation; those protected
  flows were not changed. External map tiles still depend on OpenStreetMap.
- Browser coverage is Chromium automation, not a physical-device/Safari audit.
  Existing illustrative category images remain explicitly labelled.
- No blocking regression found in this pass. Unrelated earlier work remains
  uncommitted and must not be mistaken for changes introduced by this audit.
