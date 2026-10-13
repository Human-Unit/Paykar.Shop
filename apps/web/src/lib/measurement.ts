import type { Product, OrderItem } from "./api";

export type PurchaseMode = "PIECE" | "WEIGHT";
export type QuantityLine = {
  product_id: number;
  quantity: number;
  purchase_mode?: PurchaseMode;
};
export const MAX_WEIGHT_G = 99000;
export function weighted(product: Partial<Product>) {
  return product.price_unit === "KG";
}
export function defaultMode(product: Partial<Product>): PurchaseMode {
  return weighted(product) ? "WEIGHT" : "PIECE";
}
export function minimum(product: Partial<Product>, mode: PurchaseMode) {
  return mode === "WEIGHT" || !weighted(product)
    ? product.minimum_quantity || 1
    : 1;
}
export function step(product: Partial<Product>, mode: PurchaseMode) {
  return mode === "WEIGHT" ? product.quantity_step || 100 : 1;
}
export function normalizeLine<T extends QuantityLine>(
  line: T,
  product?: Partial<Product>,
): T & QuantityLine {
  if (line.purchase_mode || !product) return line;
  // Legacy quantity was a multiple of the pricing unit, including one-kg packages.
  return {
    ...line,
    purchase_mode: defaultMode(product),
    quantity: weighted(product) ? line.quantity * 1000 : line.quantity,
  };
}
export function weightGrams(product: Partial<Product>, line: QuantityLine) {
  const item = normalizeLine(line, product);
  return item.purchase_mode === "WEIGHT"
    ? item.quantity
    : weighted(product)
      ? item.quantity * (product.average_piece_weight_g || 0)
      : null;
}
export function isEstimated(product: Partial<Product>, line: QuantityLine) {
  return (
    product.measurement_mode === "DUAL" &&
    normalizeLine(line, product).purchase_mode === "PIECE"
  );
}
export function stockLimit(product: Partial<Product>, mode: PurchaseMode) {
  if (!product.is_active) return 0;
  const [whole, fraction = ""] = String(product.stock_quantity).split(".");
  const stock = weighted(product)
    ? Number(whole) * 1000 + Number(fraction.padEnd(3, "0").slice(0, 3))
    : Number(whole);
  if (!Number.isFinite(stock)) return 0;
  if (!weighted(product))
    return stock < minimum(product, mode) ? 0 : Math.min(99, stock);
  if (mode === "PIECE")
    return Math.min(
      99,
      Math.floor(stock / (product.average_piece_weight_g || Infinity)),
      Math.floor(MAX_WEIGHT_G / (product.average_piece_weight_g || Infinity)),
    );
  const min = minimum(product, mode),
    increment = step(product, mode);
  const limit = Math.min(MAX_WEIGHT_G, stock);
  return limit < min
    ? 0
    : min + Math.floor((limit - min) / increment) * increment;
}
export function lineCents(
  product: Pick<Product, "price"> & Partial<Product>,
  line: QuantityLine,
) {
  const [whole, fraction = ""] = String(product.price).split(".");
  const cents =
    BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
  const grams = weightGrams(product, line);
  const multiplier = BigInt(grams === null ? line.quantity : grams);
  // Integer half-up cents match backend Decimal and PostgreSQL round().
  return Number(
    grams === null
      ? cents * multiplier
      : (cents * multiplier + BigInt(500)) / BigInt(1000),
  );
}
export function cartRequest(line: QuantityLine) {
  return line.purchase_mode === "PIECE"
    ? {
        product_id: line.product_id,
        purchase_mode: "PIECE",
        piece_count: line.quantity,
      }
    : line.purchase_mode === "WEIGHT"
      ? {
          product_id: line.product_id,
          purchase_mode: "WEIGHT",
          requested_weight_g: line.quantity,
        }
      : { product_id: line.product_id, quantity: line.quantity };
}
export function quantityLabel(line: QuantityLine, t: (s: string) => string) {
  return `${line.purchase_mode === "WEIGHT" ? line.quantity / 1000 : line.quantity} ${t(line.purchase_mode === "WEIGHT" ? "кг" : "шт")}`;
}
export function orderQuantity(item: OrderItem, t: (s: string) => string) {
  const label =
    item.purchase_mode === "WEIGHT"
      ? `${(item.requested_weight_g ?? Number(item.quantity) * 1000) / 1000} ${t("кг")}`
      : `${item.requested_piece_count ?? Number(item.quantity)} ${t("шт")}`;
  return item.is_estimated
    ? `${label} · ≈ ${(item.estimated_weight_g || 0) / 1000} ${t("кг")}`
    : label;
}
