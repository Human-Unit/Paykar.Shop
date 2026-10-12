"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type DeliveryConfig, type Product } from "@/lib/api";
import { cents } from "@/lib/format";
import type { CuratedTemplate } from "@/lib/shopping";
import { useShoppingStorage } from "@/lib/shopping-storage";
import { useStoreDirectory } from "@/lib/store-directory";
import { AddButton, ProductImage, discountPercent } from "./product-card";
import { m, usePointerLight, useReveal } from "./motion-primitives";
import { ShoppingCarousel } from "./shopping-carousel";
import { HomeTemplatePreview } from "./home-template-preview";
import styles from "./home-feature-cards.module.css";

const HeroVisualScene = dynamic(
  () => import("./hero-visual-scene").then((module) => module.HeroVisualScene),
  { ssr: false },
);

export function HomeHero({
  promotions,
  promotionsLoading,
  promotionsError,
  products,
}: {
  promotions: Product[];
  promotionsLoading: boolean;
  promotionsError: boolean;
  products: Product[];
}) {
  const { t, money } = usePresentation();
  const storeLocations = useStoreDirectory();
  const offerPointer = usePointerLight();
  const shoppingPointer = usePointerLight();
  const config = useResource<DeliveryConfig>("/delivery/config");
  const curated = useResource<CuratedTemplate[]>("/shopping/templates");
  const { templates } = useShoppingStorage();
  const curatedTemplates = (curated.data ?? []).filter(
    (template) => template.items.length > 0,
  );
  const featuredDeal = promotions[0];
  const featuredDiscount = featuredDeal ? discountPercent(featuredDeal) : 0;
  const promotionHref =
    promotions.length > 0 || promotionsLoading || promotionsError
      ? "/promotions"
      : "/catalog";
  const eyebrow = useReveal({ rise: 12, inView: false });
  const headline = useReveal({ rise: 24, delay: 0.07, inView: false });
  const lead = useReveal({ rise: 16, delay: 0.15, inView: false });
  const actions = useReveal({ rise: 14, delay: 0.23, inView: false });
  const facts = useReveal({ rise: 10, delay: 0.32, inView: false });
  const firstChip = useReveal({
    rise: 14,
    scale: 0.9,
    delay: 0.5,
    inView: false,
  });
  const secondChip = useReveal({
    rise: 14,
    scale: 0.9,
    delay: 0.64,
    inView: false,
  });
  const routeCard = useReveal({
    delay: 0.16,
    inView: false,
    hover: true,
    lift: 3,
  });
  const shopCard = useReveal({
    delay: 0.24,
    inView: false,
    hover: true,
    lift: 3,
  });
  return (
    <section className={`home-bento ${styles.scene}`}>
      <div className="hero-card premium-hero">
        <Image
          src="/images/paykar/hero.webp"
          width={1536}
          height={1024}
          alt=""
          priority
          unoptimized
          className="hero-image"
        />
        <HeroVisualScene />
        <div className="hero-body">
          <m.span {...eyebrow} className="hero-eyebrow">
            <i className="pulse-dot" aria-hidden="true" />
            {t("ВАШ ЕЖЕДНЕВНЫЙ ВЫБОР")}
          </m.span>
          <m.h1 {...headline}>
            {/* Keep the dash with the word before it when the line wraps. */}
            {t("Всё нужное —").replace(/ —$/, " —")}
            <br />
            <em>{t("с доставкой")}</em>
          </m.h1>
          <m.p {...lead}>
            {t("Продукты на каждый день.")}
            <br />
            {t("Маршрут и стоимость — до заказа.")}
          </m.p>
          <m.div {...actions} className="hero-actions">
            <Link href="/catalog" className="button large">
              {t("Перейти в каталог")}
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
            <Link href="/delivery" className="text-link hero-delivery-link">
              {t("Как работает доставка")}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </m.div>
          <m.ul {...facts} className="hero-facts">
            <li>
              <Check size={14} aria-hidden="true" />
              {t("Покупки без регистрации")}
            </li>
            <li>
              <Check size={14} aria-hidden="true" />
              {t("Оплата при получении")}
            </li>
          </m.ul>
        </div>
        <div className="hero-chips" aria-hidden="true">
          {config.data && (
            <m.div
              {...firstChip}
              className={`hero-chip hero-chip-fee ${styles.chip} ${styles.delivery}`}
            >
              <span className={styles.chipArt}>
                <Image
                  src="/images/paykar/features/delivery-pin.webp"
                  width={320}
                  height={320}
                  alt=""
                  unoptimized
                />
              </span>
              <span>
                <small>{t("Доставка")}</small>
                <strong>{money(cents(config.data.delivery_price))}</strong>
              </span>
            </m.div>
          )}
          <m.div
            {...secondChip}
            className={`hero-chip hero-chip-stores ${styles.chip} ${styles.stores}`}
          >
            <span className={styles.chipArt}>
              <Image
                src="/images/paykar/features/storefront.webp"
                width={320}
                height={320}
                alt=""
                unoptimized
              />
            </span>
            <span>
              <small>{t("Магазины")}</small>
              <strong>{storeLocations.length}</strong>
            </span>
          </m.div>
        </div>
      </div>
      <m.div
        {...routeCard}
        {...offerPointer}
        className={`bento-card featured-deal ${styles.feature} ${styles.offer}`}
        aria-labelledby="home-featured-deal-title"
        aria-busy={promotionsLoading}
      >
        <div className="featured-deal-heading">
          <h2 id="home-featured-deal-title" className={styles.heading}>
            {t("Выгода дня")}
          </h2>
        </div>
        {featuredDeal ? (
          <>
            <Link
              href={`/product/${featuredDeal.slug}`}
              className={`featured-deal-product ${styles.offerLink}`}
            >
              <span className={`featured-deal-image ${styles.offerArt}`}>
                <ProductImage product={featuredDeal} large />
                {featuredDiscount > 0 && (
                  <span className="featured-deal-discount">
                    −{featuredDiscount}%
                  </span>
                )}
              </span>
              <span className={`featured-deal-copy ${styles.offerCopy}`}>
                <strong className="featured-deal-name">
                  {t(featuredDeal.name)}
                </strong>
                <span className="featured-deal-price">
                  <strong>{money(cents(featuredDeal.price))}</strong>
                  {featuredDeal.old_price && (
                    <del>{money(cents(featuredDeal.old_price))}</del>
                  )}
                </span>
              </span>
            </Link>
            <AddButton product={featuredDeal} />
          </>
        ) : (
          <div className="featured-deal-state" aria-live="polite">
            {promotionsLoading ? (
              <>
                <div className="featured-deal-placeholder" aria-hidden="true" />
                <p>{t("Загружаем актуальные акции…")}</p>
              </>
            ) : promotionsError ? (
              <p>{t("Акции временно недоступны. Откройте страницу акций.")}</p>
            ) : (
              <p>{t("Сейчас нет акционных товаров. Загляните в каталог.")}</p>
            )}
          </div>
        )}
        <Link className="promo-action" href={promotionHref}>
          {promotions.length > 0 || promotionsLoading || promotionsError
            ? t("Все акции")
            : t("Перейти в каталог")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </m.div>
      <m.div
        {...shopCard}
        {...shoppingPointer}
        className={`bento-card bento-shop ${styles.feature} ${styles.shopping}`}
        aria-labelledby="home-shopping-title"
      >
        <div className={`bento-top ${styles.shoppingHeading}`}>
          <h2 id="home-shopping-title" className={styles.heading}>
            {t("Мои покупки")}
          </h2>
          <span className={styles.basketArt} aria-hidden="true">
            <Image
              src="/images/paykar/features/shopping-basket.webp"
              width={480}
              height={480}
              alt=""
              unoptimized
            />
          </span>
        </div>
        <div className="bento-template-content">
          {templates.length > 0 || curatedTemplates.length > 0 ? (
            <ShoppingCarousel label={t("Мои покупки")} variant="home-templates">
              {templates.length > 0
                ? templates.map((template) => (
                    <HomeTemplatePreview
                      key={template.id}
                      personal={template}
                      products={products}
                    />
                  ))
                : curatedTemplates.map((template) => (
                    <HomeTemplatePreview
                      key={template.id}
                      curated={template}
                      products={products}
                    />
                  ))}
            </ShoppingCarousel>
          ) : (
            <p className="bento-template-state" aria-live="polite">
              {curated.error
                ? t(
                    "Не удалось загрузить готовые наборы. Откройте Мои покупки.",
                  )
                : curated.loading
                  ? t("Загружаем подборки…")
                  : t("Сохранённые наборы появятся здесь после создания.")}
            </p>
          )}
        </div>
        <Link className="promo-action" href="/my-shopping">
          {t("Открыть")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </m.div>
    </section>
  );
}
