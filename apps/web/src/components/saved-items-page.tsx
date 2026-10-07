"use client";

import { Heart } from "lucide-react";

import { useCart } from "@/context/cart";
import { usePresentation } from "@/context/presentation";
import { useSavedItems } from "@/context/saved-items";
import { ProductPage, useResource } from "@/lib/api";
import { Breadcrumbs } from "./breadcrumbs";
import { ProductCard } from "./product-card";
import { Empty, Failure, Loading } from "./states";
import { PageIntro } from "./page-patterns";
import styles from "./shopping-assistance.module.css";

export function SavedItemsPage() {
  const { t } = usePresentation();
  const saved = useSavedItems();
  const cart = useCart();
  const ids = saved.ids.join(",");
  const resource = useResource<ProductPage>(
    ids ? `/products?ids=${encodeURIComponent(ids)}&page_size=48` : null,
  );

  if (!saved.count) {
    return (
      <Empty
        title={t("Сохранённых товаров пока нет")}
        text={t("Сохраняйте продукты, чтобы быстро вернуться к ним позже.")}
      />
    );
  }
  if (resource.loading) return <Loading kind="grid" />;
  if (resource.error)
    return <Failure error={resource.error} retry={resource.retry} />;

  const products = resource.data?.items || [];
  const available = products.filter(
    (product) => product.is_active && Number(product.stock_quantity) >= 1,
  );
  const existingIds = new Set(products.map((product) => product.id));
  const staleIds = saved.ids.filter((id) => !existingIds.has(id));

  return (
    <div className="polish-page saved-items-page">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          { label: t("Сохранённые товары") },
        ]}
      />
      <PageIntro
        eyebrow="Список покупок"
        title="Сохранённые товары"
        description="Сохраните нужное сейчас и добавьте в корзину, когда будете готовы."
        icon={Heart}
      />

      <div className={styles.savedItemsActions}>
        <button
          type="button"
          className="button"
          disabled={!available.length}
          onClick={() => available.forEach((product) => cart.add(product))}
        >
          {t("Добавить доступные в корзину")}
        </button>
        <button type="button" className="text-link" onClick={saved.clear}>
          {t("Очистить сохранённые")}
        </button>
      </div>

      {staleIds.length > 0 && (
        <p className="message" role="status">
          {t("Некоторые сохранённые товары больше недоступны.")}{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => staleIds.forEach((id) => saved.remove(id))}
          >
            {t("Убрать недоступные")}
          </button>
        </p>
      )}

      {products.length ? (
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              revealIndex={index}
            />
          ))}
        </div>
      ) : (
        <Empty
          title={t("Сохранённые товары недоступны")}
          text={t("Очистите список или выберите новые товары в каталоге.")}
        />
      )}
    </div>
  );
}
