"use client";

import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, X } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Category, ProductPage, useResource } from "@/lib/api";
import {
  catalogApiQuery,
  catalogHref,
  catalogParameters,
  descendantCategories,
} from "@/lib/catalog-query";
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import { CatalogFilters } from "./catalog-filters";

export function Catalog({ slug }: { slug?: string }) {
  const { t, money } = usePresentation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = catalogParameters(
    new URLSearchParams(searchParams.toString()),
    slug,
  );
  const paramsKey = params.toString();
  const categorySlug = params.get("category") || "";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "name";
  const inStock = params.get("in_stock") === "true";
  const onSale = params.get("on_sale") === "true";
  const min = params.get("min_price");
  const max = params.get("max_price");
  const page = Number(params.get("page") || "1");
  const products = useResource<ProductPage>(catalogApiQuery(params, true));
  const categories = useResource<Category[]>("/categories");
  const allCategories = categories.data || [];
  const category = allCategories.find((item) => item.slug === categorySlug);
  const subcategory = allCategories.find(
    (item) => item.slug === params.get("subcategory"),
  );
  const roots = allCategories.filter((item) => item.parent_id === null);
  const root = roots.find(
    (item) =>
      item.slug === categorySlug ||
      descendantCategories(allCategories, item.slug).some(
        (child) => child.slug === categorySlug,
      ),
  );

  if (
    slug &&
    categories.data &&
    !allCategories.some((item) => item.slug === slug)
  )
    notFound();

  function categoryHref(value: string) {
    const child = params.get("subcategory");
    const valid =
      !value ||
      descendantCategories(allCategories, value).some(
        (item) => item.slug === child,
      );
    return catalogHref(params, {
      category: value,
      ...(valid ? {} : { subcategory: null }),
    });
  }

  const active: { key: string; label: string; remove: Record<string, null> }[] =
    [];
  if (categorySlug)
    active.push({
      key: "category",
      label: t(category?.name) || categorySlug,
      remove: { category: null },
    });
  if (params.get("subcategory"))
    active.push({
      key: "subcategory",
      label: t(subcategory?.name) || params.get("subcategory")!,
      remove: { subcategory: null },
    });
  if (q)
    active.push({
      key: "q",
      label: `${t("Поиск")}: ${q}`,
      remove: { q: null },
    });
  if (min || max)
    active.push({
      key: "price",
      label: [
        min ? `${t("От")} ${money(Number(min) * 100)}` : "",
        max ? `${t("До")} ${money(Number(max) * 100)}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      remove: { min_price: null, max_price: null },
    });
  if (inStock)
    active.push({
      key: "in_stock",
      label: t("В наличии"),
      remove: { in_stock: null },
    });
  if (onSale)
    active.push({
      key: "on_sale",
      label: t("По акции"),
      remove: { on_sale: null },
    });
  if (params.has("min_discount"))
    active.push({
      key: "min_discount",
      label: `${t("Скидка")}: ${params.get("min_discount")}%+`,
      remove: { min_discount: null },
    });
  if (params.get("unit"))
    active.push({
      key: "unit",
      label: `${t("Единица продажи")}: ${t(params.get("unit") || undefined)}`,
      remove: { unit: null },
    });
  if (sort !== "name")
    active.push({
      key: "sort",
      label: `${t("Сортировка")}: ${t(sort === "price_asc" ? "Сначала дешевле" : "Сначала дороже")}`,
      remove: { sort: null },
    });

  return (
    <div className="polish-page catalog-page shopping-catalog catalog-discovery">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          { label: t("Каталог"), href: categorySlug ? "/catalog" : undefined },
          ...(categorySlug
            ? [{ label: t(category?.name) || categorySlug }]
            : []),
        ]}
      />
      <header className="catalog-heading shopping-catalog-heading">
        <div className="page-title">
          <span className="eyebrow">{t("Покупки на каждый день")}</span>
          <h1>{t(category?.name) || t("Каталог товаров")}</h1>
          <p>{t("Выбирайте продукты по названию, цене и наличию.")}</p>
        </div>
      </header>
      <div className="catalog-layout shopping-catalog-layout phase4-catalog-layout">
        <section className="catalog-results" aria-label={t("Товары")}>
          <nav
            className="catalog-categories-horizontal"
            aria-label={t("Категории товаров")}
          >
            <Link
              className={!categorySlug ? "active" : ""}
              aria-current={!categorySlug ? "page" : undefined}
              href={categoryHref("")}
              scroll={false}
            >
              {t("Все товары")}
            </Link>
            {roots.map((item) => (
              <Link
                key={item.id}
                className={root?.id === item.id ? "active" : ""}
                aria-current={root?.id === item.id ? "page" : undefined}
                href={categoryHref(item.slug)}
                scroll={false}
              >
                {t(item.name)}
              </Link>
            ))}
          </nav>
          {categories.loading && <Loading label="Загружаем категории…" />}
          {categories.error && (
            <Failure error={categories.error} retry={categories.retry} />
          )}

          <div className="catalog-discovery-controls">
            <form
              className="catalog-search-form"
              role="search"
              key={paramsKey}
              onSubmit={(event) => {
                event.preventDefault();
                const value = String(
                  new FormData(event.currentTarget).get("q") || "",
                ).trim();
                router.push(catalogHref(params, { q: value }), {
                  scroll: false,
                });
              }}
            >
              <label htmlFor="catalog-search" className="sr-only">
                {t("Поиск в каталоге")}
              </label>
              <input
                id="catalog-search"
                name="q"
                defaultValue={q}
                maxLength={200}
                placeholder={t("Искать в каталоге...")}
              />
              <button
                type="submit"
                className="button secondary"
                aria-label={t("Искать")}
              >
                <Search size={20} aria-hidden="true" />
              </button>
            </form>
            <div className="catalog-discovery-toolbar">
              <p
                className="catalog-discovery-count"
                role="status"
                aria-live="polite"
              >
                {products.loading
                  ? t("Загружаем товары…")
                  : products.data
                    ? `${products.data.total} ${t("товаров")}`
                    : "—"}
              </p>
              <div className="catalog-discovery-actions">
                <CatalogFilters
                  key={paramsKey}
                  params={params}
                  categories={allCategories}
                  facets={products.data?.facets}
                />
                <label className="catalog-discovery-sort">
                  <span className="sr-only">{t("Сортировка")}</span>
                  <select
                    value={sort}
                    onChange={(event) =>
                      router.push(
                        catalogHref(params, { sort: event.target.value }),
                        { scroll: false },
                      )
                    }
                  >
                    <option value="name">{t("По названию")}</option>
                    <option value="price_asc">{t("Сначала дешевле")}</option>
                    <option value="price_desc">{t("Сначала дороже")}</option>
                  </select>
                </label>
              </div>
            </div>
            <div
              className="catalog-quick-filters"
              aria-label={t("Быстрые фильтры")}
            >
              <Link
                className={inStock ? "selected" : ""}
                href={catalogHref(params, {
                  in_stock: inStock ? null : "true",
                })}
                scroll={false}
              >
                {t("В наличии")}
              </Link>
              <Link
                className={onSale ? "selected" : ""}
                href={catalogHref(params, { on_sale: onSale ? null : "true" })}
                scroll={false}
              >
                {t("По акции")}
              </Link>
            </div>
            {active.length > 0 && (
              <div
                className="catalog-active-filters"
                aria-label={t("Активные фильтры")}
              >
                {active.map((filter) => (
                  <Link
                    key={filter.key}
                    href={catalogHref(params, filter.remove)}
                    scroll={false}
                    className="filter-chip"
                    aria-label={`${t("Удалить фильтр")}: ${filter.label}`}
                  >
                    {filter.label}
                    <X size={14} aria-hidden="true" />
                  </Link>
                ))}
                <Link
                  className="catalog-clear-filters"
                  href="/catalog"
                  scroll={false}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  {t("Сбросить всё")}
                </Link>
              </div>
            )}
          </div>

          {products.loading && <Loading kind="grid" />}
          {products.error &&
            (products.error.status === 422 ? (
              <div className="catalog-filter-error" role="alert">
                <p>{t("Проверьте значения фильтров.")}</p>
                <Link href="/catalog">{t("Сбросить всё")}</Link>
              </div>
            ) : (
              <Failure error={products.error} retry={products.retry} />
            ))}
          {products.data && (
            <>
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
                  <Link href={catalogHref(params, { page: String(page - 1) })}>
                    {t("← Назад")}
                  </Link>
                )}
                <span>
                  {t("Страница ")}
                  {page}
                  {t(" из ")}
                  {Math.max(1, Math.ceil(products.data.total / 12))}
                </span>
                {page * 12 < products.data.total && (
                  <Link href={catalogHref(params, { page: String(page + 1) })}>
                    {t("Далее →")}
                  </Link>
                )}
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
