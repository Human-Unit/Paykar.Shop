import assert from "node:assert/strict";
import { test } from "node:test";
import {
  statusPresentation,
  measurementLabel,
  quantity,
  money,
  productProblems,
} from "../src/lib/admin-presentation.ts";
test("operational statuses humanize supported lifecycle without inventing transitions", () => {
  assert.deepEqual(statusPresentation("pending"), {
    label: "New",
    tone: "info",
  });
  assert.deepEqual(statusPresentation("completed"), {
    label: "Delivered",
    tone: "positive",
  });
  assert.equal(statusPresentation("Low stock").tone, "warning");
  assert.equal(statusPresentation("Invalid measurement").tone, "danger");
  assert.equal(statusPresentation("Unsaved changes").label, "Unsaved changes");
  assert.equal(statusPresentation("constructor").label, "constructor");
});
test("grocery display preserves stock units, precision and absent monetary values", () => {
  assert.equal(measurementLabel("DUAL"), "Pieces or weight");
  assert.equal(measurementLabel("WEIGHT"), "By weight");
  assert.equal(measurementLabel("__proto__"), "Unknown sale mode");
  assert.equal(quantity("31.425", { price_unit: "KG" }), "31.425 kg");
  assert.equal(quantity("6", { price_unit: "PIECE" }), "6 pcs");
  assert.equal(quantity("6.125", { price_unit: "PIECE" }), "6.125 pcs");
  assert.equal(money("22.00"), "22.00 TJS");
  assert.equal(money(null), "—");
});
test("product warnings retain all actual problems and distinguish unavailable from low stock", () => {
  assert.deepEqual(
    productProblems({
      is_active: false,
      stock_quantity: 0,
      low_stock: false,
      missing_image: true,
      invalid_measurement: true,
    }),
    ["Disabled", "Invalid measurement", "Out of stock", "Missing image"],
  );
  assert.deepEqual(
    productProblems({
      is_active: true,
      stock_quantity: 1,
      low_stock: true,
      image_url: "/images/product.webp",
    }),
    ["Low stock"],
  );
  assert.deepEqual(
    productProblems({
      is_active: true,
      stock_quantity: 12,
      low_stock: false,
      image_url: "/images/product.webp",
    }),
    [],
  );
});
