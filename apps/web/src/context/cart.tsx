"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  useState,
} from "react";
import { Product, ProductPage, useResource } from "@/lib/api";

type Item = { product_id: number; quantity: number };
const EMPTY: Item[] = [];
const STORAGE_KEY = "paykar-demo-cart-v1";
let cachedRaw: string | null | undefined;
let cachedItems = EMPTY;
let memoryOnly = false;

function parse(raw: string | null): Item[] {
  try {
    const values: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(values)) return EMPTY;
    const merged = new Map<number, number>();
    for (const value of values.slice(0, 48)) {
      if (typeof value !== "object" || value === null) continue;
      const { product_id: id, quantity } = value as Record<string, unknown>;
      if (
        typeof id === "number" &&
        Number.isSafeInteger(id) &&
        id > 0 &&
        typeof quantity === "number" &&
        Number.isSafeInteger(quantity) &&
        quantity > 0
      ) {
        merged.set(id, Math.min(99, (merged.get(id) || 0) + quantity));
      }
    }
    return Array.from(merged, ([product_id, quantity]) => ({
      product_id,
      quantity,
    }));
  } catch {
    return EMPTY;
  }
}
function snapshot() {
  if (memoryOnly) return cachedItems;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = parse(raw);
    }
  } catch {
    memoryOnly = true;
  }
  return cachedItems;
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("paykar-cart-update", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("paykar-cart-update", callback);
  };
}
function save(items: Item[]) {
  cachedItems = items;
  cachedRaw = JSON.stringify(items);
  try {
    localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    memoryOnly = true;
  }
  window.dispatchEvent(new Event("paykar-cart-update"));
}
type CartContext = {
  items: Item[];
  products: Product[];
  count: number;
  loading: boolean;
  error?: Error;
  notice: string;
  retry: () => void;
  add: (product: Product) => void;
  quantity: (id: number, quantity: number, stock: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};
const Context = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const [notice, setNotice] = useState("");
  const ids = items
    .map((item) => item.product_id)
    .sort((a, b) => a - b)
    .join(",");
  const resource = useResource<ProductPage>(
    ids ? `/products?ids=${ids}&page_size=48` : null,
  );
  function update(next: Item[]) {
    save(next);
    setNotice(
      memoryOnly
        ? "Хранилище недоступно: корзина сохранится только до закрытия страницы."
        : "",
    );
  }
  const value: CartContext = {
    items,
    products: resource.data?.items || [],
    loading: resource.loading,
    error: resource.error,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    notice,
    retry: resource.retry,
    add: (product) => {
      const current = snapshot();
      const existing = current.find((item) => item.product_id === product.id);
      const limit = Math.min(99, Math.floor(Number(product.stock_quantity)));
      if (limit < 1 || (existing?.quantity || 0) >= limit) {
        setNotice("Достигнуто доступное количество товара.");
        return;
      }
      if (!existing && current.length >= 48) {
        setNotice("В корзине может быть до 48 разных товаров.");
        return;
      }
      update(
        existing
          ? current.map((item) =>
              item.product_id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : [...current, { product_id: product.id, quantity: 1 }],
      );
    },
    quantity: (id, value, stock) =>
      update(
        snapshot().map((item) =>
          item.product_id === id
            ? {
                ...item,
                quantity: Math.max(1, Math.min(99, Math.floor(stock), value)),
              }
            : item,
        ),
      ),
    remove: (id) => update(snapshot().filter((item) => item.product_id !== id)),
    clear: () => update([]),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error("CartProvider is required");
  return value;
}
