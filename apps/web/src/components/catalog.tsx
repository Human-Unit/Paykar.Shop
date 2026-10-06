"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { Check, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import { CategoryLabel } from "./category-label";

export function Catalog({ slug }: { slug?: string }) {
  const { t } = usePresentation();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = params.get("q") || "";
  const sort = ["name", "price_asc", "price_desc"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "name";
  const inStock = params.get("in_stock") === "true";
  const onSale = params.get("on_sale") === "true";
  const minPrice = params.get("min_price") || "";
  const maxPrice = params.get("max_price") || "";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1") || 1);
  const query = new URLSearchParams({
    q,
    sort,
    page: String(page),
    page_size: "12",
    in_stock: String(inStock),
    on_sale: String(onSale),
  });
  if (minPrice) query.set("min_price", minPrice);
  if (maxPrice) query.set("max_price", maxPrice);
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

  function removeFilter(key: string) {
    const copy = new URLSearchParams(params.toString());
    copy.delete(key);
    copy.delete("page");
    return copy.size ? `${path}?${copy}` : path;
  }

  if (category.error?.status === 404) notFound();

  return (
    <div className="polish-page catalog-page shopping-catalog">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          { label: t("Каталог"), href: slug ? "/catalog" : undefined },
          ...(slug ? [{ label: t(category.data?.name) || "…" }] : []),
        ]}
      />
      <header className="catalog-heading shopping-catalog-heading">
        <div className="page-title">
          <span className="eyebrow">{t("Покупки на каждый день")}</span>
          <h1>{t(category.data?.name) || t("Каталог товаров")}</h1>
          <p>{t("Выбирайте продукты по названию, цене и наличию.")}</p>
        </div>
      </header>
      {category.error && (
        <Failure error={category.error} retry={category.retry} />
      )}

      <div className="catalog-layout shopping-catalog-layout phase4-catalog-layout">
        <section className="catalog-results" aria-label={t("Товары")}>
          <div className="catalog-top-controls">
            <nav className="catalog-categories-horizontal" aria-label={t("Категории товаров")}>
              {categories.loading && <Loading label="Загружаем категории…" />}
              {categories.error && (
                <Failure error={categories.error} retry={categories.retry} />
              )}
              <Link
                className={!slug ? "active" : ""}
                aria-current={!slug ? "page" : undefined}
                href="/catalog"
              >
                {t("Все товары")}
              </Link>
              {categories.data?.filter(c => c.parent_id === null).map((item) => (
                <Link
                  key={item.id}
                  className={`${slug === item.slug ? "active" : ""}`}
                  href={`/catalog/${item.slug}`}
                  aria-current={slug === item.slug ? "page" : undefined}
                >
                  {t(item.name)}
                </Link>
              ))}
            </nav>
          </div>
          
          <form
            action={path}
            className="catalog-controls shopping-filters phase4-filters"
            key={`${q}:${sort}:${inStock}:${onSale}:${minPrice}:${maxPrice}`}
          >
            <div className="catalog-filter-toolbar">
              <label className="filter-search">
                <span className="sr-only">{t("Поиск")}</span>
                <input
                  name="q"
                  defaultValue={q}
                  maxLength={200}
                  placeholder={t("Искать в каталоге...")}
                />
              </label>
              
              <div className="catalog-toolbar-actions">
                <button
                  className="button secondary mobile-filter-toggle"
                  type="button"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen((open) => !open)}
                >
                  <SlidersHorizontal size={17} aria-hidden="true" />
                  {t("Фильтры")}
                </button>
                <div className="catalog-product-count">
                  {products.data?.total || 0} {t("товаров")}
                </div>
                <label className="catalog-sort">
                  <span className="sr-only">{t("Сортировка")}</span>
                  <select name="sort" defaultValue={sort}>
                    <option value="name">{t("По названию")}</option>
                    <option value="price_asc">{t("Сначала дешевле")}</option>
                    <option value="price_desc">{t("Сначала дороже")}</option>
                  </select>
                </label>
              </div>
            </div>
            <div
              className={`catalog-filter-panel${filtersOpen ? " is-open" : ""}`}
            >
              <fieldset className="price-filter">
                <legend>{t("Цена, сомони")}</legend>
                <label>
                  <span className="sr-only">{t("Цена от")}</span>
                  <input
                    name="min_price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder={t("От")}
                    defaultValue={minPrice}
                  />
                </label>
                <span aria-hidden="true">—</span>
                <label>
                  <span className="sr-only">{t("Цена до")}</span>
                  <input
                    name="max_price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder={t("До")}
                    defaultValue={maxPrice}
                  />
                </label>
              </fieldset>
              <label className="filter-check">
                <input
                  name="in_stock"
                  type="checkbox"
                  value="true"
                  defaultChecked={inStock}
                />
                {t("В наличии")}
              </label>
              <label className="filter-check">
                <input
                  name="on_sale"
                  type="checkbox"
                  value="true"
                  defaultChecked={onSale}
                />
                <span>{t("По акции")}</span>
              </label>
              <button className="button filter-apply" type="submit">
                <Check size={17} aria-hidden="true" /> {t("Показать товары")}
              </button>
              {(q || inStock || onSale || minPrice || maxPrice) && (
                <Link className="filter-reset" href={path}>
                  <RotateCcw size={15} aria-hidden="true" /> {t("Сбросить")}
                </Link>
              )}
            </div>
          </form>

          {(q || inStock || onSale || minPrice || maxPrice) && (
            <div
              className="active-filter-chips"
              aria-label={t("Активные фильтры")}
            >
              {q && (
                <Link href={removeFilter("q")} className="filter-chip">
                  {t("Поиск")}: {q}
                  <X size={14} aria-hidden="true" />
                </Link>
              )}
              {minPrice && (
                <Link href={removeFilter("min_price")} className="filter-chip">
                  {t("От")}: {minPrice}
                  <X size={14} aria-hidden="true" />
                </Link>
              )}
              {maxPrice && (
                <Link href={removeFilter("max_price")} className="filter-chip">
                  {t("До")}: {maxPrice}
                  <X size={14} aria-hidden="true" />
                </Link>
              )}
              {inStock && (
                <Link href={removeFilter("in_stock")} className="filter-chip">
                  {t("В наличии")}
                  <X size={14} aria-hidden="true" />
                </Link>
              )}
              {onSale && (
                <Link href={removeFilter("on_sale")} className="filter-chip">
                  {t("По акции")}
                  <X size={14} aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

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
                  {products.data.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
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
                  {t(" из ")} {Math.max(1, Math.ceil(products.data.total / 12))}
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
