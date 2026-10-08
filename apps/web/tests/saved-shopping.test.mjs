import assert from "node:assert/strict";
import { test } from "node:test";
import {
  savedConnections,
  savedRecommendations,
} from "../src/lib/saved-shopping.ts";
import {
  parseViewingHistory,
  recordViewedProduct,
} from "../src/lib/viewing-history.ts";

const product = (id, stock_quantity = "3", is_active = true) => ({
  id,
  stock_quantity,
  is_active,
});

test("recommendations prioritize curated IDs, then real bread complements, then catalog", () => {
  const p = (id, slug) => ({ ...product(id), slug });
  const bread = p(18, "baguette");
  const catalog = [
    bread,
    p(1, "apples-red"),
    p(8, "milk"),
    p(13, "butter"),
    p(14, "cheese"),
    p(34, "honey"),
    p(28, "coffee"),
    p(26, "black-tea"),
  ];
  assert.deepEqual(
    savedRecommendations(
      [bread],
      [{ items: [catalog[6], catalog[6], bread] }],
      catalog,
      [18],
    ).map((p) => p.id),
    [28, 13, 14, 8, 34],
  );
  assert.deepEqual(
    savedRecommendations([bread], [], catalog, [18]).map((p) => p.id),
    [13, 14, 8, 34, 28],
  );
});

test("recommendation fallback handles empty catalogs and never fills with unavailable/fake products", () => {
  const catalog = [
    { ...product(1), slug: "one" },
    { ...product(2, "0"), slug: "two" },
    { ...product(3, "2", false), slug: "three" },
    { ...product(4), slug: "four" },
  ];
  assert.deepEqual(
    savedRecommendations([], [], catalog, [1]).map((p) => p.id),
    [4],
  );
  assert.deepEqual(savedRecommendations([], [], [], []), []);
});

test("viewing history rejects corrupt data and invalid IDs, deduplicates and bounds storage", () => {
  for (const raw of ["invalid", "null", "{}", '"abc"'])
    assert.deepEqual(parseViewingHistory(raw), []);
  assert.deepEqual(parseViewingHistory('[1,"2",null,0,-1,1,2,2.5]'), [1, 2]);
  assert.equal(
    parseViewingHistory(
      JSON.stringify(Array.from({ length: 30 }, (_, i) => i + 1)),
    ).length,
    24,
  );
});

test("revisited products move to the front without duplication; invalid visits change nothing", () => {
  assert.deepEqual(recordViewedProduct("[4,3,2]", 3), [3, 4, 2]);
  assert.deepEqual(recordViewedProduct("[4,3,2]", 0), [4, 3, 2]);
  assert.deepEqual(recordViewedProduct("corrupt", 4), [4]);
  assert.equal(
    recordViewedProduct(
      JSON.stringify(Array.from({ length: 24 }, (_, i) => i + 1)),
      25,
    ).length,
    24,
  );
});

test("saved complements exclude saved IDs and duplicate targets before limiting", () => {
  const groups = [
    { items: [product(1), product(2), product(2)] },
    { items: [product(3), product(4), product(5)] },
  ];
  assert.deepEqual(
    savedConnections(groups, [1, 3], 2).map((p) => p.id),
    [2, 4],
  );
  assert.equal(groups[0].items.length, 3);
});
test("saved complements contain only current available manual connections", () => {
  const groups = [
    {
      items: [
        product(1, "0"),
        product(2, "0.5"),
        product(3, "4", false),
        product(4),
      ],
    },
  ];
  assert.deepEqual(
    savedConnections(groups, []).map((p) => p.id),
    [4],
  );
  assert.deepEqual(savedConnections([], []), []);
  assert.deepEqual(savedConnections(groups, [4]), []);
});
