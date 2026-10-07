import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mergeShoppingCart,
  parseOrderIds,
  parseTemplates,
  validItems,
} from "../src/lib/shopping.ts";

const id = "12345678-1234-1234-1234-123456789012";
const template = {
  id,
  name: "My week",
  created_at: "2026-10-07T10:00:00Z",
  updated_at: "2026-10-07T10:00:00Z",
  items: [{ product_id: 1, quantity: 2 }],
};
const product = { id: 1, is_active: true, stock_quantity: "3", price: "99.00" };
const row = {
  product_id: 1,
  requested_quantity: 5,
  available_quantity: 3,
  availability: "available",
  product,
};

test("template storage validates schema, quantities, IDs and version", () => {
  const valid = parseTemplates(
    JSON.stringify({ version: 1, templates: [template] }),
  );
  assert.equal(valid.length, 1);
  assert.equal(valid[0].items[0].quantity, 2);
  for (const raw of [
    "null",
    "oops",
    "[]",
    JSON.stringify({ version: 2, templates: [template] }),
  ])
    assert.deepEqual(parseTemplates(raw), []);
  assert.deepEqual(
    validItems([
      { product_id: -1, quantity: 1 },
      { product_id: 1, quantity: 0 },
      { product_id: 2, quantity: 100 },
      { product_id: 3, quantity: 1.5 },
    ]),
    [],
  );
  assert.equal(
    parseTemplates(
      JSON.stringify({
        version: 1,
        templates: [template, template, { ...template, id: "bad" }],
      }),
    ).length,
    1,
  );
});
test("personal storage caps templates and product lines", () => {
  const templates = Array.from({ length: 25 }, (_, i) => ({
    ...template,
    id: `12345678-1234-1234-1234-${String(i).padStart(12, "0")}`,
  }));
  assert.equal(
    parseTemplates(JSON.stringify({ version: 1, templates })).length,
    20,
  );
  assert.equal(
    validItems(
      Array.from({ length: 60 }, (_, i) => ({
        product_id: i + 1,
        quantity: 1,
      })),
    ).length,
    48,
  );
});
test("history stores only unique capability UUIDs, never order snapshots", () => {
  assert.deepEqual(parseOrderIds(JSON.stringify([id, id, "bad", {}, 1])), [id]);
  assert.deepEqual(parseOrderIds("{}"), []);
});
test("repeat uses current stock including current cart and preserves inputs", () => {
  const current = [{ product_id: 1, quantity: 1 }];
  const before = JSON.stringify(current);
  const result = mergeShoppingCart(current, [row]);
  assert.deepEqual(result.items, [{ product_id: 1, quantity: 3 }]);
  assert.equal(result.summary.added, 2);
  assert.equal(result.summary.adjusted, 1);
  assert.equal(JSON.stringify(current), before);
  assert.equal(row.requested_quantity, 5);
  assert.equal("price" in result.items[0], false);
});
test("partial repeats preserve valid products and report missing/inactive/empty", () => {
  const result = mergeShoppingCart(
    [],
    [
      row,
      { ...row, product_id: 2, availability: "missing", product: null },
      { ...row, product_id: 3, availability: "unavailable", product: null },
      {
        ...row,
        product_id: 4,
        product: { ...product, id: 4, stock_quantity: "0" },
      },
    ],
  );
  assert.equal(result.summary.added, 3);
  assert.equal(result.summary.missing, 1);
  assert.equal(result.summary.unavailable, 2);
});
test("cart capacity and 99 unit limits hold without negative quantities", () => {
  const current = Array.from({ length: 48 }, (_, i) => ({
    product_id: i + 2,
    quantity: 1,
  }));
  assert.equal(mergeShoppingCart(current, [row]).summary.full, 1);
  const result = mergeShoppingCart(
    [{ product_id: 1, quantity: 99 }],
    [{ ...row, product: { ...product, stock_quantity: "200" } }],
  );
  assert.equal(result.items[0].quantity, 99);
  assert.equal(result.summary.added, 0);
});
