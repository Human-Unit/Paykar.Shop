"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Brand } from "./brand";
import { m, MotionImage, MotionLink, useReveal } from "./motion-primitives";

export function ShoppingBanner({ hero = false }: { hero?: boolean }) {
  const { t } = usePresentation();
  const eyebrow = useReveal({ rise: 10, inView: false });
  const headline = useReveal({ rise: 16, delay: 0.06, inView: false });
  const description = useReveal({ rise: 12, delay: 0.12, inView: false });
  const action = useReveal({ rise: 10, delay: 0.18, inView: false });
  const photo = useReveal({ rise: 0, duration: 0.5, inView: false });
  const BannerImage = hero ? MotionImage : Image;
  const BannerLink = hero ? MotionLink : Link;
  return (
    <section className={`shopping-banner ${hero ? "hero" : ""}`}>
      <BannerImage
        {...(hero ? photo : {})}
        src="/images/paykar/hero.webp"
        width={1536}
        height={1024}
        alt=""
        priority={hero}
        unoptimized
        className="banner-photo"
      />
      <div className="banner-copy">
        {!hero && <Brand />}
        {hero ? (
          <>
            <m.span {...eyebrow} className="eyebrow">
              {t("ВАШ ЕЖЕДНЕВНЫЙ ВЫБОР")}
            </m.span>
            <m.h1 {...headline}>
              {t("Всё нужное —")}
              <br />
              {t("с доставкой")}
            </m.h1>
            <m.p {...description}>
              {t("Продукты на каждый день.")}
              <br />
              {t("Маршрут и стоимость — до заказа.")}
            </m.p>
          </>
        ) : (
          <>
            <h2>{t("Свежий выбор на каждый день")}</h2>
            <p>{t("Соберите корзину. Доставку рассчитаем до заказа.")}</p>
          </>
        )}
        <BannerLink
          {...(hero ? action : {})}
          href="/catalog"
          className={hero ? "button" : "banner-link"}
        >
          {t("За покупками ")} <ArrowUpRight size={18} aria-hidden="true" />
        </BannerLink>
      </div>
    </section>
  );
}
