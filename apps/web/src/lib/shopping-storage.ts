"use client";
import { useMemo, useSyncExternalStore } from "react";
import {
  parseOrderIds,
  parseTemplates,
  TEMPLATE_LIMIT,
  uuidPattern,
  validItems,
  type ShoppingItem,
  type ShoppingTemplate,
} from "./shopping";
const templateKey = "paykar-shopping-templates-v1";
const historyKey = "paykar-order-history-v1";
const changed = "paykar-shopping-change";
// Per-tab fallback keeps actions useful when browser storage is blocked.
const fallback = new Map<string, string>();
function read(key: string) {
  if (fallback.has(key)) return fallback.get(key)!;
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
function write(key: string, raw: string) {
  let persisted = true;
  try {
    localStorage.setItem(key, raw);
    fallback.delete(key);
  } catch {
    fallback.set(key, raw);
    persisted = false;
  }
  window.dispatchEvent(new Event(changed));
  return persisted;
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changed, callback);
  };
}
const templateSnapshot = () => read(templateKey);
const historySnapshot = () => read(historyKey);
export function useShoppingStorage() {
  const templatesRaw = useSyncExternalStore(
    subscribe,
    templateSnapshot,
    () => "",
  );
  const historyRaw = useSyncExternalStore(subscribe, historySnapshot, () => "");
  const templates = useMemo(() => parseTemplates(templatesRaw), [templatesRaw]);
  const orderIds = useMemo(() => parseOrderIds(historyRaw), [historyRaw]);
  return { templates, orderIds };
}
export function rememberOrder(id: string) {
  if (!uuidPattern.test(id)) return;
  const ids = parseOrderIds(read(historyKey));
  if (ids.includes(id)) return;
  write(historyKey, JSON.stringify([id, ...ids].slice(0, 50)));
}
export function saveShoppingTemplate(
  name: string,
  items: ShoppingItem[],
  id?: string,
) {
  const templates = parseTemplates(read(templateKey));
  const existing = templates.find((v) => v.id === id);
  if (!existing && templates.length >= TEMPLATE_LIMIT)
    throw new Error("Можно сохранить до 20 шаблонов.");
  const cleaned = validItems(items);
  if (!name.trim() || name.trim().length > 80 || !cleaned.length)
    throw new Error("Укажите название и добавьте товары.");
  const date = new Date().toISOString();
  const template: ShoppingTemplate = {
    id: existing?.id || crypto.randomUUID(),
    name: name.trim(),
    items: cleaned,
    created_at: existing?.created_at || date,
    updated_at: date,
  };
  const next = existing
    ? templates.map((v) => (v.id === template.id ? template : v))
    : [template, ...templates];
  const persisted = write(
    templateKey,
    JSON.stringify({ version: 1, templates: next }),
  );
  return { template, persisted };
}
export function deleteShoppingTemplate(id: string) {
  return write(
    templateKey,
    JSON.stringify({
      version: 1,
      templates: parseTemplates(read(templateKey)).filter((v) => v.id !== id),
    }),
  );
}
