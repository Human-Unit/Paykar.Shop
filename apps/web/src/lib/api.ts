"use client";

import { useEffect, useState } from "react";

export type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
};
export type Product = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: string;
  old_price: string | null;
  unit: string;
  image_url: string;
  stock_quantity: string;
  is_active: boolean;
};
export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  facets?: CatalogFacets | null;
};
export type CatalogFacets = {
  units: string[];
  price_presets: { min_price: string | null; max_price: string | null }[];
};
export type ProductConnectionList = { items: Product[] };
export type ProductConnectionBatch = {
  items: { source_slug: string; items: Product[] }[];
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: Record<string, unknown>,
  ) {
    super(message);
  }
}
const base = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
).replace(/\/$/, "");

export async function api<T>(
  path: string,
  signal?: AbortSignal,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      signal,
      ...(body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "Не удалось связаться с магазином. Проверьте соединение и повторите попытку.",
    );
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "object" &&
      payload.detail !== null &&
      !Array.isArray(payload.detail)
        ? (payload.detail as Record<string, unknown>)
        : undefined;
    throw new ApiError(
      response.status,
      typeof detail?.message === "string"
        ? detail.message
        : response.status === 422
          ? "Проверьте имя, телефон, адрес и координаты."
          : response.status === 404
            ? "Товар или категория не найдены."
            : "Магазин временно недоступен. Повторите попытку.",
      detail,
    );
  }
  return response.json() as Promise<T>;
}

export type DeliveryConfig = {
  store_address: string;
  store_lat: number | null;
  store_lon: number | null;
  available: boolean;
  delivery_price: string;
  max_distance_meters: number;
};
export type Point = { latitude: number; longitude: number };
export type Quote = Point & {
  address: string;
  distance_meters: number;
  duration_seconds: number;
  delivery_price: string;
  route: {
    type: "FeatureCollection";
    features: {
      type: "Feature";
      geometry: {
        type: "LineString";
        coordinates: [number, number][];
      };
      properties: Record<string, string>;
    }[];
  };
};
export type OrderItem = {
  product_id: number;
  product_name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
};
export type Order = Point & {
  id: string;
  customer_name: string;
  address: string;
  items: OrderItem[];
  subtotal: string;
  delivery_price: string;
  total: string;
  distance_meters: number;
  delivery_duration_seconds: number;
  payment_method: "cash" | "card";
  payment_status: "paid" | "due_on_delivery";
  status: string;
  created_at: string;
};

export function useResource<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const key = `${path}:${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: ApiError;
  }>();
  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    api<T>(path, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ key, error });
      },
    );
    return () => controller.abort();
  }, [path, key]);
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: path !== null && result?.key !== key,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function useProductConnectionBatch(sourceSlugs: string[]) {
  const key = [...new Set(sourceSlugs)].join("\u001f");
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}:${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    data?: ProductConnectionBatch;
    error?: ApiError;
  }>();
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    api<ProductConnectionBatch>("/products/connections", controller.signal, {
      source_slugs: key.split("\u001f"),
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
    loading: Boolean(key) && result?.key !== requestKey,
    retry: () => setAttempt((value) => value + 1),
  };
}

export type Payment = {
  id: string;
  order_id: string | null;
  status: "pending" | "succeeded" | "failed" | "cancelled";
  amount: string;
  currency: string;
  failure_reason: string | null;
  expires_at: string;
};
export type PaymentConfirmation = { payment: Payment; order: Order | null };
