"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePresentation } from "@/context/presentation";

export function ShoppingPromo({ compact = false }: { compact?: boolean }) {
  const { t } = usePresentation();
  return (
    <section className={`shopping-promo ${compact ? "compact" : ""}`}>
      <div>
        <span className="eyebrow">{t("Маршрут до покупки")}</span>
        <h2>
          {t("Выберите продукты. Проверьте доставку. Всё в одном заказе.")}
        </h2>
        <p>
          {t(
            "Соберите корзину и выберите точку на карте. Проверьте стоимость до заказа.",
          )}
        </p>
        <Link href="/catalog" className="text-link">
          {t("Продолжить покупки")} <ArrowUpRight size={17} />
        </Link>
      </div>
      <Image
        src="/images/paykar/produce.webp"
        width={180}
        height={180}
        alt=""
        unoptimized
      />
    </section>
  );
}
