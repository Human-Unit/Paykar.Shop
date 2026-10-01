import Link from "next/link";
import { ShoppingBasket } from "lucide-react";

export function Loading({
  kind = "message",
}: {
  kind?: "message" | "grid" | "product";
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={kind === "message" ? "message" : `skeleton-${kind}`}
    >
      <span className={kind === "message" ? "" : "sr-only"}>
        Загружаем товары…
      </span>
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
  return (
    <div className="message" role="alert">
      <p>{error.message}</p>
      <button type="button" onClick={retry} className="button mt-4">
        Повторить
      </button>
      <Link href="/catalog" className="text-link state-link">
        Вернуться в каталог →
      </Link>
    </div>
  );
}
export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <ShoppingBasket size={44} strokeWidth={1.4} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" href="/catalog">
        Открыть каталог
      </Link>
    </div>
  );
}
