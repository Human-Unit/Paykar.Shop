"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import type { Product } from "@/lib/api";
import type { CuratedTemplate, ShoppingTemplate } from "@/lib/shopping";
import { cents } from "@/lib/format";
import { useShoppingPreview } from "@/lib/use-shopping-preview";
import { ProductImage } from "./product-card";

// A full-width homepage preview, using the same live stock/price resolution as
// the shopping workspace. Only a visible personal slide requests a preview.
export function HomeTemplatePreview({
  personal,
  curated,
  products,
}: {
  products: Product[];
} & (
  | { personal: ShoppingTemplate; curated?: never }
  | { curated: CuratedTemplate; personal?: never }
)) {
  const { t, money, locale } = usePresentation();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !personal) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && entry.intersectionRatio > 0.5),
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [personal]);
  const preview = useShoppingPreview(visible && personal ? personal.items : []);
  const rows = personal ? preview.data?.items : curated.items;
  const images = (
    rows?.map((row) => row.product) ??
    personal?.items.map((item) =>
      products.find((product) => product.id === item.product_id),
    ) ??
    []
  ).filter((product): product is Product => Boolean(product));
  const title = personal ? personal.name : t(curated.name);
  const count = personal ? personal.items.length : curated.items.length;
  const plural = new Intl.PluralRules(locale).select(count);
  const href = personal
    ? `/my-shopping/templates/${personal.id}`
    : `/my-shopping/templates/curated-${curated.id}`;
  const total = rows?.reduce(
    (sum, row) =>
      sum +
      (row.product && row.availability === "available"
        ? cents(row.product.price) * row.available_quantity
        : 0),
    0,
  );
  return (
    <article ref={ref} className="bento-template-card">
      <Link href={href} className="bento-template-link">
        <span className="bento-template-collage" aria-hidden="true">
          {images.slice(0, 3).map((product) => (
            <span className="bento-template-photo" key={product.id}>
              <ProductImage product={product} />
            </span>
          ))}
          {images.length === 0 && (
            <span className="bento-template-photo">
              <Package size={36} />
            </span>
          )}
        </span>
        <span className="bento-template-copy">
          <strong title={title}>{title}</strong>
          <span className="bento-template-meta">
            {count}{" "}
            {t(
              plural === "one"
                ? "товар"
                : plural === "few"
                  ? "товара"
                  : "товаров",
            )}
            {total !== undefined && total > 0 && (
              <b
                className="bento-template-total"
                title={t(
                  "Оценка доступных товаров без доставки. Итог проверяется при оформлении.",
                )}
              >
                ≈ {money(total)}
              </b>
            )}
          </span>
          {rows?.some(
            (row) =>
              row.availability !== "available" ||
              row.available_quantity < row.requested_quantity,
          ) && (
            <small
              className="bento-template-limit"
              title={t("Некоторые товары недоступны или ограничены остатком.")}
            >
              {t("Есть ограничения")}
            </small>
          )}
        </span>
      </Link>
      {preview.loading && (
        <p className="bento-template-state" role="status">
          {t("Проверяем товары…")}
        </p>
      )}
      {preview.error && (
        <p className="bento-template-state" role="status">
          {t("Не удалось загрузить результаты. Повторите попытку.")}{" "}
          <button type="button" className="text-link" onClick={preview.retry}>
            {t("Повторить")}
          </button>
        </p>
      )}
    </article>
  );
}
