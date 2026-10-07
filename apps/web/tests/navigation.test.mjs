import assert from "node:assert/strict";
import { test } from "node:test";
import {
  destinations,
  primaryNavigation,
  mobileNavigation,
  navigationGroups,
  isNavigationActive,
} from "../src/lib/navigation.ts";

test("shopping destinations have stable order on desktop and mobile", () => {
  assert.deepEqual(
    primaryNavigation.map((item) => item.id),
    ["catalog", "shopping", "promotions", "stores"],
  );
  assert.deepEqual(
    mobileNavigation.map((item) => item.id),
    ["catalog", "shopping", "promotions", "cart"],
  );
  const ids = navigationGroups.flatMap((group) =>
    group.items.map((item) => item.id),
  );
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("saved"));
});
test("Catalog is active on catalog, nested categories and product pages", () => {
  for (const path of [
    "/catalog",
    "/catalog/",
    "/catalog/produce",
    "/catalog/produce/fruit",
    "/product/black-tea",
    "/catalog?q=tea",
    "/catalog#products",
  ])
    assert.equal(isNavigationActive(destinations.catalog, path), true, path);
});
test("My Shopping is active on overview and all template editors", () => {
  for (const path of [
    "/my-shopping",
    "/my-shopping#history",
    "/my-shopping/templates/new",
    "/my-shopping/templates/curated-weekly",
    "/my-shopping/templates/personal-id",
  ])
    assert.equal(isNavigationActive(destinations.shopping, path), true, path);
});
test("matching respects path boundaries and does not activate unrelated routes", () => {
  for (const path of [
    "/",
    "/catalogue",
    "/catalog-other",
    "/products",
    "/productivity",
    "/promotions",
    "/cart",
    "/my-shopping",
  ])
    assert.equal(isNavigationActive(destinations.catalog, path), false, path);
  for (const path of [
    "/my-shopping-other",
    "/my-shopping-list",
    "/saved",
    "/order/123",
    "/checkout",
    "/catalog",
  ])
    assert.equal(isNavigationActive(destinations.shopping, path), false, path);
  assert.equal(
    isNavigationActive(destinations.promotions, "/promotions-other"),
    false,
  );
  assert.equal(isNavigationActive(destinations.stores, "/stores"), true);
});
