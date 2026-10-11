import test from "node:test";
import assert from "node:assert/strict";
import {
  heroSceneBuffer,
  heroScenePolicy,
} from "../src/lib/hero-scene-policy.ts";

const desktop = {
  width: 1440,
  reducedMotion: false,
  saveData: false,
  cores: 8,
  memory: 8,
};

test("capable desktop gets the isolated full scene", () => {
  assert.equal(heroScenePolicy(desktop).mode, "full");
  assert.equal(heroScenePolicy(desktop).fps, 60);
});
test("reduced motion, mobile, data saving and weak hardware never start a GPU loop", () => {
  for (const override of [
    { reducedMotion: true },
    { width: 390 },
    { saveData: true },
    { cores: 2 },
    { memory: 2 },
  ]) {
    const policy = heroScenePolicy({ ...desktop, ...override });
    assert.equal(policy.mode, "static");
    assert.equal(policy.fps, 0);
  }
});
test("tablet and moderate devices receive a reduced frame and resolution budget", () => {
  for (const override of [{ width: 768 }, { width: 1024 }, { cores: 4 }]) {
    const policy = heroScenePolicy({ ...desktop, ...override });
    assert.equal(policy.mode, "lite");
    assert.equal(policy.fps, 30);
    assert.ok(policy.scale < 1);
  }
});
test("missing optional hardware hints still allow the desktop scene", () => {
  assert.equal(
    heroScenePolicy({ width: 1440, reducedMotion: false, saveData: false })
      .mode,
    "full",
  );
});
test("back buffer stays inside the pixel budget across portrait, 4K and high DPR", () => {
  for (const [width, height] of [
    [348, 630],
    [918, 661],
    [3840, 2160],
    [1200, 2400],
  ]) {
    for (const dpr of [1, 1.25, 2, 3]) {
      const policy = heroScenePolicy(desktop);
      const buffer = heroSceneBuffer(width, height, dpr, policy);
      assert.ok(buffer.width * buffer.height <= 1_000_000);
      assert.ok(buffer.width <= width * policy.maxDpr);
      assert.ok(buffer.height <= height * policy.maxDpr);
      assert.ok(buffer.width >= 1 && buffer.height >= 1);
    }
  }
});
test("lite mode reduces fill rate without removing the scene", () => {
  const full = heroSceneBuffer(918, 661, 2, heroScenePolicy(desktop));
  const lite = heroSceneBuffer(
    918,
    661,
    2,
    heroScenePolicy({ ...desktop, width: 768 }),
  );
  assert.ok(lite.width * lite.height < full.width * full.height);
});
