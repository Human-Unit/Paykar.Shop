import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeFilterCount,
  catalogApiQuery,
  catalogHref,
  catalogParameters,
  descendantCategories,
} from "../src/lib/catalog-query.ts";

const combined =
  "q=tea&category=drinks&min_price=10&max_price=30&in_stock=true&on_sale=true&min_discount=20&unit=pack&sort=price_asc&page=3";

test("legacy category routes and query category both map to the API", () => {
  const state = catalogParameters(
    new URLSearchParams("q=tea&min_price=10"),
    "drinks",
  );
  assert.equal(state.get("category"), "drinks");
  assert.equal(state.get("q"), "tea");
  assert.equal(
    catalogParameters(new URLSearchParams("category=produce"), "drinks").get(
      "category",
    ),
    "produce",
  );
  assert.equal(
    new URL(catalogApiQuery(state), "http://test").searchParams.get("category"),
    "drinks",
  );
});

test("switching category preserves all unrelated filters and resets pagination", () => {
  const url = new URL(
    catalogHref(new URLSearchParams(combined), { category: "sweets" }),
    "http://test",
  );
  assert.equal(url.searchParams.get("category"), "sweets");
  assert.equal(url.searchParams.has("page"), false);
  for (const key of [
    "q",
    "min_price",
    "max_price",
    "in_stock",
    "on_sale",
    "min_discount",
    "unit",
    "sort",
  ])
    assert.equal(
      url.searchParams.get(key),
      new URLSearchParams(combined).get(key),
    );
});

test("removing one group leaves every other constraint intact", () => {
  const url = new URL(
    catalogHref(new URLSearchParams(combined), {
      min_price: null,
      max_price: null,
    }),
    "http://test",
  );
  assert.equal(url.searchParams.has("min_price"), false);
  assert.equal(url.searchParams.has("max_price"), false);
  for (const key of [
    "category",
    "q",
    "in_stock",
    "on_sale",
    "min_discount",
    "unit",
    "sort",
  ])
    assert.equal(
      url.searchParams.get(key),
      new URLSearchParams(combined).get(key),
    );
  const noCategory = new URL(
    catalogHref(catalogParameters(new URLSearchParams("q=tea"), "drinks"), {
      category: null,
    }),
    "http://test",
  );
  assert.equal(noCategory.pathname, "/catalog");
  assert.equal(noCategory.searchParams.has("category"), false);
  assert.equal(noCategory.searchParams.get("q"), "tea");
});

test("price presets use the same API price parameters", () => {
  const params = new URL(
    catalogHref(new URLSearchParams(combined), {
      min_price: "12.01",
      max_price: "18.00",
    }),
    "http://test",
  ).searchParams;
  const apiParams = new URL(catalogApiQuery(params), "http://test")
    .searchParams;
  assert.equal(apiParams.get("min_price"), "12.01");
  assert.equal(apiParams.get("max_price"), "18.00");
  assert.equal(apiParams.get("min_discount"), "20");
  assert.equal(apiParams.get("unit"), "pack");
});

test("pagination retains search, filters and sorting", () => {
  const url = new URL(
    catalogHref(new URLSearchParams(combined), { page: "4" }),
    "http://test",
  );
  assert.equal(url.searchParams.get("page"), "4");
  for (const [key, value] of new URLSearchParams(combined))
    if (key !== "page") assert.equal(url.searchParams.get(key), value);
});

test("URL snapshots round-trip for reload and history without separate applied state", () => {
  const first = catalogParameters(new URLSearchParams(combined));
  const second = new URL(
    catalogHref(first, { q: "Ҷумҳурии Тоҷикистон" }),
    "http://test",
  ).searchParams;
  assert.deepEqual(
    [...catalogParameters(new URLSearchParams(second.toString()))],
    [...catalogParameters(second)],
  );
  assert.equal(
    catalogParameters(new URLSearchParams(first.toString())).get("q"),
    "tea",
  );
  assert.equal(
    catalogParameters(new URLSearchParams(second.toString())).get("q"),
    "Ҷумҳурии Тоҷикистон",
  );
});

test("filter counts use groups and defaults are sensible", () => {
  assert.equal(activeFilterCount(new URLSearchParams(combined)), 6);
  assert.equal(
    activeFilterCount(new URLSearchParams(`${combined}&subcategory=fruit`)),
    7,
  );
  assert.equal(catalogHref(new URLSearchParams()), "/catalog");
  assert.equal(
    catalogParameters(new URLSearchParams("page=bad&sort=bad&in_stock=false"))
      .size,
    0,
  );
  assert.equal(
    catalogHref(new URLSearchParams("sort=price_asc"), { sort: "name" }),
    "/catalog",
  );
});

test("subcategories follow real hierarchy, with bounded traversal", () => {
  const categories = [
    { id: 1, slug: "produce", name: "Produce", parent_id: null },
    { id: 2, slug: "fruit", name: "Fruit", parent_id: 1 },
    { id: 3, slug: "citrus", name: "Citrus", parent_id: 2 },
    { id: 4, slug: "drinks", name: "Drinks", parent_id: null },
  ];
  assert.deepEqual(
    descendantCategories(categories, "produce").map((item) => item.slug),
    ["fruit", "citrus"],
  );
  assert.deepEqual(descendantCategories(categories, "drinks"), []);
});
