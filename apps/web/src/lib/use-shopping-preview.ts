"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import type { ShoppingItem, ShoppingPreview } from "./shopping";
export function useShoppingPreview(items: ShoppingItem[]) {
  const key = JSON.stringify(
    items.map(({ product_id, quantity }) => ({ product_id, quantity })),
  );
  const [attempt, setAttempt] = useState(0);
  const requestKey = key + attempt;
  const [result, setResult] = useState<{
    key: string;
    data?: ShoppingPreview;
    error?: Error;
  }>();
  useEffect(() => {
    const parsed: ShoppingItem[] = JSON.parse(key);
    if (!parsed.length) return;
    const controller = new AbortController();
    api<ShoppingPreview>("/shopping/preview", controller.signal, {
      items: parsed,
    }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error });
      },
    );
    return () => controller.abort();
  }, [key, requestKey]);
  return {
    data: result?.key === requestKey ? result.data : undefined,
    error: result?.key === requestKey ? result.error : undefined,
    loading: items.length > 0 && result?.key !== requestKey,
    retry: () => setAttempt((v) => v + 1),
  };
}
