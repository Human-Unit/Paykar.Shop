"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const storageKey = "paykar-saved-items-v1";
const changed = "paykar-saved-items-change";
const emptySnapshot = "[]";

function snapshot() {
  try {
    return localStorage.getItem(storageKey) || emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changed, callback);
  };
}

function parse(raw: string): number[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const seen = new Set<number>();
    const ids: number[] = [];
    for (const item of value) {
      if (!Number.isInteger(item) || item <= 0 || seen.has(item)) continue;
      seen.add(item);
      ids.push(item);
      if (ids.length >= 48) break;
    }
    return ids;
  } catch {
    return [];
  }
}

function save(ids: number[]) {
  const raw = JSON.stringify(ids.slice(0, 48));
  try {
    localStorage.setItem(storageKey, raw);
  } catch {
    /* Saved items remain optional when storage is blocked. */
  }
  window.dispatchEvent(new Event(changed));
}

type SavedItems = {
  ids: number[];
  count: number;
  has: (productId: number) => boolean;
  toggle: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const Context = createContext<SavedItems | null>(null);

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => emptySnapshot);
  const ids = useMemo(() => parse(raw), [raw]);
  const value = useMemo<SavedItems>(
    () => ({
      ids,
      count: ids.length,
      has: (productId) => ids.includes(productId),
      toggle: (productId) =>
        save(
          ids.includes(productId)
            ? ids.filter((id) => id !== productId)
            : [productId, ...ids].slice(0, 48),
        ),
      remove: (productId) => save(ids.filter((id) => id !== productId)),
      clear: () => save([]),
    }),
    [ids],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSavedItems() {
  const value = useContext(Context);
  if (!value) throw new Error("SavedItemsProvider is required");
  return value;
}
