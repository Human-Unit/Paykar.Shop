import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advancedFilterCount,
  catalogApiQuery,
  catalogHref,
  catalogParameters,
  catalogFilterChanges,
  catalogPriceError,
  categoryFilterChanges,
  descendantCategories,
  resetCatalogFilters,
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

test("legacy decimal price presets normalize to whole-som API bounds", () => {
  const params = new URL(
    catalogHref(new URLSearchParams(combined), {
      min_price: "12.01",
      max_price: "18.25",
    }),
    "http://test",
  ).searchParams;
  const apiParams = new URL(catalogApiQuery(params), "http://test")
    .searchParams;
  assert.equal(apiParams.get("min_price"), "12");
  assert.equal(apiParams.get("max_price"), "19");
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
  assert.equal(advancedFilterCount(new URLSearchParams(combined)), 3);
  assert.equal(
    advancedFilterCount(new URLSearchParams(`${combined}&subcategory=fruit`)),
    4,
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

test("search, primary navigation, sort and quick toggles do not inflate the advanced badge", () => {
  assert.equal(
    advancedFilterCount(
      new URLSearchParams(
        "q=tea&category=drinks&sort=price_asc&in_stock=true&on_sale=true",
      ),
    ),
    0,
  );
  assert.equal(
    advancedFilterCount(new URLSearchParams("min_price=0&max_price=30")),
    1,
  );
});

test("a minimum discount enables sale, and switching sale off clears its minimum", () => {
  const initial = new URLSearchParams(
    "q=tea&category=drinks&unit=pack&min_price=10",
  );
  const discounted = catalogFilterChanges(initial, { min_discount: "20" });
  assert.equal(discounted.get("on_sale"), "true");
  assert.equal(initial.has("on_sale"), false);
  assert.equal(
    catalogParameters(new URLSearchParams("min_discount=30&on_sale=false")).get(
      "on_sale",
    ),
    "true",
  );
  const disabled = new URL(
    catalogHref(discounted, { on_sale: null }),
    "http://test",
  ).searchParams;
  assert.equal(disabled.has("on_sale"), false);
  assert.equal(disabled.has("min_discount"), false);
  for (const [key, value] of initial) assert.equal(disabled.get(key), value);
  // Removing only the minimum retains the independent quick sale toggle.
  const anySale = catalogFilterChanges(discounted, { min_discount: null });
  assert.equal(anySale.get("on_sale"), "true");
  assert.equal(anySale.has("min_discount"), false);
  const zero = catalogParameters(new URLSearchParams("min_discount=0"));
  assert.equal(zero.get("on_sale"), "true");
  assert.equal(zero.has("min_discount"), false);
});

test("invalid and incomplete prices cannot be used for a preview or apply", () => {
  for (const value of [
    "-1",
    "NaN",
    "Infinity",
    "1e3",
    "abc",
    "2.001",
    "10.5",
    "10.50",
    "9999999999.99",
    "10000000000",
    "3.",
  ])
    assert.equal(
      catalogPriceError(new URLSearchParams({ min_price: value })),
      "invalid_price",
      value,
    );
  for (const value of ["0", "10", "9999999999"])
    assert.equal(
      catalogPriceError(new URLSearchParams({ max_price: value })),
      null,
      value,
    );
  assert.equal(
    catalogPriceError(new URLSearchParams("min_price=30&max_price=10")),
    "reversed_price",
  );
  assert.equal(
    catalogPriceError(new URLSearchParams("min_price=10&max_price=10")),
    null,
  );
  assert.equal(catalogPriceError(new URLSearchParams()), null);
});

test("whole-som prices survive reload and preserve unrelated constraints", () => {
  const source = new URLSearchParams(
    "q=tea&min_price=10.50&max_price=20.25&in_stock=true",
  );
  const normalized = catalogParameters(source);
  assert.equal(normalized.get("min_price"), "10");
  assert.equal(normalized.get("max_price"), "21");
  assert.equal(normalized.get("q"), "tea");
  assert.equal(normalized.get("in_stock"), "true");
  assert.equal(source.get("min_price"), "10.50");
  assert.equal(catalogPriceError(normalized), null);
  assert.deepEqual(
    [...catalogParameters(new URLSearchParams(normalized.toString()))],
    [...normalized],
  );
});

test("draft reset keeps the shopper's search, category and sort without mutating applied state", () => {
  const applied = new URLSearchParams(`${combined}&subcategory=fruit`);
  const reset = resetCatalogFilters(applied);
  assert.equal(reset.get("q"), "tea");
  assert.equal(reset.get("category"), "drinks");
  assert.equal(reset.get("sort"), "price_asc");
  assert.equal(reset.size, 3);
  assert.equal(applied.get("min_discount"), "20");
  assert.equal(applied.get("page"), "3");
});

test("category transitions remove only incompatible children and retain compatible descendants", () => {
  const categories = [
    { id: 1, slug: "produce", name: "Produce", parent_id: null },
    { id: 2, slug: "fruit", name: "Fruit", parent_id: 1 },
    { id: 3, slug: "drinks", name: "Drinks", parent_id: null },
  ];
  const applied = new URLSearchParams(`${combined}&subcategory=fruit`);
  assert.equal(
    categoryFilterChanges(applied, categories, "produce").subcategory,
    undefined,
  );
  assert.equal(
    categoryFilterChanges(applied, categories, "drinks").subcategory,
    null,
  );
  const changed = new URL(
    catalogHref(applied, categoryFilterChanges(applied, categories, "drinks")),
    "http://test",
  ).searchParams;
  assert.equal(changed.has("subcategory"), false);
  assert.equal(changed.get("min_price"), "10");
  assert.equal(changed.get("unit"), "pack");
  assert.equal(changed.get("q"), "tea");
  assert.equal(changed.get("sort"), "price_asc");
  assert.equal(changed.has("page"), false);
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
