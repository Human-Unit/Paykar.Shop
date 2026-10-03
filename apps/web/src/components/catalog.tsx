"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import { ShoppingBanner } from "./shopping-banner";
import { CategoryLabel } from "./category-label";
import { SlidersHorizontal, ShoppingBasket } from "lucide-react";
export function Catalog({ slug }: { slug?: string }) {
  const { t } = usePresentation();
  const params = useSearchParams();
  const q = params.get("q") || "";
  const sort = ["name", "price_asc", "price_desc"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "name";
  const inStock = params.get("in_stock") === "true";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1") || 1);
  const query = new URLSearchParams({
    q,
    sort,
    page: String(page),
    page_size: "12",
    in_stock: String(inStock),
  });
  if (slug) query.set("category", slug);
  const products = useResource<ProductPage>(`/products?${query}`);
  const categories = useResource<Category[]>("/categories");
  const category = useResource<Category>(
    slug ? `/categories/${encodeURIComponent(slug)}` : null,
  );
  const path = slug ? `/catalog/${slug}` : "/catalog";
  function pageHref(value: number) {
    const copy = new URLSearchParams(query);
    copy.delete("category");
    copy.set("page", String(value));
    return `${path}?${copy}`;
  }
  if (category.error?.status === 404) notFound();
  return (
    <div className="polish-page catalog-page">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          {
            label: t("Каталог"),
            href: slug ? "/catalog" : undefined,
          },
          ...(slug ? [{ label: t(category.data?.name) || "…" }] : []),
        ]}
      />
      <div className="catalog-heading">
        <div className="page-title">
          <span className="eyebrow">
            <ShoppingBasket size={16} aria-hidden="true" />
            {t("Свежий выбор на каждый день")}
          </span>
          <h1>{t(category.data?.name) || t("Каталог товаров")}</h1>
          <p>
            {q
              ? t("Поиск: «") + q + "»"
              : t("Выбирайте любимые продукты и товары для дома")}
          </p>
        </div>
        <ShoppingBanner />
      </div>
      {category.error && (
        <Failure error={category.error} retry={category.retry} />
      )}
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>{t("Категории")}</h2>
          {categories.loading && <Loading label="Загружаем категории…" />}
          {categories.error && (
            <Failure error={categories.error} retry={categories.retry} />
          )}
          <Link
            className={!slug ? "active" : ""}
            aria-current={!slug ? "page" : undefined}
            href="/catalog"
          >
            <CategoryLabel name="Все товары" />
          </Link>
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              className={`${slug === c.slug ? "active" : ""} ${c.parent_id ? "child" : ""}`}
              href={`/catalog/${c.slug}`}
              aria-current={slug === c.slug ? "page" : undefined}
            >
              <CategoryLabel slug={c.slug} name={c.name} />
            </Link>
          ))}
        </aside>
        <section aria-label={t("Товары")}>
          <form
            action={path}
            className="catalog-controls"
            key={`${q}:${sort}:${inStock}`}
          >
            <label className="filter-search">
              {t("Поиск")}
              <input
                name="q"
                defaultValue={q}
                maxLength={200}
                placeholder={t("Название или артикул")}
              />
            </label>
            <label>
              {t("Сортировка")}
              <select name="sort" defaultValue={sort}>
                <option value="name">{t("По названию")}</option>
                <option value="price_asc">{t("Сначала дешевле")}</option>
                <option value="price_desc">{t("Сначала дороже")}</option>
              </select>
            </label>
            <label className="stock-filter">
              <input
                name="in_stock"
                type="checkbox"
                value="true"
                defaultChecked={inStock}
              />{" "}
              {t("В наличии")}
            </label>
            <button className="button" type="submit">
              <SlidersHorizontal size={18} aria-hidden="true" />
              {t("Применить")}
            </button>
          </form>
          {products.loading && <Loading kind="grid" />}
          {products.error && (
            <Failure error={products.error} retry={products.retry} />
          )}
          {products.data && (
            <>
              <div className="catalog-results-line">
                <p className="result-count">
                  {t("Найдено товаров: ")}
                  <strong>{products.data.total}</strong>
                </p>
                <span>{t(inStock ? "В наличии" : "Все товары")}</span>
              </div>
              {!products.data.items.length ? (
                <Empty
                  title={t("Ничего не найдено")}
                  text={t("Попробуйте другое название или измените фильтры.")}
                />
              ) : (
                <div className="product-grid catalog-grid">
                  {products.data.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
              <nav className="pagination" aria-label={t("Страницы каталога")}>
                {page > 1 && (
                  <Link href={pageHref(page - 1)}>{t("← Назад")}</Link>
                )}
                <span>
                  {t("Страница ")}
                  {page}
                  {t(" из")} {Math.max(1, Math.ceil(products.data.total / 12))}
                </span>
                {page * 12 < products.data.total && (
                  <Link href={pageHref(page + 1)}>{t("Далее →")}</Link>
                )}
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
