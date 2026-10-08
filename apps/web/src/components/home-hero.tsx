"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Percent,
  Store,
  Truck,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type DeliveryConfig, type Product } from "@/lib/api";
import { cents } from "@/lib/format";
import type { CuratedTemplate } from "@/lib/shopping";
import { useShoppingStorage } from "@/lib/shopping-storage";
import { storeLocations } from "@/lib/store-locations";
import { ProductImage, discountPercent } from "./product-card";
import {
  m,
  MotionImage,
  usePointerLight,
  useReveal,
} from "./motion-primitives";

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
  const light = usePointerLight();
  const config = useResource<DeliveryConfig>("/delivery/config");
  const curated = useResource<CuratedTemplate[]>("/shopping/templates");
  const { templates } = useShoppingStorage();
  const personalTemplates = templates.map((template) => ({
    id: template.id,
    name: template.name,
    itemCount: template.items.length,
    href: `/my-shopping/templates/${template.id}`,
    product: template.items
      .map((item) => products.find((product) => product.id === item.product_id))
      .find((product): product is Product => Boolean(product)),
    personal: true,
  }));
  const curatedTemplates = (curated.data ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    itemCount: template.items.length,
    href: `/my-shopping/templates/curated-${template.id}`,
    product: template.items.find((item) => item.product)?.product ?? undefined,
    personal: false,
  }));
  const templateCards =
    personalTemplates.length > 0 ? personalTemplates : curatedTemplates;
  const promotionHref =
    promotions.length > 0 || promotionsLoading || promotionsError
      ? "/promotions"
      : "/catalog";
  const eyebrow = useReveal({ rise: 12, inView: false });
  const headline = useReveal({ rise: 24, delay: 0.07, inView: false });
  const lead = useReveal({ rise: 16, delay: 0.15, inView: false });
  const actions = useReveal({ rise: 14, delay: 0.23, inView: false });
  const facts = useReveal({ rise: 10, delay: 0.32, inView: false });
  const photo = useReveal({
    rise: 0,
    scale: 1.05,
    duration: 1,
    inView: false,
  });
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
    <section className="home-bento">
      <div className="hero-card pointer-surface" {...light}>
        <span className="surface-light" aria-hidden="true" />
        <MotionImage
          {...photo}
          src="/images/paykar/hero.webp"
          width={1536}
          height={1024}
          alt=""
          priority
          unoptimized
          className="hero-image"
        />
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
            <m.div {...firstChip} className="hero-chip hero-chip-fee">
              <span className="hero-chip-icon">
                <Truck size={20} />
              </span>
              <span>
                <small>{t("Доставка")}</small>
                <strong>{money(cents(config.data.delivery_price))}</strong>
              </span>
            </m.div>
          )}
          <m.div {...secondChip} className="hero-chip hero-chip-stores">
            <span className="hero-chip-icon">
              <Store size={20} />
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
        className="bento-card bento-route"
        aria-labelledby="home-promotions-title"
      >
        <span className="bento-promo-ribbon" aria-hidden="true">
          {t("АКЦИЯ")}
        </span>
        <div className="bento-top">
          <h2 id="home-promotions-title" className="sr-only">
            {t("Акции")}
          </h2>
          <Percent size={24} aria-hidden="true" />
        </div>
        {promotions.length > 0 ? (
          <ul className="bento-promo-preview" aria-label={t("Акции")}>
            {promotions.slice(0, 5).map((product) => (
              <li key={product.id}>
                <Link
                  href={`/product/${product.slug}`}
                  className="bento-promo-item"
                  aria-label={`${t(product.name)}. ${money(cents(product.price))}`}
                >
                  <span className="bento-promo-image">
                    <ProductImage product={product} />
                    {discountPercent(product) > 0 && (
                      <span className="bento-promo-discount">
                        −{discountPercent(product)}%
                      </span>
                    )}
                  </span>
                  <strong className="bento-promo-name">
                    {t(product.name)}
                  </strong>
                  <span className="bento-promo-price">
                    <strong>{money(cents(product.price))}</strong>
                    {product.old_price && (
                      <del>{money(cents(product.old_price))}</del>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bento-promo-empty" aria-live="polite">
            {promotionsLoading ? (
              <>
                <div className="bento-promo-preview" aria-hidden="true">
                  {[0, 1, 2].map((item) => (
                    <span className="bento-promo-placeholder" key={item}>
                      <span />
                      <span />
                    </span>
                  ))}
                </div>
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
        className="bento-card bento-shop"
        aria-labelledby="home-shopping-title"
      >
        <div className="bento-top">
          <h2 id="home-shopping-title">{t("Мои покупки")}</h2>
        </div>
        <div className="bento-template-content">
          {templateCards.length > 0 ? (
            <ul
              className="bento-template-preview"
              aria-label={t("Мои покупки")}
            >
              {templateCards.map((template) => (
                <li
                  key={`${template.personal ? "personal" : "curated"}-${template.id}`}
                >
                  <Link
                    href={template.href}
                    className="bento-template-card"
                    aria-label={`${template.personal ? template.name : t(template.name)}. ${template.itemCount} ${t("товаров в наборе")}`}
                  >
                    <span className="bento-template-photo">
                      {template.product ? (
                        <ProductImage product={template.product} />
                      ) : (
                        <Image
                          src="/images/products/fallback.svg"
                          alt=""
                          width={108}
                          height={108}
                          unoptimized
                          className="product-image"
                        />
                      )}
                    </span>
                    <span className="bento-template-copy">
                      <strong>
                        {template.personal ? template.name : t(template.name)}
                      </strong>
                      <small>
                        {template.itemCount} {t("товаров в наборе")}
                      </small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
