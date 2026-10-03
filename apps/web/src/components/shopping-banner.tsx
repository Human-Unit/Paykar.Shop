"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Brand } from "./brand";

export function ShoppingBanner({ hero = false }: { hero?: boolean }) {
  const { t } = usePresentation();
  return (
    <section className={`shopping-banner ${hero ? "hero" : ""}`}>
      <Image
        src="/images/paykar/hero.webp"
        width={1536}
        height={1024}
        alt=""
        priority={hero}
        unoptimized
        className="banner-photo"
      />
      <div className="banner-copy">
        <Brand />
        {hero ? (
          <>
            <span className="eyebrow">{t("ВАШ ЕЖЕДНЕВНЫЙ ВЫБОР")}</span>
            <h1>
              {t("Всё нужное —")}
              <br />
              {t("с доставкой")}
            </h1>
            <p>
              {t("Продукты на каждый день.")}
              <br />
              {t("Маршрут и стоимость — до заказа.")}
            </p>
          </>
        ) : (
          <>
            <h2>{t("Свежий выбор на каждый день")}</h2>
            <p>{t("Соберите корзину. Доставку рассчитаем до заказа.")}</p>
          </>
        )}
        <Link href="/catalog" className={hero ? "button" : "banner-link"}>
          {t("За покупками ")} <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
