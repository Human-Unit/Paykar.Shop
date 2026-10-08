// Keep merchandising connections first, with stable-ID exclusion/deduplication.
export function savedConnections<
  T extends { id: number; is_active: boolean; stock_quantity: string },
>(
  groups: readonly { items: readonly T[] }[],
  savedIds: readonly number[],
  limit = 4,
): T[] {
  const excluded = new Set(savedIds);
  const result: T[] = [];
  for (const group of groups) {
    for (const product of group.items) {
      if (
        excluded.has(product.id) ||
        !product.is_active ||
        Number(product.stock_quantity) < 1
      )
        continue;
      excluded.add(product.id);
      result.push(product);
    }
  }
  return result.slice(0, limit);
}

// Used only when curated connections do not fill the saved-page suggestions.
// Slugs select real catalog records; missing products are never invented.
const breadComplements = [
  "butter",
  "cheese",
  "milk",
  "honey",
  "coffee",
  "black-tea",
];
const breadSlugs = new Set([
  "baguette",
  "wheat-bread",
  "rye-bread",
  "flatbread",
  "lavash",
  "croissant",
  "raisin-bun",
]);

export function savedRecommendations<
  T extends {
    id: number;
    slug: string;
    is_active: boolean;
    stock_quantity: string;
  },
>(
  sources: readonly T[],
  groups: readonly { items: readonly T[] }[],
  catalog: readonly T[],
  savedIds: readonly number[],
): T[] {
  const complements = sources.some((product) => breadSlugs.has(product.slug))
    ? breadComplements.flatMap((slug) =>
        catalog.filter((product) => product.slug === slug),
      )
    : [];
  return savedConnections(
    [...groups, { items: complements }, { items: catalog }],
    savedIds,
    5,
  );
}
