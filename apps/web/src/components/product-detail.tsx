"use client";

import Link from "next/link";
import { Category, ProductPage, Product, useResource } from "@/lib/api";
import { cents, money } from "@/lib/format";
import { AddButton, ProductCard, ProductImage } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";

export function ProductDetail({ slug }: { slug: string }) {
  const resource = useResource<Product>(
    `/products/${encodeURIComponent(slug)}`,
  );
  const categories = useResource<Category[]>("/categories");
  const p = resource.data;
  const category = categories.data?.find((c) => c.id === p?.category_id);
  const parent = categories.data?.find((c) => c.id === category?.parent_id);
  const related = useResource<ProductPage>(
    category
      ? `/products?category=${encodeURIComponent(category.slug)}&in_stock=true&page_size=6`
      : null,
  );
  const alternatives =
    related.data?.items.filter((item) => item.id !== p?.id).slice(0, 4) ?? [];
  if (resource.loading) return <Loading kind="product" />;
  if (resource.error?.status === 404)
    return (
      <Empty
        title="Товар не найден"
        text="Возможно, товар больше не доступен. Посмотрите другие товары."
      />
    );
  if (resource.error)
    return <Failure error={resource.error} retry={resource.retry} />;
  if (!p) return null;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          ...(parent
            ? [{ label: parent.name, href: `/catalog/${parent.slug}` }]
            : []),
          ...(category
            ? [{ label: category.name, href: `/catalog/${category.slug}` }]
            : []),
          { label: p.name },
        ]}
      />
      <div className="product-detail">
        <div className="detail-image">
          <ProductImage product={p} large />
        </div>
        <div className="detail-info">
          <span className="eyebrow">ДЕМОНСТРАЦИОННЫЙ ТОВАР</span>
          <h1>{p.name}</h1>
          <p className="unit">
            Артикул: {p.sku} · {p.unit}
          </p>
          <div className="prices detail-price">
            <strong>{money(cents(p.price))}</strong>
            {p.old_price && <del>{money(cents(p.old_price))}</del>}
          </div>
          <p className="stock-state">
            {Number(p.stock_quantity) >= 1
              ? `В наличии: ${Math.floor(Number(p.stock_quantity))} ${p.unit}`
              : "Нет в наличии"}
          </p>
          <AddButton product={p} />
          <div className="detail-note">
            Одна упаковка — одна единица в корзине. Стоимость доставки покажем
            до оформления заказа.
          </div>
          <h2 className="mt-8 font-semibold">О товаре</h2>
          <p className="description">{p.description}</p>
          <Link href="/cart" className="text-link">
            Перейти в корзину →
          </Link>
        </div>
      </div>
      {category && (related.loading || alternatives.length > 0) && (
        <section className="related-products">
          <div className="section-heading">
            <h2>В этом разделе</h2>
            <Link href={`/catalog/${category.slug}`}>{category.name} →</Link>
          </div>
          {related.loading ? (
            <Loading kind="grid" />
          ) : (
            <div className="product-grid">
              {alternatives.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}
      {related.error && <Failure error={related.error} retry={related.retry} />}
    </>
  );
}
