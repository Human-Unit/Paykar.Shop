"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import type { Article } from "@/lib/store-content";

export const articlePresentation: Record<
  string,
  { image: string; label: string }
> = {
  "weekly-shopping": { image: "hero", label: "Покупки в вашем темпе" },
  "fruit-and-vegetables": {
    image: "produce",
    label: "Продукты на каждый день",
  },
  "delivery-guide": { image: "hero", label: "Доставка с Пайкар" },
  "checkout-checklist": { image: "dairy", label: "Понятное оформление" },
};

export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const { t } = usePresentation();
  const visual =
    articlePresentation[article.slug] ?? articlePresentation["weekly-shopping"];
  return (
    <Link
      className={`editorial-card${featured ? " is-featured" : ""}`}
      href={`/blog/${article.slug}`}
    >
      <div className="editorial-image">
        <Image
          src={`/images/paykar/${visual.image}.webp`}
          width={768}
          height={512}
          alt=""
          unoptimized
        />
        <span className="editorial-arrow">
          <ArrowUpRight size={22} aria-hidden="true" />
        </span>
      </div>
      <div className="editorial-copy">
        <span className="eyebrow">{t(visual.label)}</span>
        <h2>{t(article.title)}</h2>
        <p>{t(article.excerpt)}</p>
        <span className="editorial-meta">
          <Clock3 size={16} aria-hidden="true" /> {article.minutes}{" "}
          {t("мин чтения")}
        </span>
        <span className="text-link">
          {t("Читать")} <ArrowUpRight size={18} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
