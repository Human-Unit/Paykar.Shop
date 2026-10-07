"use client";

import { FormEvent, useRef } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ShoppingBasket, X } from "lucide-react";

import { usePresentation } from "@/context/presentation";
import { Category, ProductPage, useResource } from "@/lib/api";
import { Breadcrumbs } from "./breadcrumbs";
import { CategoryLabel } from "./category-label";
import { ProductCard } from "./product-card";
import { Empty, Failure, Loading } from "./states";
import styles from "./catalog-discovery.module.css";

type PriceBound = "min" | "max";

function cleanPrice(value: string | null, bound: PriceBound) {
  if (!value) return "";
  const amount = Number(value.trim());
  if (!Number.isFinite(amount) || amount < 0) return "";
  return String(bound === "min" ? Math.floor(amount) : Math.ceil(amount));
}

export function Catalog({ slug }: { slug?: string }) {
  const { t, language } = usePresentation();
  const router = useRouter();
  const params = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const copy =
    language === "tj"
      ? {
          filters: "Филтрҳо",
          priceFrom: "Нарх аз",
          priceTo: "Нарх то",
          onSale: "Бо тахфиф",
          reset: "Пок кардан",
          clearAll: "Ҳамаашро пок кардан",
          activeFilters: "Филтрҳои фаъол",
          close: "Пӯшидан",
          invalidRange: "Нархи ҳадди ақал набояд аз ҳадди аксар зиёд бошад.",
          matching: "Филтрҳоро тағйир диҳед ё пок кунед, то молҳои бештарро бинед.",
        }
      : language === "en"
        ? {
            filters: "Filters",
            priceFrom: "Price from",
            priceTo: "Price to",
            onSale: "On sale",
            reset: "Reset",
            clearAll: "Clear all",
            activeFilters: "Active filters",
            close: "Close",
            invalidRange: "Minimum price cannot be greater than maximum price.",
            matching: "Change or clear filters to see more products.",
          }
        : {
            filters: "Фильтры",
            priceFrom: "Цена от",
            priceTo: "Цена до",
            onSale: "Со скидкой",
            reset: "Сбросить",
            clearAll: "Очистить всё",
            activeFilters: "Активные фильтры",
            close: "Закрыть",
            invalidRange: "Минимальная цена не может быть больше максимальной.",
            matching: "Измените или сбросьте фильтры, чтобы увидеть больше товаров.",
          };

  const q = params.get("q")?.trim() || "";
  const sort = ["name", "price_asc", "price_desc"].includes(
    params.get("sort") || "",
  )
    ? params.get("sort")!
    : "name";
  const inStock = params.get("in_stock") === "true";
  const onSale = params.get("on_sale") === "true";
  const minPrice = cleanPrice(params.get("min_price"), "min");
  const maxPrice = cleanPrice(params.get("max_price"), "max");
  const page = Math.max(1, Number.parseInt(params.get("page") || "1") || 1);
  const invalidRange =
    minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice);
  const path = slug ? `/catalog/${slug}` : "/catalog";

  function filterParams() {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (sort !== "name") next.set("sort", sort);
    if (inStock) next.set("in_stock", "true");
    if (onSale) next.set("on_sale", "true");
    if (minPrice) next.set("min_price", minPrice);
    if (maxPrice) next.set("max_price", maxPrice);
    return next;
  }

  function hrefFor(next: URLSearchParams) {
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  }

  function removeFilter(key: string) {
    const next = filterParams();
    next.delete(key);
    return hrefFor(next);
  }

  function pageHref(value: number) {
    const next = filterParams();
    if (value > 1) next.set("page", String(value));
    return hrefFor(next);
  }

  function applyFilters(event: FormEvent<HTMLFormElement>, closeDialog = false) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const next = new URLSearchParams();
    const search = String(data.get("q") || "").trim();
    const nextSort = String(data.get("sort") || "name");
    const nextMin = cleanPrice(String(data.get("min_price") || ""), "min");
    const nextMax = cleanPrice(String(data.get("max_price") || ""), "max");
    const maxInput = form.elements.namedItem("max_price") as HTMLInputElement | null;

    maxInput?.setCustomValidity("");
    if (nextMin && nextMax && Number(nextMin) > Number(nextMax)) {
      maxInput?.setCustomValidity(copy.invalidRange);
      maxInput?.reportValidity();
      return;
    }

    if (search) next.set("q", search);
    if (["price_asc", "price_desc"].includes(nextSort)) next.set("sort", nextSort);
    if (data.get("in_stock") === "true") next.set("in_stock", "true");
    if (data.get("on_sale") === "true") next.set("on_sale", "true");
    if (nextMin) next.set("min_price", nextMin);
    if (nextMax) next.set("max_price", nextMax);

    if (closeDialog) dialogRef.current?.close();
    router.push(hrefFor(next));
  }

  const apiQuery = new URLSearchParams({
    sort,
    page: String(page),
    page_size: "12",
  });
  if (q) apiQuery.set("q", q);
  if (inStock) apiQuery.set("in_stock", "true");
  if (onSale) apiQuery.set("on_sale", "true");
  if (minPrice) apiQuery.set("min_price", minPrice);
  if (maxPrice) apiQuery.set("max_price", maxPrice);
  if (slug) apiQuery.set("category", slug);

  const products = useResource<ProductPage>(
    invalidRange ? null : `/products?${apiQuery.toString()}`,
  );
  const categories = useResource<Category[]>("/categories");
  const category = useResource<Category>(
    slug ? `/categories/${encodeURIComponent(slug)}` : null,
  );

  const sortLabel =
    sort === "price_asc"
      ? t("Сначала дешевле")
      : sort === "price_desc"
        ? t("Сначала дороже")
        : t("По названию");

  const activeFilters = [
    q ? { key: "q", label: `${t("Поиск")}: ${q}` } : null,
    minPrice ? { key: "min_price", label: `${copy.priceFrom}: ${minPrice}` } : null,
    maxPrice ? { key: "max_price", label: `${copy.priceTo}: ${maxPrice}` } : null,
    inStock ? { key: "in_stock", label: t("В наличии") } : null,
    onSale ? { key: "on_sale", label: copy.onSale } : null,
    sort !== "name" ? { key: "sort", label: `${t("Сортировка")}: ${sortLabel}` } : null,
  ].filter((value): value is { key: string; label: string } => Boolean(value));

  const formKey = `${q}:${sort}:${inStock}:${onSale}:${minPrice}:${maxPrice}`;

  function filterFields(idPrefix: string) {
    return (
      <>
        <label className={styles.field} htmlFor={`${idPrefix}-search`}>
          <span>{t("Поиск")}</span>
          <input
            id={`${idPrefix}-search`}
            name="q"
            defaultValue={q}
            maxLength={200}
            placeholder={t("Название или артикул")}
          />
        </label>
        <div className={styles.priceFields}>
          <label className={styles.field} htmlFor={`${idPrefix}-min-price`}>
            <span>{copy.priceFrom}</span>
            <input
              id={`${idPrefix}-min-price`}
              name="min_price"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={minPrice}
              placeholder="0"
            />
          </label>
          <label className={styles.field} htmlFor={`${idPrefix}-max-price`}>
            <span>{copy.priceTo}</span>
            <input
              id={`${idPrefix}-max-price`}
              name="max_price"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              defaultValue={maxPrice}
              placeholder="∞"
            />
          </label>
        </div>
        <label className={styles.field} htmlFor={`${idPrefix}-sort`}>
          <span>{t("Сортировка")}</span>
          <select id={`${idPrefix}-sort`} name="sort" defaultValue={sort}>
            <option value="name">{t("По названию")}</option>
            <option value="price_asc">{t("Сначала дешевле")}</option>
            <option value="price_desc">{t("Сначала дороже")}</option>
          </select>
        </label>
        <div className={styles.checks}>
          <label className={styles.checkField}>
            <input name="in_stock" type="checkbox" value="true" defaultChecked={inStock} />
            <span>{t("В наличии")}</span>
          </label>
          <label className={styles.checkField}>
            <input name="on_sale" type="checkbox" value="true" defaultChecked={onSale} />
            <span>{copy.onSale}</span>
          </label>
        </div>
      </>
    );
  }

  if (category.error?.status === 404) notFound();

  return (
    <div className="polish-page catalog-page">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          { label: t("Каталог"), href: slug ? "/catalog" : undefined },
          ...(slug ? [{ label: t(category.data?.name) || "…" }] : []),
        ]}
      />

      <div className={styles.heading}>
        <div className="page-title">
          <span className="eyebrow">
            <ShoppingBasket size={16} aria-hidden="true" />
            {t("Свежий выбор на каждый день")}
          </span>
          <h1>{t(category.data?.name) || t("Каталог товаров")}</h1>
          <p>
            {q ? t("Поиск: «") + q + "»" : t("Выбирайте любимые продукты и товары для дома")}
          </p>
        </div>
      </div>

      {category.error && <Failure error={category.error} retry={category.retry} />}

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>{t("Категории")}</h2>
          {categories.loading && <Loading label="Загружаем категории…" />}
          {categories.error && <Failure error={categories.error} retry={categories.retry} />}
          <Link className={!slug ? "active" : ""} aria-current={!slug ? "page" : undefined} href="/catalog">
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

        <section className={styles.results} aria-label={t("Товары")}>
          <form
            className={`${styles.filterForm} ${styles.desktopFilters}`}
            key={`desktop:${formKey}`}
            onSubmit={(event) => applyFilters(event)}
          >
            <div className={styles.filterTitle}>
              <SlidersHorizontal size={18} aria-hidden="true" />
              <strong>{copy.filters}</strong>
            </div>
            {filterFields("desktop")}
            <div className={styles.actions}>
              <button className="button" type="submit">
                {t("Применить")}
              </button>
              <Link className={styles.reset} href={path}>
                {copy.reset}
              </Link>
            </div>
          </form>

          <div className={styles.mobileToolbar}>
            <button
              type="button"
              className={styles.mobileTrigger}
              onClick={() => dialogRef.current?.showModal()}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span>{copy.filters}</span>
              {activeFilters.length > 0 && (
                <span className={styles.filterCount} aria-label={`${copy.activeFilters}: ${activeFilters.length}`}>
                  {activeFilters.length}
                </span>
              )}
            </button>
            <span className={styles.mobileResultCount}>
              {products.data ? products.data.total : "…"} {t("товаров")}
            </span>
          </div>

          <dialog
            ref={dialogRef}
            className={styles.mobileDialog}
            onClick={(event) => {
              if (event.target === event.currentTarget) event.currentTarget.close();
            }}
          >
            <div className={styles.mobilePanel}>
              <div className={styles.mobileHeader}>
                <strong>{copy.filters}</strong>
                <button
                  type="button"
                  className={styles.closeButton}
                  aria-label={copy.close}
                  onClick={() => dialogRef.current?.close()}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <form
                className={styles.mobileFilterForm}
                key={`mobile:${formKey}`}
                onSubmit={(event) => applyFilters(event, true)}
              >
                {filterFields("mobile")}
                <div className={styles.mobileActions}>
                  <button className="button" type="submit">
                    {t("Применить")}
                  </button>
                  <Link className={styles.reset} href={path} onClick={() => dialogRef.current?.close()}>
                    {copy.reset}
                  </Link>
                </div>
              </form>
            </div>
          </dialog>

          {activeFilters.length > 0 && (
            <nav className={styles.activeFilters} aria-label={copy.activeFilters}>
              <div className={styles.chipList}>
                {activeFilters.map((filter) => (
                  <Link key={filter.key} className={styles.chip} href={removeFilter(filter.key)}>
                    <span>{filter.label}</span>
                    <X size={14} aria-hidden="true" />
                  </Link>
                ))}
              </div>
              <Link className={styles.clearAll} href={path}>
                {copy.clearAll}
              </Link>
            </nav>
          )}

          {invalidRange && (
            <div className={styles.validationError} role="alert">
              {copy.invalidRange}
            </div>
          )}

          {!invalidRange && products.loading && <Loading kind="grid" />}
          {!invalidRange && products.error && <Failure error={products.error} retry={products.retry} />}

          {!invalidRange && products.data && (
            <>
              <div className="catalog-results-line">
                <p className="result-count">
                  {t("Найдено товаров: ")}
                  <strong>{products.data.total}</strong>
                </p>
                <span>{t(inStock ? "В наличии" : "Все товары")}</span>
              </div>

              {!products.data.items.length ? (
                <div className={styles.emptyRecovery}>
                  <Empty title={t("Ничего не найдено")} text={copy.matching} />
                  {activeFilters.length > 0 && (
                    <Link className="button secondary" href={path}>
                      {copy.clearAll}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="product-grid catalog-grid">
                  {products.data.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              <nav className="pagination" aria-label={t("Страницы каталога")}>
                {page > 1 && <Link href={pageHref(page - 1)}>{t("← Назад")}</Link>}
                <span>
                  {t("Страница ")}
                  {page}
                  {t(" из")} {Math.max(1, Math.ceil(products.data.total / 12))}
                </span>
                {page * 12 < products.data.total && <Link href={pageHref(page + 1)}>{t("Далее →")}</Link>}
              </nav>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
