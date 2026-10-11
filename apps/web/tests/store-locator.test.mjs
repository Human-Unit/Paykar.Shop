import assert from "node:assert/strict";
import { test } from "node:test";
import { storeLocations } from "../src/lib/store-locations.ts";
import { storeLocatorLocations } from "../src/lib/store-locator.ts";

test("public names use real streets and distinguish the two Ayni locations", () => {
  const locations = storeLocatorLocations(storeLocations);
  assert.deepEqual(
    locations.map((store) => store.name),
    [
      "Айни 16б",
      "Бухоро",
      "Яккачинор",
      "Айни 57",
      "Рудаки",
      "Бободжон Гафуров",
      "Борбад",
      "С. Носира",
    ],
  );
  assert.equal(new Set(locations.map((store) => store.name)).size, 8);
});

test("public labels preserve every coordinate, ID, address and canonical name", () => {
  const before = structuredClone(storeLocations);
  const locations = storeLocatorLocations(storeLocations);
  for (const [index, store] of locations.entries()) {
    const { name, ...data } = store;
    const { name: internalName, ...canonicalData } = storeLocations[index];
    assert.deepEqual(data, canonicalData);
    assert.notEqual(name, internalName);
    assert.notStrictEqual(store, storeLocations[index]);
  }
  assert.deepEqual(storeLocations, before);
});

test("absent stores never produce fabricated locations", () => {
  assert.deepEqual(storeLocatorLocations([]), []);
});
