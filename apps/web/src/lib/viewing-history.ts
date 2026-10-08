export const viewingHistoryLimit = 24;

export function parseViewingHistory(raw: string): number[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [
      ...new Set(
        value.filter((id): id is number => Number.isSafeInteger(id) && id > 0),
      ),
    ].slice(0, viewingHistoryLimit);
  } catch {
    return [];
  }
}

export function recordViewedProduct(raw: string, id: number): number[] {
  const previous = parseViewingHistory(raw);
  if (!Number.isSafeInteger(id) || id <= 0) return previous;
  return [id, ...previous.filter((previousId) => previousId !== id)].slice(
    0,
    viewingHistoryLimit,
  );
}
