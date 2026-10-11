import type { StoreLocation } from "./store-locations";

/** Public labels derived from real addresses; the canonical store data stays intact. */
export function storeLocatorLocations(stores: readonly StoreLocation[]) {
  const streetNames = stores.map((store) =>
    store.address.replace(/^(ул\.|пр\.)\s*/u, "").replace(/\s+\d.*$/u, ""),
  );
  const counts = new Map<string, number>();
  for (const name of streetNames) counts.set(name, (counts.get(name) ?? 0) + 1);

  return stores.map((store, index) => ({
    ...store,
    name:
      (counts.get(streetNames[index]) ?? 0) > 1
        ? store.shortAddress
        : streetNames[index],
  }));
}
