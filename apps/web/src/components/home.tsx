"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Plus } from "lucide-react";
import { cents } from "@/lib/format";
import {
  Category,
  Product,
  ProductConnectionList,
  ProductPage,
  useResource,
} from "@/lib/api";
import { categoryImages } from "@/lib/category-presentation";
import { articles } from "@/lib/store-content";
import { usePresentation } from "@/context/presentation";
import { ArticleCard } from "./article-card";
import { HomeStoreNetwork } from "./home-store-network";
import { AddButton, ProductCard, ProductImage } from "./product-card";
import { SectionHeader } from "./page-patterns";
import { Empty, Failure, Loading } from "./states";
import { m, useReveal } from "./motion-primitives";

const featuredSlugs = ["oranges", "wheat-bread", "yogurt", "black-tea"];

function EditorialProduct({
  product,
  index = 0,
  compact = false,
}: {
  product: Product;
  index?: number;
  compact?: boolean;
}) {
  const { t, money } = usePresentation();
  const reveal = useReveal({
    rise: 12,
    delay: Math.min(index, 3) * 0.045,
    hover: true,
  });

  return (
    <m.article
      {...reveal}
      className={`editorial-product${compact ? " editorial-product-compact" : ""}`}
    >
      <Link
        className="editorial-product-image"
        href={`/product/${product.slug}`}
        aria-label={t(product.name)}
      >
        <ProductImage product={product} large />
        <span className="editorial-product-open" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="editorial-product-copy">
        <div className="editorial-product-meta">
          <span className="unit">{t(product.unit)}</span>
          <Link className="product-name" href={`/product/${product.slug}`}>
            {t(product.name)}
          </Link>
          <strong className="editorial-price">
            {money(cents(product.price))}
          </strong>
        </div>
        <AddButton product={product} />
      </div>
    </m.article>
  );
}

export function Home() {
  const { t } = usePresentation();
  const categories = useResource<Category[]>("/categories");
  const products = useResource<ProductPage>(
    "/products?page_size=48&in_stock=true",
  );
  const teaConnections = useResource<ProductConnectionList>(
    "/products/black-tea/connections",
  );
  const discounts =
    products.data?.items
      .filter(
        (product) =>
          product.old_price && cents(product.old_price) > cents(product.price),
      )
      .slice(0, 4) ?? [];
  const featured =
    products.data?.items.filter(
      (product) => featuredSlugs.includes(product.slug) && product.is_active,
    ) ?? [];
  const tea = products.data?.items.find(
    (product) => product.slug === "black-tea",
  );
  const teaPairings = teaConnections.data?.items.filter(
    (product) => product.is_active && Number(product.stock_quantity) >= 1,
  );

  return (
    <div className="polish-page home-page shopping-home phase4-home">
      <section className="editorial-hero" aria-labelledby="shop-intro-title">
        <div className="editorial-hero-copy">
          <span className="eyebrow">
            <MapPin size={15} aria-hidden="true" />
            {t("Душанбе")}
          </span>
          <h1 id="shop-intro-title">{t("Покупки на каждый день")}</h1>
          <p>
            {t(
              "Выбирайте продукты, проверяйте цены и собирайте корзину онлайн.",
            )}
          </p>
          <Link className="button editorial-hero-action" href="/catalog">
            {t("Открыть каталог")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="editorial-hero-art">
          <Image
            src="/images/paykar/produce.webp"
            width={900}
            height={900}
            priority
            unoptimized
            alt=""
          />
        </div>
      </section>

      <section className="home-categories phase4-categories">
        <SectionHeader
          eyebrow="Свежий выбор на каждый день"
          title="Категории товаров"
          action={{ href: "/catalog", label: "Весь каталог" }}
        />
        {categories.loading && <Loading />}
        {categories.error && (
          <Failure error={categories.error} retry={categories.retry} />
        )}
        <div className="category-grid">
          {categories.data
            ?.filter((category) => category.parent_id === null)
            .map((category) => (
              <Link
                href={`/catalog/${category.slug}`}
                key={category.id}
                className="category-tile"
              >
                <Image
                  src={
                    categoryImages[category.slug]
                      ? `/images/paykar/${categoryImages[category.slug]}.webp`
                      : "/images/products/fallback.svg"
                  }
                  width={240}
                  height={240}
                  unoptimized
                  alt=""
                />
                <span>{t(category.name)}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            ))}
        </div>
        {categories.data?.length === 0 && (
          <Empty
            title={t("Категории скоро появятся")}
            text={t(
              "Загляните в каталог, чтобы выбрать продукты на каждый день.",
            )}
          />
        )}
      </section>

      <section className="home-everyday phase4-featured">
        <SectionHeader
          eyebrow="Продукты на каждый день"
          title="Повседневные покупки"
          action={{ href: "/catalog", label: "Все товары" }}
        />
        {products.loading && <Loading kind="grid" />}
        {products.error && (
          <Failure error={products.error} retry={products.retry} />
        )}
        {featured.length > 0 && (
          <div className="editorial-product-grid">
            {featured.map((product, index) => (
              <EditorialProduct
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        )}
        {products.data?.total === 0 && (
          <Empty
            title={t("Товары скоро появятся.")}
            text={t(
              "Загляните в каталог, чтобы выбрать продукты на каждый день.",
            )}
          />
        )}
      </section>

      {tea && teaPairings && teaPairings.length > 0 && (
        <section className="home-pairing editorial-pairing">
          <div className="editorial-pairing-heading">
            <span className="eyebrow">{t("Свежий выбор на каждый день")}</span>
            <h2>{t("Хорошо подходит к этому")}</h2>
            <p>{t(tea.name)}</p>
            <Link href={`/product/${tea.slug}`} className="text-link">
              {t("Подробнее о товаре")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="editorial-connection-sequence">
            <EditorialProduct product={tea} compact />
            {teaPairings.slice(0, 3).map((product, index) => (
              <div className="editorial-connection-step" key={product.id}>
                <Plus aria-hidden="true" />
                <EditorialProduct product={product} index={index + 1} compact />
              </div>
            ))}
          </div>
        </section>
      )}
      {teaConnections.error && (
        <Failure error={teaConnections.error} retry={teaConnections.retry} />
      )}

      {discounts.length > 0 && (
        <section className="discount-section phase4-discounts" id="promotions">
          <SectionHeader
            eyebrow="Сниженные цены"
            title="Акции"
            action={{ href: "/promotions", label: "Все акции" }}
          />
          <div className="product-grid">
            {discounts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <p className="section-note">
            {t("Скидки относительно прежних цен.")}
          </p>
        </section>
      )}

      <section className="editorial-service">
        <div>
          <span className="eyebrow">{t("Доставка с Пайкар")}</span>
          <h2>
            {t(
              "Продукты на каждый день — с понятной доставкой до вашей двери.",
            )}
          </h2>
        </div>
        <Link className="text-link" href="/delivery">
          {t("Условия доставки")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </section>

      <HomeStoreNetwork />

      <section className="home-editorial">
        <SectionHeader
          eyebrow="Полезно знать"
          title="Блог"
          action={{ href: "/blog", label: "Все статьи" }}
        />
        <div className="editorial-grid">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
