# Grocery measurement and ordering

This is the canonical reference for Paykar grocery quantity semantics. The public
store remains guest-based. Measurement does not change delivery pricing/routing,
payment contracts or the approved storefront composition.

## Product configuration

| Mode   | Pricing unit | Customer input                 | Average piece weight            |
| ------ | ------------ | ------------------------------ | ------------------------------- |
| PIECE  | PIECE        | Integer pieces                 | Not allowed                     |
| WEIGHT | KG           | Integer grams, displayed as kg | Not allowed                     |
| DUAL   | KG           | Pieces or grams                | Required positive integer grams |

`quantity_step` and `minimum_quantity` are integer pieces for PIECE (step 1,
minimum 1–99) and integer grams for WEIGHT/DUAL. Weighted minimum must be a
multiple of the step. In DUAL piece mode the count minimum/step are both 1;
weight-mode minimum/step apply only to weight requests. Limits are 99 pieces and
99,000 grams per product, including aggregated duplicate requests.

The banana demo SKU `DEMO-002`, slug `bananas`, explicitly uses DUAL, KG, 180 g
average, 100 g step and 100 g minimum. Its existing price stays **22.00 TJS/kg**:
6 pieces → approximately 1,080 g → **23.76 TJS**. The specification's 14.90 TJS/kg
example is tested separately: 6 × 180 g → **16.09 TJS**. These weights are configured
demo estimates, not claims about physical goods. No fruit-specific UI logic exists.

## Requests and persistence

New API lines contain exactly one discriminated quantity:

```json
{ "product_id": 2, "purchase_mode": "PIECE", "piece_count": 6 }
```

```json
{ "product_id": 2, "purchase_mode": "WEIGHT", "requested_weight_g": 1000 }
```

The API rejects contradictory fields, fractions of a piece, zero/negative values,
unsupported product modes and client-supplied prices/estimated weights. Duplicate
lines of one mode are combined; mixed modes for one product are rejected. Delivery
provider work still precedes stock locks and the atomic order transaction.

The frontend keeps one line per product. `quantity` is integer pieces in PIECE mode
or integer grams in WEIGHT mode, with `purchase_mode` persisted beside it. The
canonical `cartRequest` helper serializes it to the API representation above.
Changing mode happens before adding a product; an existing cart line retains its
original mode until removed. Cart edits, template saving/editing, bulk add and
repeat preserve the chosen mode. Different-mode bulk adds do not silently replace
an existing line and report an adjustment.

Existing `paykar-demo-cart-v1` arrays and template version 1 remain readable.
The additive line format is validated; corrupt records cannot crash the cart.
Legacy `{product_id, quantity}` remains accepted by the API and means multiples
of the product's **pricing unit**: 2 PIECE units = 2 pieces; 2 KG units = 2,000 g.
This preserves the former one-kilogram banana package semantics. Legacy cart lines
are normalized after catalog data loads; the next mutation saves explicit modes.
Template previews similarly resolve legacy records through current product data.
No fabricated history or replacement products are introduced.

## Pricing and inventory

Backend `app/services/measurement.py` owns conversions and final pricing. Integer
grams are converted to Decimal kilograms only for money/stock operations.
Money is rounded **per line**, half-up to two TJS decimal places; subtotal is the
sum of rounded line totals. Frontend `lib/measurement.ts` uses integer/BigInt cents
with identical rounding for presentation. Neither uses binary floats for final
monetary arithmetic. Backend current prices and stock remain authoritative.

Stock storage deliberately remains `Numeric(12,3)` in the price unit: pieces for
PIECE, kilograms for WEIGHT/DUAL. The conversion service exposes integer grams or
available pieces. A six-banana order deducts 1.080 kg, not six stock units.
This avoids a disruptive reinterpretation of the existing stock column. Stock
limits are rounded down to valid steps. Admin stock labels/forms explain these
units; when deliberately changing a product's sale mode, the administrator must
review stock and price because no automatic count-to-weight conversion is inferred.

## Immutable orders and estimated/final amounts

Order items retain existing `quantity`, `unit_price`, `total_price` fields:
quantity represents pieces or Decimal kg in the **snapshotted pricing unit**.
Added snapshots include purchase mode, requested pieces or grams, estimated grams,
average-piece-weight grams, price unit, nullable actual packed grams, and
`is_estimated`. Existing `unit_price` is the price-per-unit snapshot.

Historical totals never look up current product price or average weight. New
DUAL-by-piece lines and totals show `≈`; weight requests and ordinary PIECE orders
retain exact formatting. Confirmation, checkout and order history use snapshots.
Repeat resolves availability/current pricing again; modern weighted snapshots
preserve requested pieces/grams. Historical PIECE-pricing snapshots retain legacy
price-unit quantity interpretation when passed back through the preview service.

