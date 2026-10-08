"use client";

import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  Heart,
  Layers3,
  ShoppingBasket,
  Trash2,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useSavedItems } from "@/context/saved-items";
import {
  type Category,
  type Product,
  type ProductPage,
  useProductConnectionBatch,
  useResource,
} from "@/lib/api";
import { cents } from "@/lib/format";
import { savedRecommendations } from "@/lib/saved-shopping";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { Breadcrumbs } from "./breadcrumbs";
import { ProductCard } from "./product-card";
import { Failure, Loading } from "./states";
import { PageIntro } from "./page-patterns";
import { AddShoppingItems, SaveShoppingTemplate } from "./shopping-actions";
import styles from "./saved-items-page.module.css";

function SavedComplements({
  products,
  excludedIds,
}: {
  products: Product[];
  excludedIds: number[];
}) {
  const { t } = usePresentation();
  const resource = useProductConnectionBatch(
    products.map((product) => product.slug),
  );
  const catalog = useResource<ProductPage>(
    "/products?in_stock=true&page_size=48",
  );
  const suggestions = savedRecommendations(
    products,
    resource.data?.items ?? [],
    catalog.data?.items ?? [],
    excludedIds,
  );
  const loading = resource.loading || catalog.loading;
  const error = resource.error || catalog.error;
  if (!loading && !error && !suggestions.length) return null;
  return (
    <section
      className={styles.section}
      aria-labelledby="saved-complements-title"
    >
      <div className={styles.sectionHeading}>
        <h2 id="saved-complements-title">{t("Вам может понравиться")}</h2>
        <Link className="text-link" href="/catalog">
          {t("Посмотреть больше")} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {loading && <Loading label="Загружаем товары…" />}
      {error && (
        <Failure
          error={error}
          retry={() => {
            if (resource.error) resource.retry();
            if (catalog.error) catalog.retry();
          }}
        />
      )}
      {!loading && suggestions.length > 0 && (
        <div
          className={`product-grid ${styles.supportGrid}`}
          tabIndex={0}
          role="group"
          aria-labelledby="saved-complements-title"
        >
          {suggestions.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecentlyViewed() {
  const { t } = usePresentation();
  const ids = useRecentlyViewed();
  const resource = useResource<ProductPage>(
    ids.length
      ? `/products?ids=${encodeURIComponent(ids.join(","))}&page_size=48`
      : null,
  );
  const byId = new Map(
    resource.data?.items.map((product) => [product.id, product]),
  );
  const products = ids
    .flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    })
    .slice(0, 5);
  if (!ids.length || (!resource.loading && !resource.error && !products.length))
    return null;
  return (
    <section className={styles.section} aria-labelledby="saved-history-title">
      <h2 id="saved-history-title">{t("Недавно смотрели")}</h2>
      {resource.loading && <Loading />}
      {resource.error && (
        <Failure error={resource.error} retry={resource.retry} />
      )}
      {!resource.loading && !resource.error && (
        <div
          className={`product-grid ${styles.supportGrid}`}
          tabIndex={0}
          role="group"
          aria-labelledby="saved-history-title"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

function SavedDiscovery() {
  const { t } = usePresentation();
  const resource = useResource<Category[]>("/categories");
  const categories =
    resource.data
      ?.filter((category) => category.parent_id === null)
      .slice(0, 6) ?? [];
  if (!resource.loading && !resource.error && !categories.length) return null;
  return (
    <section
      className={styles.discovery}
      aria-labelledby="saved-discovery-title"
    >
      <h2 id="saved-discovery-title">{t("Популярные категории")}</h2>
      {resource.loading && <Loading />}
      {resource.error && (
        <Failure error={resource.error} retry={resource.retry} />
      )}
      {categories.length > 0 && (
        <div className={styles.shortcuts}>
          {categories.map((category) => (
            <Link key={category.id} href={`/catalog/${category.slug}`}>
              {t(category.name)} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function SavedItemsPage() {
  const { t, money } = usePresentation();
  const saved = useSavedItems();
  const ids = saved.ids.join(",");
  const resource = useResource<ProductPage>(
    ids ? `/products?ids=${encodeURIComponent(ids)}&page_size=48` : null,
  );
  const byId = new Map(
    resource.data?.items.map((product) => [product.id, product]),
  );
  const products = saved.ids.flatMap((id) =>
    byId.has(id) ? [byId.get(id)!] : [],
  );
  const available = products.filter(
    (product) => product.is_active && Number(product.stock_quantity) >= 1,
  );
  const staleIds = saved.ids.filter((id) => !byId.has(id));
  const total = available.reduce(
    (sum, product) => sum + cents(product.price),
    0,
  );
  const items = products.map((product) => ({
    product_id: product.id,
    quantity: 1,
    name: product.name,
  }));
  const ready = saved.count > 0 && !resource.loading && !resource.error;

  return (
    <div className={`polish-page saved-items-page ${styles.page}`}>
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Сохранённые товары" },
        ]}
      />
      <PageIntro
        eyebrow="Список покупок"
        title="Сохранённые товары"
        description="Сохраните нужное сейчас и добавьте в корзину, когда будете готовы."
        icon={Heart}
        variant="compact"
      />
      <section
        className={styles.savedSection}
        aria-label={t("Ваши сохранённые товары")}
      >
        {!saved.count ? (
          <div className={styles.empty}>
            <span className={styles.icon}>
              <Heart size={28} aria-hidden="true" />
            </span>
            <div>
              <h2>{t("Здесь пока ничего нет")}</h2>
              <p>{t("Сохраняйте товары, чтобы вернуться к ним позже.")}</p>
            </div>
            <Link className="button" href="/catalog">
              {t("Перейти в каталог")}{" "}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        ) : resource.loading ? (
          <Loading kind="grid" />
        ) : resource.error ? (
          <Failure error={resource.error} retry={resource.retry} />
        ) : (
          <>
            <div className={styles.toolbar}>
              <div className={styles.summary} aria-live="polite">
                <span>
                  <strong>{saved.count}</strong> {t("сохранено")}
                </span>
                <span>
                  <strong>{available.length}</strong> {t("в наличии")}
                </span>
                {saved.count > available.length && (
                  <span>
                    <strong>{saved.count - available.length}</strong>{" "}
                    {t("недоступно")}
                  </span>
                )}
                {available.length > 0 && <strong>≈ {money(total)}</strong>}
              </div>
              <p className={styles.help}>
                {t("Оценка доступных товаров, по одной единице каждого.")}
              </p>
              <div className={styles.actions}>
                <AddShoppingItems
                  key={ids}
                  items={available.map((product) => ({
                    product_id: product.id,
                    quantity: 1,
                  }))}
                  label="Добавить доступные в корзину"
                  icon={<ShoppingBasket size={18} aria-hidden="true" />}
                />
                {products.length > 0 && (
                  <Link href="#saved-template" className="button secondary">
                    <FilePlus2 size={18} aria-hidden="true" />
                    {t("Создать шаблон")}
                  </Link>
                )}
                <button
                  type="button"
                  className={`text-link ${styles.clear}`}
                  onClick={saved.clear}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {t("Очистить сохранённые")}
                </button>
              </div>
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
            {products.length > 0 ? (
              <div
                className={`product-grid ${styles.savedGrid}`}
                data-count={products.length}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className={styles.unavailable}>
                <h2>{t("Сохранённые товары недоступны")}</h2>
                <p className={styles.help}>
                  {t("Очистите список или выберите новые товары в каталоге.")}
                </p>
                <Link className="text-link" href="/catalog">
                  {t("Перейти в каталог")}{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </>
        )}
      </section>
      {(ready || !saved.count) && (
        <SavedComplements products={products} excludedIds={saved.ids} />
      )}
      <RecentlyViewed />
      <SavedDiscovery />
      {ready && products.length > 0 && (
        <section
          id="saved-template"
          className={styles.templatePanel}
          aria-labelledby="saved-template-title"
        >
          <span className={styles.icon}>
            <Layers3 size={26} aria-hidden="true" />
          </span>
          <div>
            <h2 id="saved-template-title">
              {t("Создайте шаблон из сохранённого")}
            </h2>
            <p>
              {t(
                "Сохраните эти товары как готовую корзину. Название и состав можно изменить позже.",
              )}
            </p>
            {staleIds.length > 0 && (
              <p className={styles.help}>
                {t("В шаблон попадут товары, которые ещё есть в каталоге.")}
              </p>
            )}
          </div>
          <SaveShoppingTemplate
            key={ids}
            items={items}
            templateName={t("Сохранённые товары")}
            label="Создать шаблон"
            icon={<FilePlus2 size={18} aria-hidden="true" />}
          />
        </section>
      )}
    </div>
  );
}
