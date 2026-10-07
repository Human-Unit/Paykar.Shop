import type { Product } from "./api";

export type ShoppingItem = {
  product_id: number;
  quantity: number;
  name?: string;
};
export type ShoppingTemplate = {
  id: string;
  name: string;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
};
export type PreviewItem = {
  product_id: number;
  requested_quantity: number;
  available_quantity: number;
  availability: "available" | "unavailable" | "missing";
  product: Product | null;
};
export type ShoppingPreview = { items: PreviewItem[] };
export type CuratedTemplate = ShoppingPreview & {
  id: string;
  name: string;
  description: string;
};
export type AddSummary = {
  added: number;
  unavailable: number;
  missing: number;
  adjusted: number;
  full: number;
};
export const TEMPLATE_LIMIT = 20;
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validItems(value: unknown): ShoppingItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value.slice(0, 48).flatMap((v: unknown) => {
    if (!v || typeof v !== "object") return [];
    const row = v as Record<string, unknown>;
    if (
      typeof row.product_id !== "number" ||
      !Number.isSafeInteger(row.product_id) ||
      row.product_id <= 0 ||
      seen.has(row.product_id) ||
      typeof row.quantity !== "number" ||
      !Number.isInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > 99
    )
      return [];
    seen.add(row.product_id);
    return [
      {
        product_id: row.product_id,
        quantity: row.quantity,
        ...(typeof row.name === "string"
          ? { name: row.name.slice(0, 200) }
          : {}),
      },
    ];
  });
}
export function parseTemplates(raw: string): ShoppingTemplate[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      !("version" in data) ||
      data.version !== 1 ||
      !("templates" in data) ||
      !Array.isArray(data.templates)
    )
      return [];
    const ids = new Set<string>();
    return data.templates.slice(0, TEMPLATE_LIMIT).flatMap((v: unknown) => {
      if (!v || typeof v !== "object") return [];
      const row = v as Record<string, unknown>;
      if (
        typeof row.id !== "string" ||
        !uuidPattern.test(row.id) ||
        ids.has(row.id) ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        row.name.length > 80 ||
        typeof row.created_at !== "string" ||
        !Number.isFinite(Date.parse(row.created_at)) ||
        typeof row.updated_at !== "string" ||
        !Number.isFinite(Date.parse(row.updated_at))
      )
        return [];
      const items = validItems(row.items);
      if (!items.length) return [];
      ids.add(row.id);
      return [
        {
          id: row.id,
          name: row.name.trim(),
          items,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      ];
    });
  } catch {
    return [];
  }
}
export function parseOrderIds(raw: string): string[] {
  try {
    const rows: unknown = JSON.parse(raw);
    return Array.isArray(rows)
      ? [
          ...new Set(
            rows.filter(
              (v): v is string => typeof v === "string" && uuidPattern.test(v),
            ),
          ),
        ].slice(0, 50)
      : [];
  } catch {
    return [];
  }
}

// Uses the same 48-line / 99-per-product limits as the guest cart.
// Existing quantities consume current stock; valid lines are merged atomically.
export function mergeShoppingCart(
  current: ShoppingItem[],
  rows: PreviewItem[],
) {
  const items = current.map(({ product_id, quantity }) => ({
    product_id,
    quantity,
  }));
  const summary: AddSummary = {
    added: 0,
    unavailable: 0,
    missing: 0,
    adjusted: 0,
    full: 0,
  };
  const seen = new Set<number>();
  for (const row of rows) {
    if (seen.has(row.product_id)) continue;
    seen.add(row.product_id);
    if (row.availability === "missing") {
      summary.missing++;
      continue;
    }
    const product = row.product;
    if (!product || !product.is_active || row.availability !== "available") {
      summary.unavailable++;
      continue;
    }
    const stock = Math.max(
      0,
      Math.min(99, Math.floor(Number(product.stock_quantity))),
    );
    if (!Number.isFinite(stock) || stock < 1) {
      summary.unavailable++;
      continue;
    }
    const existing = items.find((i) => i.product_id === product.id);
    if (!existing && items.length >= 48) {
      summary.full++;
      continue;
    }
    const requested = Math.min(
      99,
      Math.max(0, Math.floor(row.requested_quantity)),
    );
    const quantity = Math.max(
      0,
      Math.min(requested, stock - (existing?.quantity || 0)),
    );
    if (quantity < requested) summary.adjusted++;
    if (!quantity) continue;
    if (existing) existing.quantity += quantity;
    else items.push({ product_id: product.id, quantity });
    summary.added += quantity;
  }
  return { items, summary };
}
