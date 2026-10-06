"use client";
import { usePresentation } from "@/context/presentation";
import { m, useReveal } from "./motion-primitives";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ShoppingBasket,
  Route,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { cents } from "@/lib/format";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Empty, Failure, Loading } from "./states";
import { HomeHero } from "./home-hero";
import { categoryImages } from "@/lib/category-presentation";
import { articles, storePages } from "@/lib/store-content";
import { SectionHeader, StepFlow, CTASection } from "./page-patterns";
import { ArticleCard } from "./article-card";
import { HomeStoreNetwork } from "./home-store-network";
export function Home() {
  const { t } = usePresentation();
  const grid = useReveal({ rise: 14 });
  const categories = useResource<Category[]>("/categories");
  const products = useResource<ProductPage>(
    "/products?page_size=48&in_stock=true",
  );
  // The grids hide what does not fill a row, so fetch one row's worth extra.
  const discounts =
    products.data?.items
      .filter((p) => p.old_price && cents(p.old_price) > cents(p.price))
      .slice(0, 5) ?? [];
  const everyday =
    products.data?.items
      .filter((p) => !discounts.some((d) => d.id === p.id))
      .slice(0, 10) ?? [];
  return (
    <div className="polish-page home-page">
      <HomeHero />
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
        <m.div {...grid} className="category-grid">
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
        </m.div>
        {categories.data?.length === 0 && (
          <Empty
            title={t("Категории скоро появятся")}
            text={t(
              "Загляните в каталог, чтобы выбрать продукты на каждый день.",
            )}
          />
        )}
      </section>
      {discounts.length > 0 && (
        <section id="promotions" className="discount-section">
          <SectionHeader
            eyebrow="МЕНЬШЕ ЦЕНА — ТОТ ЖЕ ВЫБОР"
            title="Акции"
            action={{ href: "/promotions", label: "Все акции" }}
          />
          <div className="product-grid one-row">
            {discounts.map((p, index) => (
              <ProductCard key={p.id} product={p} revealIndex={index} />
            ))}
          </div>
          <p className="section-note">
            {t("Скидки относительно прежних цен.")}
          </p>
        </section>
      )}
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
      <section className="home-shopping-flow">
        <SectionHeader
          eyebrow="ПРОСТО ПОКУПКИ"
          title="Покупки в вашем темпе"
          text="Без регистрации. Всё заранее."
          action={{ href: "/how-to-buy", label: "Как купить" }}
        />
        <StepFlow
          steps={[
            { ...storePages[0].sections[0], icon: ShoppingBasket },
            { ...storePages[0].sections[3], icon: MapPin },
            { ...storePages[0].sections[5], icon: CheckCircle2 },
          ]}
        />
      </section>
      <CTASection
        eyebrow="Сначала маршрут. Потом заказ."
        title="Доставка с Пайкар"
        text="Выберите адрес и узнайте маршрут, время в пути и стоимость до подтверждения заказа."
        href="/delivery"
        label="Как работает доставка"
        icon={Route}
      />
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
