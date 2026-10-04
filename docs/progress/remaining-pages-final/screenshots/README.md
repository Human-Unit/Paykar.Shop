# Full-site polish — manual browser review

Status: **PENDING**. No screenshots have been captured for this pass. Browser connection returned `No browser is available` and discovery returned `[]`.

Start at `http://localhost:3000`. The final frontend is rebuilt through Docker Compose. HTTP responses and source audits do not validate rendered appearance. The populated confirmation fixture is `/order/2eb6ae6f-1722-40c5-ac32-665e2745a354`.

## Viewports and preferences

Review each major route at 1440, 1024, 768, 390 and 320px widths. Check dark and light, RU/TJ/EN, including the longer translated labels. Check horizontal overflow, page margins, heading hierarchy, CTA fit, image framing, contrast and the footer transition.

## Minimum screenshot set

| Route | Desktop 1440 | Mobile 390 |
| --- | --- | --- |
| `/` | `1440-home.png` — pending | `390-home.png` — pending |
| `/catalog` | `1440-catalog.png` — pending | `390-catalog.png` — pending |
| `/catalog/produce` | Review category context — pending | Review sidebar/filters — pending |
| `/product/apples-red` | `1440-product.png` — pending | `390-product.png` — pending |
| `/cart` (populated and empty) | `1440-cart.png` — pending | `390-cart.png` — pending |
| `/checkout` (filled, real quote) | `1440-checkout.png` — pending | `390-checkout.png` — pending |
| `/order/{successful-test-order-id}` | `1440-confirmation.png` — pending | Review stacking/reload — pending |
| `/how-to-buy` | `1440-how-to-buy.png` — pending | Review steps/FAQ — pending |
| `/payment` | `1440-payment.png` — pending | `390-payment.png` — pending |
| `/delivery` | `1440-delivery.png` — pending | `390-delivery.png` — pending |
| `/returns` | `1440-returns.png` — pending | Review support steps — pending |
| `/promotions` | `1440-promotions.png` — pending | Review grid/empty — pending |
| `/blog` | `1440-blog.png` — pending | Review featured/card stacking — pending |
| `/blog/weekly-shopping` | `1440-blog-article.png` — pending | Review text width/images — pending |
| `/brands` | `1440-brands.png` — pending | Review assortment/info state — pending |
| `/about` | `1440-about.png` — pending | Review story/features — pending |
| `/contacts` | `1440-contacts.png` — pending | Review store/map/actions — pending |
| `/stores` | `1440-stores.png` — pending | Review store/map/actions — pending |
| `/unknown-store-page` | `1440-404.png` — pending | Review recovery actions — pending |

Also review the other three blog articles, category/product/order 404s, loading and API-error recovery. Missing-resource HTTP responses have status 404 and the custom component reference, but no branded heading in their initial HTML; specifically check that hydration displays the polished 404, shared header/footer, preferences and recovery links correctly.

## Shopping and interaction acceptance

- Search suggestions: keyboard navigation, Enter/Escape, empty/error state and layering.
- Catalog: categories, sorting, stock filter, search, paging and no-result recovery.
- Product/cart: stock limits, quantity controls, remove/clear actions, persistence and empty state.
- Fill checkout, calculate a real route, then switch RU/TJ/EN and dark/light. Name, phone, address, comment, destination, quote and payment fields must remain intact; preference changes must not request another quote.
- Confirm the real route on Leaflet and read distance, estimated travel time and delivery price. Changing the address, point or basket must invalidate the quote.
- Select test payment and try `DECLINED`, `INSUFFICIENT`, `ERROR`, then `SUCCESS`. Failed payment must preserve cart/details/point/quote; retry should reuse its payment session. Double clicking must create one order. Synthetic form values only; do not enter real card details.
- Confirm the cart clears after successful order creation, then reload the confirmation URL and compare order/payment/totals.
- Review native FAQs with keyboard, focus visibility, burger open/close/focus return, mobile footer disclosures, exclusive information flyouts and catalog-menu scrolling/layering.
- In browser network tools, confirm no direct HeiGIT/ORS call and no secret in request/response payloads or browser assets. Informational pages must not request delivery quotes.

Actual backend smoke order IDs and persisted results are in `../runtime-verification.json`. Those server-side results are separate from the pending browser flow above.

Only after new browser/manual acceptance succeeds should the main report be updated to `FULL-SITE POLISH — COMPLETE` and `SUBMISSION READY — YES`.

## Follow-up priorities (2026-10-03)

Review the new returns/offer/location illustrations and hero actions in all themes/languages. Check 320px collage framing, CTA wrapping and skeleton layouts; verify the address/map anchor during loading and API failure. No screenshots have been captured for this follow-up. Browser control is unavailable because the required execution tool is not exposed in this session.
