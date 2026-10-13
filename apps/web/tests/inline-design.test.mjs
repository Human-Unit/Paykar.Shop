import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultDesign,
  validDesign,
  setScopedToken,
  resolveDesign,
  resetDesignScope,
  publishedDesignCss,
  designEditState,
} from "../src/lib/design-config.ts";
import {
  designPageForPath,
  designRegions,
  regionSupports,
} from "../src/lib/design-registry.ts";

test("registry matches path boundaries and explicit safe controls", () => {
  assert.equal(designPageForPath("/my-shopping/templates/new"), "myShopping");
  assert.equal(designPageForPath("/catalog/bakery"), "catalog");
  assert.equal(designPageForPath("/product/bananas"), "product");
  assert.equal(designPageForPath("/admin/master/design"), null);
  assert.equal(designPageForPath("/administrator"), "information");
  assert.equal(regionSupports("home.hero", "colors.brand"), true);
  assert.equal(regionSupports("arbitrary.div", "colors.brand"), false);
  assert.equal(regionSupports("home.hero", "layout.content_width"), false);
  for (const region of Object.values(designRegions))
    assert.ok(region.label && region.page && region.controls.length);
});
test("global then page then section, with scoped reset preserving neighbors", () => {
  let config = setScopedToken(
    defaultDesign,
    { kind: "global" },
    "colors.brand",
    "#112233",
  );
  config = setScopedToken(
    config,
    { kind: "page", id: "home" },
    "colors.brand",
    "#223344",
  );
  config = setScopedToken(
    config,
    { kind: "section", id: "home.hero" },
    "colors.brand",
    "#334455",
  );
  assert.equal(
    resolveDesign(config, "home", "home.hero").colors.brand,
    "#334455",
  );
  assert.equal(
    resolveDesign(config, "home", "home.offers").colors.brand,
    "#223344",
  );
  assert.equal(resolveDesign(config, "catalog").colors.brand, "#112233");
  const reset = resetDesignScope(config, { kind: "section", id: "home.hero" });
  assert.equal(
    resolveDesign(reset, "home", "home.hero").colors.brand,
    "#223344",
  );
  assert.equal(config.sections["home.hero"]["colors.brand"], "#334455");
  const globalReset = resetDesignScope(config, { kind: "global" });
  assert.equal(globalReset.colors.brand, defaultDesign.colors.brand);
  assert.deepEqual(globalReset.sections, config.sections);
});
test("canonical token overrides still override a non-default parent", () => {
  let config = setScopedToken(
    defaultDesign,
    { kind: "global" },
    "colors.brand",
    "#112233",
  );
  config = setScopedToken(
    config,
    { kind: "section", id: "home.hero" },
    "colors.brand",
    defaultDesign.colors.brand,
  );
  assert.match(
    publishedDesignCss(config),
    /data-design-region="home.hero"\]\{--paykar-green:#00a82d/,
  );
  assert.equal(
    publishedDesignCss({ ...defaultDesign, pages: {}, sections: {} }),
    "",
  );
});
test("sparse allowlists reject injection, unsupported regions, unsafe values", () => {
  for (const config of [
    { ...defaultDesign, pages: { unknown: {} } },
    {
      ...defaultDesign,
      sections: { "home.hero": { "colors.brand": "red;display:none" } },
    },
    {
      ...defaultDesign,
      sections: { "home.hero": { "layout.content_width": 1200 } },
    },
    { ...defaultDesign, pages: { home: { "radius.card": 100 } } },
    { ...defaultDesign, pages: { home: { "colors.dark.surface": false } } },
    { ...defaultDesign, pages: { home: { "__proto__.x": 4 } } },
  ]) {
    assert.equal(validDesign(config), false);
    assert.equal(publishedDesignCss(config), "");
  }
  assert.throws(() =>
    setScopedToken(
      defaultDesign,
      { kind: "section", id: "home.hero" },
      "radius.button",
      12,
    ),
  );
});
test("local preview and saved draft state are independent of collapse or route selection", () => {
  const saved = structuredClone(defaultDesign);
  const local = setScopedToken(
    saved,
    { kind: "section", id: "home.hero" },
    "radius.panel",
    30,
  );
  assert.equal(designEditState(local, saved, 7), "unsaved");
  assert.equal(designEditState(local, local, 7), "draft");
  assert.equal(designEditState(local, local, null), "published");
  // Route/selection UI state is not stored in config and cannot mutate it.
  resolveDesign(local, "catalog");
  assert.equal(designEditState(local, saved, 7), "unsaved");
  assert.deepEqual(saved, defaultDesign);
});
