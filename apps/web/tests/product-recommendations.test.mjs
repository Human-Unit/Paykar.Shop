import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryRecommendations } from "../src/lib/product-recommendations.ts";

test("exclude current and connected IDs, deduplicate, then limit", () => {
  const rows = [1, 2, 3, 3, 4, 5, 6].map((id) => ({
    id,
    name: "same name",
    slug: "same-slug",
  }));
  const result = categoryRecommendations(1, [{ id: 2 }], rows, 3);
  assert.deepEqual(
    result.map((item) => item.id),
    [3, 4, 5],
  );
  assert.equal(result[0], rows[2]);
  assert.equal(rows.length, 7);
});
test("successful empty or fully excluded results produce no secondary row", () => {
  assert.deepEqual(
    categoryRecommendations(1, [{ id: 2 }], [{ id: 1 }, { id: 2 }]),
    [],
  );
  assert.deepEqual(categoryRecommendations(1, [], []), []);
});
test("missing connections leave unique category alternatives available", () => {
  assert.deepEqual(
    categoryRecommendations(
      1,
      [],
      [{ id: 1 }, { id: 2 }, { id: 2 }, { id: 3 }],
    ),
    [{ id: 2 }, { id: 3 }],
  );
});
