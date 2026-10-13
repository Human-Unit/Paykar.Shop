import assert from "node:assert/strict";
import { test } from "node:test";
import { adminListParameters } from "../src/lib/admin-list-state.ts";
test("admin URL state retains bounded server-side list controls across reload", () => {
  const query = adminListParameters(
    "products",
    "q=milk&category_id=4&stock=available&sort=-price&page=2",
  );
  assert.equal(query.get("page"), "2");
  assert.equal(query.get("q"), "milk");
  assert.equal(query.get("sort"), "-price");
  assert.equal(
    query.toString(),
    adminListParameters("products", query.toString()).toString(),
  );
});
test("unsafe list state cannot choose arbitrary sorting or drop promotion scope", () => {
  const query = adminListParameters(
    "promotions",
    "page=-1&sort=__proto__&sale=false&category_id=bad&stock=unknown",
  );
  assert.equal(query.get("sale"), "true");
  assert.equal(query.get("page"), "1");
  assert.equal(query.get("sort"), "id");
  assert.equal(query.has("category_id"), false);
  assert.equal(query.has("stock"), false);
  assert.equal(
    adminListParameters("orders", "status=made-up").has("status"),
    false,
  );
  assert.equal(
    adminListParameters(
      "orders",
      "q=reference&status=completed&sort=-total",
    ).get("status"),
    "completed",
  );
});
