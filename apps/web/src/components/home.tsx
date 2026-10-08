"use client";
import { usePresentation } from "@/context/presentation";
import { m, useReveal } from "./motion-primitives";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Empty, Failure, Loading } from "./states";
import { HomeHero } from "./home-hero";
import { categoryImages } from "@/lib/category-presentation";
import { articles } from "@/lib/store-content";
import { SectionHeader } from "./page-patterns";
import { ArticleCard } from "./article-card";
import { HomeStoreNetwork } from "./home-store-network";
import { OrderShowcase } from "./order-showcase";
import { ShoppingDiscovery } from "./my-shopping";
export function Home() {
  const { t } = usePresentation();
  const grid = useReveal({ rise: 14 });
  const categories = useResource<Category[]>("/categories");
  const products = useResource<ProductPage>(
    "/products?page_size=48&in_stock=true",
  );
  const sales = useResource<ProductPage>(
    "/products?on_sale=true&in_stock=true&page_size=5",
  );
  const discounts = sales.data?.items ?? [];
  const everyday =
    products.data?.items
      .filter((p) => !discounts.some((d) => d.id === p.id))
      .slice(0, 10) ?? [];
  return (
    <div className="polish-page home-page">
      <HomeHero
        promotions={discounts}
        promotionsLoading={sales.loading}
        promotionsError={Boolean(sales.error)}
        products={products.data?.items ?? []}
      />
      {(sales.loading || sales.error || discounts.length > 0) && (
        <section id="promotions" className="discount-section">
          <SectionHeader
            eyebrow="МЕНЬШЕ ЦЕНА — ТОТ ЖЕ ВЫБОР"
            title="Акции"
            action={{ href: "/promotions", label: "Все акции" }}
          />
          {sales.loading && <Loading kind="grid" />}
          {sales.error && <Failure error={sales.error} retry={sales.retry} />}
          {discounts.length > 0 && (
            <div className="product-grid one-row">
              {discounts.map((p, index) => (
                <ProductCard key={p.id} product={p} revealIndex={index} />
              ))}
            </div>
          )}
          {discounts.length > 0 && (
            <p className="section-note">
              {t("Скидки относительно прежних цен.")}
            </p>
          )}
        </section>
      )}
      <section>
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
            ?.filter((c) => c.parent_id === null)
            .map((c) => (
              <Link
                href={`/catalog/${c.slug}`}
                key={c.id}
                className="category-tile"
              >
                <span className="category-tile-media">
                  <Image
                    src={
                      categoryImages[c.slug]
                        ? `/images/paykar/${categoryImages[c.slug]}.webp`
                        : "/images/products/fallback.svg"
                    }
                    width={240}
                    height={240}
                    unoptimized
                    alt=""
                  />
                </span>
                <span className="category-tile-name">
                  <span>{t(c.name)}</span>
                  <span className="category-tile-arrow">
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </span>
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

      <section>
        <SectionHeader
          eyebrow="Продукты на каждый день"
          title="Повседневные покупки"
          action={{ href: "/catalog", label: "Все товары" }}
        />
        {products.loading && <Loading kind="grid" />}
        {products.error && (
          <Failure error={products.error} retry={products.retry} />
        )}
        <div className="product-grid two-rows">
          {everyday.map((p, index) => (
            <ProductCard key={p.id} product={p} revealIndex={index} />
          ))}
        </div>
        {products.data?.total === 0 && (
          <Empty
            title={t("Товары скоро появятся.")}
            text={t(
              "Загляните в каталог, чтобы выбрать продукты на каждый день.",
            )}
          />
        )}
      </section>
      <ShoppingDiscovery />
      <OrderShowcase />
      <HomeStoreNetwork />
      <section>
        <SectionHeader
          eyebrow="Полезно знать"
          title="Блог"
          text="Практические заметки о покупках, продуктах и доставке."
          action={{ href: "/blog", label: "Все статьи" }}
        />
        <m.div {...grid} className="editorial-grid">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </m.div>
      </section>
    </div>
  );
}
