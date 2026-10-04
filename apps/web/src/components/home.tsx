"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Leaf,
  ShoppingBasket,
  PackageCheck,
  Route,
  ShoppingBag,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { cents } from "@/lib/format";
import { Category, ProductPage, useResource } from "@/lib/api";
import { ProductCard } from "./product-card";
import { Empty, Failure, Loading } from "./states";
import { ShoppingBanner } from "./shopping-banner";
import { categoryImages } from "@/lib/category-presentation";
import { articles, storePages } from "@/lib/store-content";
import { SectionHeader, StepFlow, CTASection } from "./page-patterns";
import { ArticleCard } from "./article-card";
import { HomeStoreNetwork } from "./home-store-network";
export function Home() {
  const { t } = usePresentation();
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
    <div className="polish-page home-page">
      <div className="promo-grid">
        <ShoppingBanner hero />
        <div className="promo-side">
          <Link href="/delivery" className="promo-card promo-route">
            <Route size={30} aria-hidden="true" />
            <span className="eyebrow">{t("ДОСТАВКА")}</span>
            <h2>
              {t("Весь маршрут.")}
              <br />
              {t("До заказа.")}
            </h2>
            <p>{t("Расстояние, время и стоимость на одной карте.")}</p>
            <span className="promo-action">
              {t("Как работает доставка")}{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </span>
          </Link>
          <Link href="/catalog" className="promo-card promo-shopping">
            <ShoppingBag size={30} aria-hidden="true" />
            <span className="eyebrow">{t("ПРОСТО ПОКУПКИ")}</span>
            <h2>
              {t("Без регистрации.")}
              <br />
              {t("В вашем темпе.")}
            </h2>
            <span className="promo-action">
              {t("Собрать корзину ")}
              <ArrowUpRight size={18} />
            </span>
          </Link>
        </div>
      </div>
      <div className="benefits">
        <span>
          <Leaf size={20} />
          {t(" Продукты на каждый день")}
        </span>
        <span>
          <ShoppingBasket size={20} />
          {t(" Покупки без регистрации")}
        </span>
        <span>
          <PackageCheck size={20} />
          {t(" Маршрут и цена до заказа")}
        </span>
      </div>
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
                <Image
                  src={
                    categoryImages[c.slug]
                      ? `/images/paykar/${categoryImages[c.slug]}.webp`
                      : "/images/products/fallback.svg"
                  }
                  width={180}
                  height={180}
                  unoptimized
                  alt=""
                />
                <span>{t(c.name)}</span>
                <ArrowUpRight size={16} />
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
      {discounts.length > 0 && (
        <section id="promotions" className="discount-section">
          <SectionHeader
            eyebrow="МЕНЬШЕ ЦЕНА — ТОТ ЖЕ ВЫБОР"
            title="Акции"
            action={{ href: "/promotions", label: "Все акции" }}
          />
          <div className="product-grid">
            {discounts.map((p) => (
              <ProductCard key={p.id} product={p} />
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
        <div className="product-grid">
          {everyday.map((p) => (
            <ProductCard key={p.id} product={p} />
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
        <div className="editorial-grid">
          {articles.slice(0, 3).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}