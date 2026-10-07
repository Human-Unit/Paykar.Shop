// Stable product IDs define identity; translated names and slugs do not.
export function categoryRecommendations<T extends { id: number }>(
  currentId: number,
  connected: readonly { id: number }[],
  categoryItems: readonly T[],
  limit = 5,
): T[] {
  const excluded = new Set([currentId, ...connected.map((item) => item.id)]);
  return categoryItems
    .filter((item) => {
      if (excluded.has(item.id)) return false;
      excluded.add(item.id);
      return true;
    })
    .slice(0, limit);
}