`estimated_line_total` aliases the original line total. `final_line_total` uses
actual grams and snapshotted kg price if actual packed weight exists; otherwise
it equals estimated. `estimated_order_total` aliases the checkout total;
`final_order_total` sums final lines plus fixed delivery. The current demo never
writes actual packed weight, so final = estimated. No fulfillment edit endpoint,
payment adjustment, stock correction or weighing-hardware workflow is added.
Any future actual-weight writer must atomically reconcile physical stock, totals
and payment semantics; nullable storage alone is not a fulfillment workflow.

## Migration

Alembic `0005_grocery_measurement` adds conservative PIECE defaults to all products,
and preserves historical order prices/quantities as PIECE-pricing snapshots.
Only the known one-kg banana demo SKU is opted into DUAL; price and physical stock
are unchanged. New demo seed metadata matches that configuration. No name-based
classification or wholesale reseed occurs. Downgrade removes added metadata;
decimal quantity/money columns remain. Downgrading after real weighted orders is
not recommended because the old UI cannot explain their measurement semantics.

## Validation evidence

Verified against the rebuilt Docker project `test_task_paykar_shop`, frontend
`http://localhost:3000`, API `http://localhost:8080`. The pending presentation-admin
startup changes and local ignored credentials were preserved. No commit or push.

| Check                                                                        | Result                                                                                                                  |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                       | PASS                                                                                                                    |
| `npm run lint` (zero warnings)                                               | PASS                                                                                                                    |
| `npm run typecheck`                                                          | PASS                                                                                                                    |
| `node --test tests/*.test.mjs`                                               | 53 passed, zero failures/skips                                                                                          |
| Production `npm run build` in Docker                                         | PASS                                                                                                                    |
| `docker compose -p test_task_paykar_shop exec -T api python tools/verify.py` | 179 passed, zero failures/skips; compileall, Ruff, migrations and drift check PASS                                      |
| Alembic current                                                              | `0005_grocery_measurement`                                                                                              |
| Disposable migration data test                                               | Upgrade from 0004, historical snapshots, conservative defaults, banana stock/price, downgrade/re-upgrade PASS           |
| `git diff --check`                                                           | PASS                                                                                                                    |
| `docker compose -p test_task_paykar_shop up -d --build --wait`               | Rebuilt/recreated actual services; API, web and PostgreSQL healthy; seed exits successfully without overwriting catalog |

Backend order tests use mocked routing in an owned disposable PostgreSQL database.
All owned verification/migration databases were removed. No live demo orders or
catalog/stock edits were made by browser QA. Live migration intentionally updated
the banana configuration; ordinary products and historical financial values remain
unchanged. Authenticated read-only admin API verification confirmed all banana
measurement settings and logged out afterward.

Browser plugin not available (the required browser skill is not listed); rendered
QA used Playwright Chromium through the Playwright MCP. Covered product → cart →
reload → checkout in piece and weight modes, and ordinary milk in piece mode.
Checked 390/768/1024/1440 in RU/TJ/EN, dark/light (24 cases), with reduced motion in
light cases and touch emulation on mobile dark cases. No document overflow or page
errors. Fresh final product/catalog checks also captured zero console errors.
Checked keyboard mode selection, 52 px primary mobile action, legacy cart
normalization, and personal template save/edit/reload for both pieces and kilograms.

The browser banana estimate was 6 pcs → approximately 1.08 kg → 23.76 TJS at the
existing 22.00 TJS/kg price. A weight purchase at 1.2 kg could be incremented to
1.3 kg and survived reload; no piece-estimate disclosure appeared for an exact
weight request. Checkout displayed the approximate weight, line amount and helper
for piece-selected DUAL goods. Order creation, stock deduction and historical
snapshot stability were verified through disposable-DB integration tests, not a
new persistent browser order. Admin settings were read through the actual admin
API; an authenticated admin-editor interaction was not completed in browser.

Mismatch ledger: inherited green-button foreground initially made quantity text
and icons too dark against the detail stage. Scoped PurchaseControl styles fixed
both; final computed foreground is `rgb(245, 245, 245)` in dark mode. Original
page geometry, imagery and shell remain intact. No further redesign performed.

Screenshots are temporary evidence outside the repository:

- `Temp/paykar-measurement-banana-final-1440.png`
- `Temp/paykar-measurement-banana-final-390.png`
- `Temp/paykar-measurement-checkout-1440.png`
- `Temp/paykar-measurement-en-cart-390.png`
- `Temp/paykar-measurement-tj-light-cart-390.png`

Remaining limitations: actual packed-weight entry/reconciliation is deliberately
future work; stock storage is kg rather than a new integer-gram column; price and
availability can change until checkout's authoritative revalidation. Physical
devices and browsers other than Chromium are unverified. Existing non-blocking
Node module-type and Starlette/AnyIO deprecation warnings remain unchanged.
