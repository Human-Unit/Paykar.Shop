"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import { CategoryLabel } from "./category-label";
import { catalogGroups } from "@/lib/category-presentation";

const pageSize = 12;
const sorts = ["name", "price_asc", "price_desc"] as const;
type Sort = (typeof sorts)[number];
type Filters = {
  q: string;
  sort: Sort;
  inStock: boolean;
  onSale: boolean;
  page: number;
};

// Defaults stay out of the address, so a shared link carries only choices.
function catalogHref(path: string, filters: Filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== "name") params.set("sort", filters.sort);
  if (filters.inStock) params.set("in_stock", "true");
  if (filters.onSale) params.set("on_sale", "true");
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

// First, last and the current page with its neighbours; 0 marks a gap.
function pageNumbers(current: number, total: number) {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index) =>
    index && page - pages[index - 1] > 1 ? [0, page] : [page],
  );
}

export function Catalog({ slug }: { slug?: string }) {
  const { t } = usePresentation();
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") || "";
  const sortParam = params.get("sort");
  const sort = sorts.find((value) => value === sortParam) ?? "name";
  const inStock = params.get("in_stock") === "true";
  const onSale = params.get("on_sale") === "true";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1") || 1);
  const filters: Filters = { q, sort, inStock, onSale, page };
  const query = new URLSearchParams({
    q,
    sort,
    page: String(page),
    page_size: String(pageSize),
    in_stock: String(inStock),
  });
  if (onSale) query.set("on_sale", "true");
  if (slug) query.set("category", slug);
  const products = useResource<ProductPage>(`/products?${query}`);
  const categories = useResource<Category[]>("/categories");
  const category = useResource<Category>(
    slug ? `/categories/${encodeURIComponent(slug)}` : null,
  );
  const path = slug ? `/catalog/${slug}` : "/catalog";

  // Keep the previous results on screen while the next filter state loads.
  const [shown, setShown] = useState<ProductPage>();
  if (products.data && products.data !== shown) setShown(products.data);

  // Search text applies itself after a pause; Enter applies it at once.
  const [draft, setDraft] = useState(q);
  const [applied, setApplied] = useState(q);
  if (q !== applied) {
    setApplied(q);
    if (q !== draft.trim()) setDraft(q);
  }
  useEffect(() => {
    const value = draft.trim();
    if (value === q) return;
    const timer = setTimeout(
      () =>
        router.replace(
          catalogHref(path, { q: value, sort, inStock, onSale, page: 1 }),
          { scroll: false },
        ),
      450,
    );
    return () => clearTimeout(timer);
  }, [draft, q, path, sort, inStock, onSale, router]);

  // Any change of filters returns to the first page.
  function apply(next: Partial<Filters>) {
    router.push(catalogHref(path, { ...filters, page: 1, ...next }), {
      scroll: false,
    });
  }
  if (category.error?.status === 404) notFound();
  const total = shown?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
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
      <header className="catalog-head">
        <div className="page-title">
          <h1>{t(category.data?.name) || t("Каталог товаров")}</h1>
          <p>
            {q
              ? t("Поиск: «") + q + "»"
              : t("Выбирайте любимые продукты и товары для дома")}
          </p>
        </div>
        {shown && (
          <p className="result-count">
            {t("Найдено товаров: ")}
            <strong>{total}</strong>
          </p>
        )}
      </header>
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
            href={catalogHref("/catalog", { ...filters, q: "", page: 1 })}
          >
            <CategoryLabel name="Все товары" />
          </Link>
          {/* Each parent is followed by its own children, whatever order the
              API returns them in. */}
          {catalogGroups(categories.data ?? [])
            .flatMap(({ category: root, children }) => [root, ...children])
            .map((c) => (
              <Link
                key={c.id}
                className={`${slug === c.slug ? "active" : ""} ${c.parent_id ? "child" : ""}`}
                href={catalogHref(`/catalog/${c.slug}`, {
                  ...filters,
                  q: "",
                  page: 1,
                })}
                aria-current={slug === c.slug ? "page" : undefined}
              >
                <CategoryLabel slug={c.slug} name={c.name} />
              </Link>
            ))}
        </aside>
        <section aria-label={t("Товары")}>
          <form
            className="catalog-toolbar"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              apply({ q: draft.trim() });
            }}
          >
            <label className="toolbar-search">
              <span className="sr-only">{t("Поиск")}</span>
              <Search size={18} aria-hidden="true" />
              <input
                name="q"
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
            </label>
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
            <label className="filter-toggle">
              <input
                name="in_stock"
                type="checkbox"
                checked={inStock}
                onChange={(event) => apply({ inStock: event.target.checked })}
              />
              <PackageCheck size={16} aria-hidden="true" />
              <span>{t("В наличии")}</span>
            </label>
            <label className="filter-toggle">
              <input
                name="on_sale"
                type="checkbox"
                checked={onSale}
                onChange={(event) => apply({ onSale: event.target.checked })}
              />
              <BadgePercent size={16} aria-hidden="true" />
              <span>{t("Со скидкой")}</span>
            </label>
          </form>
          {(q || inStock || onSale) && (
            <ul className="active-filters" aria-label={t("Фильтры")}>
              {q && (
                <li>
                  <Link
                    href={catalogHref(path, { ...filters, q: "", page: 1 })}
                    scroll={false}
                    aria-label={t("Убрать фильтр: ") + q}
                  >
                    «{q}»
                    <X size={14} aria-hidden="true" />
                  </Link>
                </li>
              )}
              {inStock && (
                <li>
                  <Link
                    href={catalogHref(path, {
                      ...filters,
                      inStock: false,
                      page: 1,
                    })}
                    scroll={false}
                    aria-label={t("Убрать фильтр: ") + t("В наличии")}
                  >
                    {t("В наличии")}
                    <X size={14} aria-hidden="true" />
                  </Link>
                </li>
              )}
              {onSale && (
                <li>
                  <Link
                    href={catalogHref(path, {
                      ...filters,
                      onSale: false,
                      page: 1,
                    })}
                    scroll={false}
                    aria-label={t("Убрать фильтр: ") + t("Со скидкой")}
                  >
                    {t("Со скидкой")}
                    <X size={14} aria-hidden="true" />
                  </Link>
                </li>
              )}
              <li>
                <Link
                  className="filter-reset"
                  href={catalogHref(path, {
                    q: "",
                    sort,
                    inStock: false,
                    onSale: false,
                    page: 1,
                  })}
                  scroll={false}
                >
                  {t("Сбросить всё")}
                </Link>
              </li>
            </ul>
          )}
          {!shown && products.loading && <Loading kind="grid" />}
          {products.error && (
            <Failure error={products.error} retry={products.retry} />
          )}
          {shown && !products.error && (
            <div className="catalog-results" aria-busy={products.loading}>
              {!shown.items.length ? (
                <Empty
                  title={t("Ничего не найдено")}
                  text={t("Попробуйте другое название или измените фильтры.")}
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
                      href={catalogHref(path, { ...filters, page: page - 1 })}
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
                    ) : number === page ? (
                      <span key={number} aria-current="page">
                        {number}
                      </span>
                    ) : (
                      <Link
                        key={number}
                        href={catalogHref(path, { ...filters, page: number })}
                        aria-label={t("Страница ") + number}
                      >
                        {number}
                      </Link>
                    ),
                  )}
                  {page < pages && (
                    <Link
                      className="pagination-step"
                      href={catalogHref(path, { ...filters, page: page + 1 })}
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
