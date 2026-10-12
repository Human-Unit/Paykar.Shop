import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultDesign,
  designEntries,
  designVariables,
  publishedDesignCss,
  setDesignToken,
  validDesign,
} from "../src/lib/design-config.ts";

test("Paykar Default does not override any approved CSS or breakpoint", () => {
  assert.equal(validDesign(defaultDesign), true);
  assert.deepEqual(designVariables(defaultDesign, "dark"), {});
  assert.deepEqual(designVariables(defaultDesign, "light"), {});
  assert.equal(publishedDesignCss(defaultDesign), "");
});
test("typed updates do not mutate the baseline and affect only selected tokens", () => {
  const next = setDesignToken(defaultDesign, "colors.brand", "#128844");
  assert.equal(defaultDesign.colors.brand, "#00a82d");
  assert.deepEqual(designVariables(next, "dark"), {
    "--paykar-green": "#128844",
  });
  assert.throws(() => setDesignToken(next, "__proto__.color", "#000000"));
});
test("injection, unknown fields, missing fields and unsafe ranges are rejected", () => {
  for (const [path, value] of [
    ["colors.brand", "#fff;display:none"],
    ["layout.content_width", 50],
    ["radius.card", 999],
    ["motion.intensity", -1],
    ["effects.glass_blur", 80],
    ["typography.body_scale", Infinity],
  ]) {
    const candidate = setDesignToken(defaultDesign, path, value);
    assert.equal(validDesign(candidate), false);
    assert.equal(publishedDesignCss(candidate), "");
  }
  assert.equal(validDesign({ ...defaultDesign, arbitrary_css: "red" }), false);
  assert.equal(validDesign({ colors: defaultDesign.colors }), false);
});
test("theme palette changes stay local to the intended theme", () => {
  const next = setDesignToken(defaultDesign, "colors.light.surface", "#fafafa");
  assert.deepEqual(designVariables(next, "dark"), {});
  assert.deepEqual(designVariables(next, "light"), { "--surface": "#fafafa" });
});
test("layout overrides retain bounded mobile gutters and responsive rhythm", () => {
  const next = setDesignToken(
    setDesignToken(defaultDesign, "layout.page_padding", 60),
    "layout.section_spacing",
    90,
  );
  const css = publishedDesignCss(next);
  assert.match(css, /--page-gutter:60px/);
  assert.match(css, /--page-gutter:16px/);
  assert.match(css, /--section-gap:48px/);
});
test("all canonical numeric controls have validated bounds", () => {
  for (const [path, value] of designEntries(defaultDesign).filter(
    ([, value]) => typeof value === "number",
  )) {
    assert.equal(
      validDesign(setDesignToken(defaultDesign, path, value)),
      true,
      path,
    );
    assert.equal(
      validDesign(setDesignToken(defaultDesign, path, -100)),
      false,
      path,
    );
  }
});
