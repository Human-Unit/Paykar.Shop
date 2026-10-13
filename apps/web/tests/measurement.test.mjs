import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lineCents,
  weightGrams,
  isEstimated,
  normalizeLine,
  cartRequest,
  stockLimit,
  quantityLabel,
} from "../src/lib/measurement.ts";
import { validItems, mergeShoppingCart } from "../src/lib/shopping.ts";

const banana = {
  id: 1,
  measurement_mode: "DUAL",
  price_unit: "KG",
  average_piece_weight_g: 180,
  quantity_step: 100,
  minimum_quantity: 100,
  price: "14.90",
  stock_quantity: "32.000",
  is_active: true,
};
test("DUAL piece estimate uses exact grams and half-up cents", () => {
  const line = { product_id: 1, quantity: 6, purchase_mode: "PIECE" };
  assert.equal(weightGrams(banana, line), 1080);
  assert.equal(lineCents(banana, line), 1609);
  assert.equal(isEstimated(banana, line), true);
  assert.deepEqual(cartRequest(line), {
    product_id: 1,
    purchase_mode: "PIECE",
    piece_count: 6,
  });
});
test("DUAL weight and exact PIECE keep correct pricing units", () => {
  const line = { product_id: 1, quantity: 1000, purchase_mode: "WEIGHT" };
  assert.equal(lineCents(banana, line), 1490);
  assert.equal(isEstimated(banana, line), false);
  assert.deepEqual(cartRequest(line), {
    product_id: 1,
    purchase_mode: "WEIGHT",
    requested_weight_g: 1000,
  });
  assert.equal(
    lineCents(
      { price: "8.00", price_unit: "PIECE" },
      { product_id: 2, quantity: 3, purchase_mode: "PIECE" },
    ),
    2400,
  );
  assert.equal(
    lineCents({ ...banana, price: "0.10" }, { ...line, quantity: 50 }),
    1,
  );
});
test("legacy quantity keeps price-unit meaning without losing persisted mode", () => {
  assert.deepEqual(normalizeLine({ product_id: 1, quantity: 2 }, banana), {
    product_id: 1,
    quantity: 2000,
    purchase_mode: "WEIGHT",
  });
  assert.deepEqual(
    normalizeLine({ product_id: 2, quantity: 2 }, { price_unit: "PIECE" }),
    { product_id: 2, quantity: 2, purchase_mode: "PIECE" },
  );
  const line = { product_id: 1, quantity: 6, purchase_mode: "PIECE" };
  assert.deepEqual(validItems(JSON.parse(JSON.stringify([line]))), [line]);
  assert.deepEqual(
    validItems([{ product_id: 1, quantity: 1000, purchase_mode: "WEIGHT" }]),
    [{ product_id: 1, quantity: 1000, purchase_mode: "WEIGHT" }],
  );
  assert.deepEqual(
    validItems([{ product_id: 1, quantity: 1, purchase_mode: "INVALID" }]),
    [],
  );
});
test("stock limits convert kg into grams and pieces conservatively", () => {
  assert.equal(stockLimit({ ...banana, stock_quantity: "0.359" }, "PIECE"), 1);
  assert.equal(
    stockLimit({ ...banana, stock_quantity: "0.359" }, "WEIGHT"),
    300,
  );
  assert.equal(
    quantityLabel(
      { product_id: 1, quantity: 1250, purchase_mode: "WEIGHT" },
      (s) => s,
    ),
    "1.25 кг",
  );
});
test("bulk add preserves weighted mode and caps by available stock", () => {
  const row = {
    product_id: 1,
    product: { ...banana, stock_quantity: "1.000" },
    purchase_mode: "WEIGHT",
    requested_quantity: 1200,
    available_quantity: 1000,
    availability: "available",
  };
  const result = mergeShoppingCart([], [row]);
  assert.deepEqual(result.items, [
    { product_id: 1, quantity: 1000, purchase_mode: "WEIGHT" },
  ]);
  assert.equal(result.summary.adjusted, 1);
});
