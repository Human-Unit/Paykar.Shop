"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";

export function Catalog({ slug }: { slug?: string }) {
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
  if (category.error?.status === 404)
    return (
      <Empty
        title="Категория не найдена"
        text="Выберите другой раздел каталога."
      />
    );
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: slug ? "/catalog" : undefined },
          ...(slug ? [{ label: category.data?.name || "…" }] : []),
        ]}
      />
      <div className="page-title">
        <h1>{category.data?.name || "Каталог товаров"}</h1>
        <p>
          {q ? `Поиск: «${q}»` : "Выбирайте любимые продукты и товары для дома"}
        </p>
      </div>
      {category.error && (
        <Failure error={category.error} retry={category.retry} />
      )}
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>Категории</h2>
          {categories.error && (
            <Failure error={categories.error} retry={categories.retry} />
          )}
          <Link className={!slug ? "active" : ""} href="/catalog">
            Все товары
          </Link>
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              className={`${slug === c.slug ? "active" : ""} ${c.parent_id ? "child" : ""}`}
              href={`/catalog/${c.slug}`}
            >
              {c.name}
            </Link>
          ))}
        </aside>
        <section aria-label="Товары">
          <form
            action={path}
            className="catalog-controls"
            key={`${q}:${sort}:${inStock}`}
          >
            <label className="filter-search">
              Поиск
              <input
                name="q"
                defaultValue={q}
                maxLength={200}
                placeholder="Название или артикул"
              />
            </label>
            <label>
              Сортировка
              <select name="sort" defaultValue={sort}>
                <option value="name">По названию</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
              </select>
            </label>
            <label className="stock-filter">
              <input
                name="in_stock"
                type="checkbox"
                value="true"
                defaultChecked={inStock}
              />{" "}
              В наличии
            </label>
            <button className="button" type="submit">
              Применить
            </button>
          </form>
          {products.loading && <Loading kind="grid" />}
          {products.error && (
            <Failure error={products.error} retry={products.retry} />
          )}
          {products.data && (
            <>
              <p className="result-count">
                Найдено товаров: {products.data.total}
              </p>
              {!products.data.items.length ? (
                <Empty
                  title="Ничего не найдено"
                  text="Попробуйте другое название или измените фильтры."
                />
              ) : (
                <div className="product-grid catalog-grid">
                  {products.data.items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
              <nav className="pagination" aria-label="Страницы каталога">
                {page > 1 && <Link href={pageHref(page - 1)}>← Назад</Link>}
                <span>
                  Страница {page} из{" "}
                  {Math.max(1, Math.ceil(products.data.total / 12))}
                </span>
                {page * 12 < products.data.total && (
                  <Link href={pageHref(page + 1)}>Далее →</Link>
                )}
              </nav>
            </>
          )}
        </section>
      </div>
    </>
  );
}
