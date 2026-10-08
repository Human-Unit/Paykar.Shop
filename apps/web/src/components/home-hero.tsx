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
import { useResource, type DeliveryConfig } from "@/lib/api";
import { cents } from "@/lib/format";
import { storeLocations } from "@/lib/store-locations";
import {
  m,
  MotionImage,
  MotionLink,
  usePointerLight,
  useReveal,
} from "./motion-primitives";

export function HomeHero() {
  const { t, money } = usePresentation();
  const light = usePointerLight();
  const config = useResource<DeliveryConfig>("/delivery/config");
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
      <MotionLink
        {...routeCard}
        href="/promotions"
        className="bento-card bento-route"
      >
        <div className="bento-top">
          <h2>{t("Акции")}</h2>
          <Percent size={24} aria-hidden="true" />
        </div>
        <p>{t("Выгодные предложения на каждый день.")}</p>
        <span className="promo-action">
          {t("Все акции")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </span>
      </MotionLink>
      <MotionLink
        {...shopCard}
        href="/my-shopping"
        className="bento-card bento-shop"
      >
        <div className="bento-top">
          <h2>{t("Мои покупки")}</h2>
          <span className="bento-stack" aria-hidden="true">
            {["produce", "bakery", "dairy"].map((image) => (
              <span key={image}>
                <Image
                  src={`/images/paykar/${image}.webp`}
                  width={96}
                  height={96}
                  alt=""
                  unoptimized
                />
              </span>
            ))}
          </span>
        </div>
        <p>{t("Повторить заказ или открыть сохранённый набор.")}</p>
        <span className="promo-action">
          {t("Открыть")}
          <ArrowUpRight size={18} aria-hidden="true" />
        </span>
      </MotionLink>
    </section>
  );
}
