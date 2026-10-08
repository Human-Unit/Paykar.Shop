"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseViewingHistory, recordViewedProduct } from "./viewing-history";

const storageKey = "paykar-recently-viewed-v1";
const changed = "paykar-recently-viewed-change";
let sessionSnapshot = "[]";
let memoryOnly = false;

function snapshot() {
  if (memoryOnly) return sessionSnapshot;
  try {
    return localStorage.getItem(storageKey) || sessionSnapshot;
  } catch {
    return sessionSnapshot;
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

export function rememberViewedProduct(id: number) {
  sessionSnapshot = JSON.stringify(recordViewedProduct(snapshot(), id));
  try {
    localStorage.setItem(storageKey, sessionSnapshot);
    memoryOnly = false;
  } catch {
    memoryOnly = true;
    // Optional history still works for this tab when storage is unavailable.
  }
  window.dispatchEvent(new Event(changed));
}

export function useRecentlyViewed() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => parseViewingHistory(raw), [raw]);
}
