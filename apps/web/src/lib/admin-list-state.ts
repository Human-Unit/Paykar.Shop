const productSort = ["id", "name", "price", "-price", "stock", "-updated"];
const orderSort = ["-created", "created", "total", "-total"];
export function adminListParameters(
  kind: string,
  raw: string,
): URLSearchParams {
  const source = new URLSearchParams(raw),
    result = new URLSearchParams();
  const page = Number(source.get("page"));
  result.set(
    "page",
    String(Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1),
  );
  const q = source.get("q")?.trim().slice(0, 100);
  if (q) result.set("q", q);
  const sorts =
    kind === "orders"
      ? orderSort
      : ["categories", "stores", "administrators"].includes(kind)
        ? ["id", "name"]
        : productSort;
  result.set(
    "sort",
    sorts.includes(source.get("sort") || "") ? source.get("sort")! : sorts[0],
  );
  if (kind === "orders") {
    const status = source.get("status");
    if (
      status &&
      ["pending", "confirmed", "delivering", "completed", "cancelled"].includes(
        status,
      )
    )
      result.set("status", status);
  } else if (["products", "promotions", "inventory"].includes(kind)) {
    const category = Number(source.get("category_id"));
    if (Number.isSafeInteger(category) && category > 0)
      result.set("category_id", String(category));
    const stock = source.get("stock");
    if (stock && ["all", "available", "empty", "low"].includes(stock))
      result.set("stock", stock);
    const view = source.get("view");
    if (view && ["all", "active", "problems", "empty"].includes(view))
      result.set("view", view);
    const measurement = source.get("measurement");
    if (measurement && ["PIECE", "WEIGHT", "DUAL"].includes(measurement))
      result.set("measurement", measurement);
    if (kind === "promotions") result.set("sale", "true");
  }
  return result;
}
