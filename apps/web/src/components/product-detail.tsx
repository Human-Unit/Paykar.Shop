"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Category, ProductPage, Product, useResource } from "@/lib/api";
import { cents } from "@/lib/format";
import { AddButton, ProductCard, ProductImage } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import {
  CheckCircle2,
  Package,
  Route,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { SectionHeader } from "./page-patterns";
export function ProductDetail({ slug }: { slug: string }) {
  const { t, money } = usePresentation();
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
  if (resource.error?.status === 404) notFound();
  if (resource.error)
    return <Failure error={resource.error} retry={resource.retry} />;
  if (!p) return null;
  return (
    <div className="polish-page product-page">
      <Breadcrumbs
        items={[
          { label: t("Главная"), href: "/" },
          {
            label: t("Каталог"),
            href: "/catalog",
          },
          ...(parent
            ? [{ label: t(parent.name), href: `/catalog/${parent.slug}` }]
            : []),
          ...(category
            ? [{ label: t(category.name), href: `/catalog/${category.slug}` }]
            : []),
          { label: t(p.name) },
        ]}
      />
      <div className="product-detail">
        <div className="detail-image">
          <ProductImage product={p} large />
        </div>
        <div className="detail-info">
          <span className="eyebrow">
            <Package size={16} aria-hidden="true" />
            {category ? t(category.name) : t("Продукты на каждый день")}
          </span>
          <h1>{t(p.name)}</h1>
          <p className="unit">
            {t("Артикул: ")}
            {p.sku.replace(/^DEMO-/, "")} · {t(p.unit)}
          </p>
          <div className="detail-purchase">
            <div className="prices detail-price">
              <strong>{money(cents(p.price))}</strong>
              {p.old_price && <del>{money(cents(p.old_price))}</del>}
              {p.old_price && cents(p.old_price) > cents(p.price) && (
                <span className="detail-discount">
                  −{Math.round((1 - cents(p.price) / cents(p.old_price)) * 100)}
                  %
                </span>
              )}
            </div>
            <p className="stock-state">
              {Number(p.stock_quantity) >= 1 ? (
                <CheckCircle2 size={16} aria-hidden="true" />
              ) : (
                <Package size={16} aria-hidden="true" />
              )}
              {Number(p.stock_quantity) >= 1
                ? t("В наличии: ") +
                  Math.floor(Number(p.stock_quantity)) +
                  " " +
                  t(p.unit)
                : t("Нет в наличии")}
            </p>
            <AddButton product={p} />
          </div>
          <div className="detail-note">
            {t(
              "Одна упаковка — одна единица в корзине. Стоимость доставки покажем до оформления заказа.",
            )}
          </div>
          <div className="detail-service-notes">
            <Link href="/delivery">
              <Route size={22} aria-hidden="true" />
              <span>
                <strong>{t("Доставка")}</strong>
                <small>{t("Маршрут и стоимость — до заказа.")}</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/payment">
              <CreditCard size={22} aria-hidden="true" />
              <span>
                <strong>{t("Способ оплаты")}</strong>
                <small>{t("Наличными при получении")}</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <Link href="/cart" className="text-link detail-cart-link">
            {t("Перейти в корзину →")}
          </Link>
        </div>
      </div>
      <section className="product-description-panel">
        <SectionHeader eyebrow="Детали покупки" title="О товаре" />
        <p className="description">
          {t(
            /демонстрацион|учебн/i.test(p.description)
              ? "Указанная упаковка — одна единица в корзине."
              : p.description,
          )}
        </p>
        <dl className="product-facts">
          <div>
            <dt>{t("Артикул")}</dt>
            <dd>{p.sku.replace(/^DEMO-/, "")}</dd>
          </div>
          <div>
            <dt>{t("Единица продажи")}</dt>
            <dd>{t(p.unit)}</dd>
          </div>
          {category && (
            <div>
              <dt>{t("Категория")}</dt>
              <dd>
                <Link href={`/catalog/${category.slug}`}>
                  {t(category.name)}
                </Link>
              </dd>
            </div>
          )}
        </dl>
      </section>
      {category && (related.loading || alternatives.length > 0) && (
        <section className="related-products">
          <SectionHeader
            eyebrow="Дополните корзину"
            title="В этом разделе"
            action={{ href: `/catalog/${category.slug}`, label: category.name }}
          />
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
      {category && related.data && alternatives.length === 0 && (
        <Empty
          compact
          icon={Package}
          title={t("В этом разделе")}
          text={t("Другие товары в этом разделе пока не представлены.")}
        />
      )}
      {related.error && <Failure error={related.error} retry={related.retry} />}
    </div>
  );
}
