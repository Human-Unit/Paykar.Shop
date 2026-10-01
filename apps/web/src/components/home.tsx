"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Leaf, ShoppingBasket, PackageCheck } from "lucide-react";
import { cents } from "@/lib/format";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Failure, Loading } from "./states";

export const categoryImages: Record<string, string> = {
  produce: "apple",
  fruit: "apple",
  dairy: "milk",
  bakery: "bread",
  drinks: "bottle",
  sweets: "chocolate",
  household: "cleaner",
};
export function Home() {
  const categories = useResource<Category[]>("/categories");
  const products = useResource<ProductPage>(
    "/products?page_size=48&in_stock=true",
  );
  const discounts =
    products.data?.items
      .filter((p) => p.old_price && cents(p.old_price) > cents(p.price))
      .slice(0, 4) ?? [];
  const everyday =
    products.data?.items
      .filter((p) => !discounts.some((d) => d.id === p.id))
      .slice(0, 8) ?? [];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">ВАШ ЕЖЕДНЕВНЫЙ ВЫБОР</span>
          <h1>
            Всё нужное.
            <br />В одной корзине.
          </h1>
          <p>
            От свежих фруктов до любимого хлеба —
            <br className="hidden sm:block" /> собирайте покупки в своём темпе.
          </p>
          <Link href="/catalog" className="button">
            За покупками <ArrowUpRight size={20} />
          </Link>
          <small>Учебный каталог · условные изображения</small>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-circle" />
          <Image
            src="/images/products/apple.svg"
            width={260}
            height={260}
            alt=""
            className="hero-apple"
          />
          <Image
            src="/images/products/milk.svg"
            width={260}
            height={260}
            alt=""
            className="hero-milk"
          />
          <Image
            src="/images/products/bread.svg"
            width={260}
            height={260}
            alt=""
            className="hero-bread"
          />
        </div>
      </section>
      <div className="benefits">
        <span>
          <Leaf size={20} /> Продукты на каждый день
        </span>
        <span>
          <ShoppingBasket size={20} /> Покупки без регистрации
        </span>
        <span>
          <PackageCheck size={20} /> Маршрут и цена до заказа
        </span>
      </div>
      <section>
        <div className="section-heading">
          <h2>Что будем покупать?</h2>
          <Link href="/catalog">
            Весь каталог <ArrowUpRight size={17} />
          </Link>
        </div>
        {categories.loading && <Loading />}
        {categories.error && (
          <Failure error={categories.error} retry={categories.retry} />
        )}
        <div className="category-grid">
          {categories.data
            ?.filter((c) => c.parent_id === null)
            .map((c) => (
              <Link
                href={`/catalog/${c.slug}`}
                key={c.id}
                className="category-tile"
              >
                <Image
                  src={`/images/products/${categoryImages[c.slug] || "fallback"}.svg`}
                  width={100}
                  height={100}
                  alt=""
                />
                <span>{c.name}</span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
        </div>
      </section>
      {discounts.length > 0 && (
        <section className="discount-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">МЕНЬШЕ ЦЕНА — ТОТ ЖЕ ВЫБОР</span>
              <h2>Сейчас выгоднее</h2>
            </div>
            <Link href="/catalog?sort=price_asc">В каталог →</Link>
          </div>
          <div className="product-grid">
            {discounts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <p className="section-note">
            Сравнение с прежними ценами из демонстрационного каталога.
          </p>
        </section>
      )}
      <section>
        <div className="section-heading">
          <h2>Для вашей корзины</h2>
          <Link href="/catalog">
            Все товары <ArrowUpRight size={17} />
          </Link>
        </div>
        {products.loading && <Loading kind="grid" />}
        {products.error && (
          <Failure error={products.error} retry={products.retry} />
        )}
        <div className="product-grid">
          {everyday.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {products.data?.total === 0 && (
          <p className="message">Товары скоро появятся.</p>
        )}
      </section>
    </>
  );
}
