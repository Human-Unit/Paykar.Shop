"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  useState,
  useMemo,
} from "react";
import { Product, ProductPage, useResource } from "@/lib/api";
import {
  mergeShoppingCart,
  type AddSummary,
  type PreviewItem,
} from "@/lib/shopping";

import {
  defaultMode,
  normalizeLine,
  stockLimit,
  minimum,
  step,
  type QuantityLine,
} from "@/lib/measurement";
import { validItems } from "@/lib/shopping";
type Item = QuantityLine;
const EMPTY: Item[] = [];
const STORAGE_KEY = "paykar-demo-cart-v1";
let cachedRaw: string | null | undefined;
let cachedItems = EMPTY;
let memoryOnly = false;

function parse(raw: string | null): Item[] {
  try {
    return validItems(JSON.parse(raw || "[]"));
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
  noticeId: number;
  retry: () => void;
  add: (
    product: Product,
    selection?: { quantity: number; purchase_mode: "PIECE" | "WEIGHT" },
  ) => void;
  addMany: (items: PreviewItem[]) => AddSummary;
  quantity: (id: number, quantity: number, stock: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};
const Context = createContext<CartContext | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const rawItems = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  // The id changes on every announcement so a repeated message shows again.
  const [notice, setNotice] = useState({ text: "", id: 0 });
  function announce(text: string) {
    setNotice((current) =>
      text || current.text ? { text, id: current.id + 1 } : current,
    );
  }
  const ids = rawItems
    .map((item) => item.product_id)
    .sort((a, b) => a - b)
    .join(",");
  const resource = useResource<ProductPage>(
    ids ? `/products?ids=${ids}&page_size=48` : null,
  );
  const items = useMemo(
    () =>
      rawItems.map((item) =>
        normalizeLine(
          item,
          resource.data?.items.find((p) => p.id === item.product_id),
        ),
      ),
    [rawItems, resource.data],
  );
  function update(next: Item[]) {
    save(next);
    announce(
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
    count: items.reduce(
      (sum, item) =>
        sum + (item.purchase_mode === "WEIGHT" ? 1 : item.quantity),
      0,
    ),
    notice: notice.text,
    noticeId: notice.id,
    retry: resource.retry,
    addMany: (rows) => {
      const result = mergeShoppingCart(items, rows);
      update(result.items);
      resource.retry();
      return result.summary;
    },
    add: (product, selection) => {
      const current = items;
      const existing = current.find((item) => item.product_id === product.id);
      const mode =
        existing?.purchase_mode ||
        selection?.purchase_mode ||
        defaultMode(product);
      const min = minimum(product, mode),
        increment = step(product, mode);
      const amount = selection?.quantity ?? (existing ? increment : min);
      const limit = stockLimit(product, mode);
      if (selection && existing && mode !== selection.purchase_mode) return;
      if (
        !Number.isSafeInteger(amount) ||
        amount < min ||
        (mode === "WEIGHT" && (amount - min) % increment)
      )
        return;
      if (limit < min || (existing?.quantity || 0) + amount > limit) {
        announce("Достигнуто доступное количество товара.");
        return;
      }
      if (!existing && current.length >= 48) {
        announce("В корзине может быть до 48 разных товаров.");
        return;
      }
      update(
        existing
          ? current.map((item) =>
              item.product_id === product.id
                ? { ...item, quantity: item.quantity + amount }
                : item,
            )
          : [
              ...current,
              { product_id: product.id, quantity: amount, purchase_mode: mode },
            ],
      );
    },
    quantity: (id, amount) => {
      const product = resource.data?.items.find((p) => p.id === id);
      const existing = items.find((item) => item.product_id === id);
      if (!product || !existing) return;
      const mode = existing.purchase_mode || defaultMode(product);
      const min = minimum(product, mode),
        increment = step(product, mode);
      const limit = stockLimit(product, mode);
      if (limit < min || !Number.isSafeInteger(amount)) return;
      const next = Math.max(min, Math.min(limit, amount));
      const quantity =
        mode === "WEIGHT"
          ? min + Math.floor((next - min) / increment) * increment
          : next;
      update(
        items.map((item) =>
          item.product_id === id ? { ...item, quantity } : item,
        ),
      );
    },
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
