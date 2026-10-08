"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  ArrowUpDown,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Search,
  X,
} from "lucide-react";
import { Category, ProductPage, useResource } from "@/lib/api";
import {
  catalogApiQuery,
  catalogHref,
  catalogParameters,
  categoryFilterChanges,
} from "@/lib/catalog-query";
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import { CategoryLabel } from "./category-label";
import { catalogGroups } from "@/lib/category-presentation";
import { CatalogFilterDialog } from "./catalog-filter-dialog";

const pageSize = 12;
const sorts = ["name", "price_asc", "price_desc"] as const;
// Diyor's compact pagination: first, last, and the current page's neighbours.
function pageNumbers(current: number, total: number) {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index) =>
    index && page - pages[index - 1] > 1 ? [0, page] : [page],
  );
}
export function Catalog({ slug }: { slug?: string }) {
  const { t, money } = usePresentation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = useId();
  const params = catalogParameters(
    new URLSearchParams(searchParams.toString()),
    slug,
  );
  const paramsKey = params.toString();
  const discountInUrl = searchParams.get("min_discount");
  const saleNeedsNormalization =
    discountInUrl !== null &&
    discountInUrl !== "" &&
    Number.isFinite(Number(discountInUrl)) &&
    Number(discountInUrl) >= 0 &&
    Number(discountInUrl) <= 100 &&
    (searchParams.get("on_sale") !== "true" || Number(discountInUrl) === 0);
  const categorySlug = params.get("category") || "";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "name";
  const inStock = params.get("in_stock") === "true";
  const onSale = params.get("on_sale") === "true";
  const page = Number(params.get("page") || "1");
  const products = useResource<ProductPage>(
    catalogApiQuery(params, true, pageSize),
  );
  const categories = useResource<Category[]>("/categories");
  const allCategories = categories.data || [];
  const category = allCategories.find((item) => item.slug === categorySlug);
  const subcategory = allCategories.find(
    (item) => item.slug === params.get("subcategory"),
  );
  // Retain Diyor's previous grid while loading, without reporting its old count.
  const [shown, setShown] = useState<ProductPage>();
  if (products.data && products.data !== shown) setShown(products.data);
  const [draft, setDraft] = useState(q);
  const [applied, setApplied] = useState(q);
  if (q !== applied) {
    setApplied(q);
    if (q !== draft.trim()) setDraft(q);
  }
  useEffect(() => {
    if (!saleNeedsNormalization) return;
    const canonical = new URLSearchParams(paramsKey);
    router.replace(catalogHref(canonical, { page: canonical.get("page") }), {
      scroll: false,
    });
  }, [saleNeedsNormalization, paramsKey, router]);
  useEffect(() => {
    const value = draft.trim();
    if (value === q) return;
    const timer = setTimeout(
      () =>
        router.replace(
          catalogHref(new URLSearchParams(paramsKey), { q: value }),
          { scroll: false },
        ),
      450,
    );
    return () => clearTimeout(timer);
  }, [draft, q, paramsKey, router]);
  function apply(changes: Record<string, string | null>) {
    router.push(catalogHref(params, changes), { scroll: false });
  }
  function categoryHref(value: string) {
    return catalogHref(
      params,
      categoryFilterChanges(params, allCategories, value),
    );
  }
  if (
    slug &&
    categories.data &&
    !allCategories.some((item) => item.slug === slug)
  )
    notFound();
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
  if (q) active.push({ key: "q", label: `«${q}»`, remove: { q: null } });
  const min = params.get("min_price");
  const max = params.get("max_price");
  if (min || max)
    active.push({
      key: "price",
      label:
        `${t("Цена")}: ` +
        [
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
      label: t("Со скидкой"),
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
      label: t(sort === "price_asc" ? "Сначала дешевле" : "Сначала дороже"),
      remove: { sort: null },
    });
  const total = products.data?.total;
  const pages = Math.max(1, Math.ceil((total ?? 0) / pageSize));
  return (
    <div className="polish-page catalog-page shopping-page">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          { label: t("Каталог"), href: categorySlug ? "/catalog" : undefined },
          ...(categorySlug
            ? [{ label: t(category?.name) || categorySlug }]
            : []),
        ]}
      />
      <header className="catalog-head commerce-heading">
        <div className="page-title">
          <h1>{t(category?.name) || t("Каталог товаров")}</h1>
          <p>
            {q
              ? t("Поиск: «") + q + "»"
              : t("Выбирайте любимые продукты и товары для дома")}
          </p>
        </div>
        <p className="result-count" role="status" aria-live="polite">
          {total === undefined ? (
            products.loading ? (
              t("Проверяем результаты…")
            ) : (
              t("Не удалось загрузить результаты. Повторите попытку.")
            )
          ) : (
            <>
              {t("Найдено товаров: ")}
              <strong>{total}</strong>
            </>
          )}
        </p>
      </header>
      <div className="catalog-layout">
        <aside className="catalog-sidebar" aria-label={t("Категории")}>
          <h2>{t("Категории")}</h2>
          {categories.loading && <Loading label="Загружаем категории…" />}
          {categories.error && (
            <Failure error={categories.error} retry={categories.retry} />
          )}
          <Link
            className={!categorySlug ? "active" : ""}
            aria-current={!categorySlug ? "page" : undefined}
            href={categoryHref("")}
            scroll={false}
          >
            <CategoryLabel name="Все товары" />
          </Link>
          {catalogGroups(allCategories)
            .flatMap(({ category: root, children }) => [root, ...children])
            .map((c) => (
              <Link
                key={c.id}
                className={`${categorySlug === c.slug ? "active" : ""} ${c.parent_id !== null ? "child" : ""}`}
                href={categoryHref(c.slug)}
                scroll={false}
                aria-current={categorySlug === c.slug ? "page" : undefined}
              >
                <CategoryLabel slug={c.slug} name={c.name} />
              </Link>
            ))}
        </aside>
        <section className="catalog-main" aria-label={t("Товары")}>
          <div className="catalog-toolbar">
            <form
              className="toolbar-search"
              role="search"
              aria-label={t("Поиск в каталоге")}
              onSubmit={(event) => {
                event.preventDefault();
                apply({ q: draft.trim() });
              }}
            >
              <label htmlFor={searchId} className="sr-only">
                {t("Поиск")}
              </label>
              <Search size={18} aria-hidden="true" />
              <input
                name="q"
                id={searchId}
                value={draft}
                maxLength={200}
                autoComplete="off"
                enterKeyHint="search"
                placeholder={t("Название или артикул")}
                onChange={(event) => setDraft(event.target.value)}
              />
              {draft && (
                <button
                  type="button"
                  aria-label={t("Очистить поиск")}
                  onClick={() => {
                    setDraft("");
                    apply({ q: "" });
                  }}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </form>
            <label className="toolbar-sort">
              <span className="sr-only">{t("Сортировка")}</span>
              <ArrowUpDown size={16} aria-hidden="true" />
              <select
                name="sort"
                value={sort}
                onChange={(event) =>
                  apply({
                    sort:
                      sorts.find((value) => value === event.target.value) ??
                      "name",
                  })
                }
              >
                <option value="name">{t("По названию")}</option>
                <option value="price_asc">{t("Сначала дешевле")}</option>
                <option value="price_desc">{t("Сначала дороже")}</option>
              </select>
            </label>
            <label className="filter-toggle quick-filter">
              <input
                name="in_stock"
                type="checkbox"
                checked={inStock}
                onChange={(event) =>
                  apply({ in_stock: event.target.checked ? "true" : null })
                }
              />
              <PackageCheck size={16} aria-hidden="true" />
              <span>{t("В наличии")}</span>
            </label>
            <label className="filter-toggle quick-filter">
              <input
                name="on_sale"
                type="checkbox"
                checked={onSale}
                onChange={(event) =>
                  apply({ on_sale: event.target.checked ? "true" : null })
                }
              />
              <BadgePercent size={16} aria-hidden="true" />
              <span>{t("Со скидкой")}</span>
            </label>
            <CatalogFilterDialog
              params={params}
              categories={allCategories}
              facets={products.data?.facets}
            />
          </div>
          {active.length > 0 && (
            <ul className="active-filters" aria-label={t("Активные фильтры")}>
              {active.map((filter) => (
                <li key={filter.key}>
                  <Link
                    href={catalogHref(params, filter.remove)}
                    scroll={false}
                    aria-label={t("Убрать фильтр: ") + filter.label}
                    onClick={() => {
                      if (filter.key === "q") setDraft("");
                    }}
                  >
                    {filter.label}
                    <X size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="filter-reset"
                  href="/catalog"
                  scroll={false}
                  onClick={() => setDraft("")}
                >
                  {t("Сбросить всё")}
                </Link>
              </li>
            </ul>
          )}
          {!shown && products.loading && <Loading kind="grid" />}
          {products.error &&
            (products.error.status === 422 ? (
              <Empty
                title={t("Проверьте значения фильтров.")}
                text={t("Попробуйте другое название или измените фильтры.")}
                actionLabel="Сбросить фильтры"
              />
            ) : (
              <Failure error={products.error} retry={products.retry} />
            ))}
          {shown && !products.error && (
            <div
              className="catalog-results"
              aria-busy={products.loading}
              inert={products.loading}
            >
              {!shown.items.length ? (
                <Empty
                  title={t("Ничего не найдено")}
                  text={t("Попробуйте другое название или измените фильтры.")}
                  actionLabel={
                    active.length ? "Сбросить фильтры" : "Открыть каталог"
                  }
                />
              ) : (
                <div className="product-grid catalog-grid">
                  {shown.items.map((p, index) => (
                    <ProductCard key={p.id} product={p} revealIndex={index} />
                  ))}
                </div>
              )}
              {pages > 1 && (
                <nav className="pagination" aria-label={t("Страницы каталога")}>
                  {page > 1 && (
                    <Link
                      className="pagination-step"
                      href={catalogHref(params, { page: String(page - 1) })}
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                      {t("Назад")}
                    </Link>
                  )}
                  {pageNumbers(page, pages).map((number, index) =>
                    !number ? (
                      <span
                        key={`gap-${index}`}
                        className="pagination-gap"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={number}
                        href={catalogHref(params, { page: String(number) })}
                        aria-current={number === page ? "page" : undefined}
                      >
                        {number}
                      </Link>
                    ),
                  )}
                  {page < pages && (
                    <Link
                      className="pagination-step"
                      href={catalogHref(params, { page: String(page + 1) })}
                    >
                      {t("Далее")}
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  )}
                </nav>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
