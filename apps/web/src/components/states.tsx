"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
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
  kind?: "message" | "grid" | "product";
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
      {kind !== "message" && (
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
      <p>{t(error.message)}</p>
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
}: {
  title: string;
  text: string;
  icon?: LucideIcon;
  compact?: boolean;
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
        {t("Открыть каталог")}
      </Link>
    </div>
  );
}
