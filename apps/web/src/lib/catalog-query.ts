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

type PriceBound = "min" | "max";

function wholeSomPrice(value: string | null, bound: PriceBound) {
  if (!value) return "";
  const amount = Number(value.trim());
  if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99)
    return "";
  return String(bound === "min" ? Math.floor(amount) : Math.ceil(amount));
}

function normalizePriceBounds(params: URLSearchParams) {
  const min = wholeSomPrice(params.get("min_price"), "min");
  const max = wholeSomPrice(params.get("max_price"), "max");
  if (min) params.set("min_price", min);
  else params.delete("min_price");
  if (max) params.set("max_price", max);
  else params.delete("max_price");
}

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
  normalizePriceBounds(result);
  normalizeSale(result);
  return result;
}

function normalizeSale(params: URLSearchParams) {
  const discount = params.get("min_discount");
  if (
    discount !== null &&
    discount !== "" &&
    Number.isFinite(Number(discount)) &&
    Number(discount) >= 0 &&
    Number(discount) <= 100
  ) {
    params.set("on_sale", "true");
    // A zero minimum is the same as the quick sale filter.
    if (Number(discount) === 0) params.delete("min_discount");
  }
}

export function catalogFilterChanges(
  source: URLSearchParams,
  changes: Record<string, string | null> = {},
) {
  const result = new URLSearchParams(source);
  for (const [key, value] of Object.entries(changes)) {
    if (value) result.set(key, value);
    else result.delete(key);
  }
  if (
    Object.hasOwn(changes, "on_sale") &&
    changes.on_sale !== "true" &&
    !Object.hasOwn(changes, "min_discount")
  )
    result.delete("min_discount");
  normalizePriceBounds(result);
  normalizeSale(result);
  return result;
}

export function catalogHref(
  source: URLSearchParams,
  changes: Record<string, string | null> = {},
) {
  const result = catalogFilterChanges(source, changes);
  if (!Object.hasOwn(changes, "page")) result.delete("page");
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

// Search, parent category, sorting and the two quick toggles have their own UI.
export function advancedFilterCount(params: URLSearchParams) {
  return [
    params.get("subcategory"),
    params.get("min_price") || params.get("max_price"),
    Number(params.get("min_discount")) > 0,
    params.get("unit"),
  ].filter(Boolean).length;
}

export function catalogPriceError(params: URLSearchParams) {
  const min = params.get("min_price") || "";
  const max = params.get("max_price") || "";
  for (const value of [min, max]) {
    if (value && (!/^\d+$/.test(value) || Number(value) > 9999999999))
      return "invalid_price";
  }
  return min && max && Number(min) > Number(max) ? "reversed_price" : null;
}

export function categoryFilterChanges(
  params: URLSearchParams,
  categories: Category[],
  slug: string,
): Record<string, string | null> {
  const child = params.get("subcategory");
  const compatible =
    !slug ||
    descendantCategories(categories, slug).some((item) => item.slug === child);
  return {
    category: slug || null,
    ...(compatible ? {} : { subcategory: null }),
  };
}

export function resetCatalogFilters(params: URLSearchParams) {
  const result = new URLSearchParams(params);
  for (const key of [
    "subcategory",
    "min_price",
    "max_price",
    "in_stock",
    "on_sale",
    "min_discount",
    "unit",
    "page",
  ])
    result.delete(key);
  return result;
}
