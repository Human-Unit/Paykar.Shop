"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  ShoppingBasket,
  CircleAlert,
  Package,
  type LucideIcon,
} from "lucide-react";
export function Loading({
  kind = "message",
  label = "Загружаем товары…",
}: {
  kind?: "message" | "grid" | "product" | "cart" | "location" | "confirmation";
  label?: string;
}) {
  const { t } = usePresentation();
  return (
    <div
      role="status"
      aria-busy="true"
      className={kind === "message" ? "message" : `skeleton-${kind}`}
    >
      {kind === "message" && (
        <Package className="loading-icon" size={28} aria-hidden="true" />
      )}
      <span className={kind === "message" ? "" : "sr-only"}>{t(label)}</span>
      {["grid", "product"].includes(kind) && (
        <div
          className={kind === "grid" ? "product-grid" : "product-detail"}
          aria-hidden="true"
        >
          {Array.from({ length: kind === "grid" ? 4 : 2 }, (_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-image" />
              <div className="skeleton-line" />
              <div className="skeleton-line short" />
            </div>
          ))}
        </div>
      )}
      {["cart", "location", "confirmation"].includes(kind) && (
        <div
          className={`page-skeleton page-skeleton-${kind}`}
          aria-hidden="true"
        >
          <div className="skeleton-primary">
            {Array.from({ length: kind === "cart" ? 3 : 1 }, (_, index) => (
              <div className="skeleton-card" key={index}>
                <div className="skeleton-image" />
                <div className="skeleton-copy">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton-card skeleton-summary">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-image" />
          </div>
        </div>
      )}
    </div>
  );
}
export function Failure({ error, retry }: { error: Error; retry: () => void }) {
  const { t } = usePresentation();
  return (
    <div className="message failure-state" role="alert">
      <span className="state-icon">
        <CircleAlert size={32} aria-hidden="true" />
      </span>
      <h2>{t("Не удалось загрузить")}</h2>
      <p>
        {t(
          error instanceof ApiError && error.status === 0
            ? "Не удалось связаться с магазином. Проверьте соединение и повторите попытку."
            : "Магазин временно недоступен. Повторите попытку.",
        )}
      </p>
      <button type="button" onClick={retry} className="button mt-4">
        {t("Повторить")}
      </button>
      <Link href="/catalog" className="text-link state-link">
        {t("Вернуться в каталог →")}
      </Link>
    </div>
  );
}
export function Empty({
  title,
  text,
  icon: Icon = ShoppingBasket,
  compact = false,
  actionLabel = "Открыть каталог",
}: {
  title: string;
  text: string;
  icon?: LucideIcon;
  compact?: boolean;
  actionLabel?: string;
}) {
  const { t } = usePresentation();
  return (
    <div className={`empty-state${compact ? " is-compact" : ""}`}>
      <span className="state-icon">
        <Icon size={44} strokeWidth={1.4} aria-hidden="true" />
      </span>
      <h2>{t(title)}</h2>
      <p>{t(text)}</p>
      <Link className="button" href="/catalog">
        {t(actionLabel)}
      </Link>
    </div>
  );
}
