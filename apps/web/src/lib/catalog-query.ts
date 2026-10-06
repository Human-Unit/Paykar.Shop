import type { Category } from "./api";

const keys = [
  "q",
  "category",
  "subcategory",
  "min_price",
  "max_price",
  "in_stock",
  "on_sale",
  "min_discount",
  "unit",
  "sort",
  "page",
];

export function catalogParameters(source: URLSearchParams, slug?: string) {
  const result = new URLSearchParams();
  for (const key of keys) {
    const value = source.get(key);
    if (value) result.set(key, value);
  }
  if (!source.has("category") && slug) result.set("category", slug);
  for (const key of ["in_stock", "on_sale"]) {
    if (result.get(key) !== "true") result.delete(key);
  }
  if (!["price_asc", "price_desc"].includes(result.get("sort") || ""))
    result.delete("sort");
  const page = result.get("page") || "1";
  if (
    !/^\d+$/.test(page) ||
    !Number.isSafeInteger(Number(page)) ||
    Number(page) < 2
  )
    result.delete("page");
  return result;
}

export function catalogHref(
  source: URLSearchParams,
  changes: Record<string, string | null> = {},
) {
  const result = new URLSearchParams(source);
  if (!Object.hasOwn(changes, "page")) result.delete("page");
  for (const [key, value] of Object.entries(changes)) {
    if (value) result.set(key, value);
    else result.delete(key);
  }
  if (result.get("sort") === "name") result.delete("sort");
  if (result.get("page") === "1") result.delete("page");
  return result.size ? `/catalog?${result}` : "/catalog";
}

export function catalogApiQuery(
  source: URLSearchParams,
  facets = false,
  pageSize = 12,
) {
  const result = new URLSearchParams(source);
  result.set("page_size", String(pageSize));
  if (facets) result.set("include_facets", "true");
  return `/products?${result}`;
}

export function descendantCategories(categories: Category[], slug: string) {
  const parent = categories.find((item) => item.slug === slug);
  const ids = new Set(parent ? [parent.id] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of categories) {
      if (
        item.parent_id !== null &&
        ids.has(item.parent_id) &&
        !ids.has(item.id)
      ) {
        ids.add(item.id);
        changed = true;
      }
    }
  }
  return categories.filter(
    (item) => ids.has(item.id) && item.id !== parent?.id,
  );
}

export function activeFilterCount(params: URLSearchParams) {
  return [
    params.get("q"),
    params.get("category"),
    params.get("subcategory"),
    params.get("min_price") || params.get("max_price"),
    params.get("in_stock"),
    params.get("on_sale") || params.get("min_discount"),
    params.get("unit"),
  ].filter(Boolean).length;
}
