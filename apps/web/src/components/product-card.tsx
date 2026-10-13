"use client";
import Image from "next/image";
import { usePresentation } from "@/context/presentation";
import { useSavedItems } from "@/context/saved-items";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Product } from "@/lib/api";
import { cents } from "@/lib/format";
import { PurchaseControl } from "./purchase-control";
import { stockLimit, defaultMode, weighted } from "@/lib/measurement";
import styles from "./shopping-assistance.module.css";
// Only replace the known demo illustrations; supplied product photographs remain intact.
const demoPhotos: Record<string, string> = {
  apple: "produce",
  milk: "dairy",
  bread: "bakery",
  bottle: "drinks",
  chocolate: "sweets",
  cleaner: "household",
};
const producePhotos: Record<string, string> = {
  "apples-red": "apples",
  bananas: "bananas",
  oranges: "oranges",
  lemons: "lemons",
  carrots: "carrots",
  potatoes: "potatoes",
  cucumbers: "cucumbers",
};
// Category imagery is illustrative, not a photograph of an exact SKU.
export function hasCategoryImage(product: Pick<Product, "slug" | "image_url">) {
  const illustration = product.image_url.match(
    /^\/images\/products\/(\w+)\.svg$/,
  )?.[1];
  return Boolean(
    illustration && demoPhotos[illustration] && !producePhotos[product.slug],
  );
}
export function imageIllustrationLabel(
  product: Pick<Product, "slug" | "image_url">,
) {
  if (product.image_url.startsWith("/images/products/generated/"))
    return "Иллюстрация товара";
  return hasCategoryImage(product) ? "Иллюстрация категории" : null;
}
export function ProductImage({
  product,
  large = false,
}: {
  product: Pick<Product, "name" | "slug" | "image_url">;
  large?: boolean;
}) {
  const { t } = usePresentation();
  const [failed, setFailed] = useState(false);
  const imageLabel = imageIllustrationLabel(product);
  const illustration = product.image_url.match(
    /^\/images\/products\/(\w+)\.svg$/,
  )?.[1];
  const photo = illustration
    ? producePhotos[product.slug] || demoPhotos[illustration]
    : undefined;
  return (
    <Image
      src={
        failed || !product.image_url
          ? "/images/products/fallback.svg"
          : photo
            ? `/images/paykar/${photo}.webp`
            : product.image_url
      }
      alt={t(product.name)}
      title={imageLabel ? t(imageLabel) : undefined}
      width={large ? 520 : 260}
      height={large ? 520 : 260}
      unoptimized
      loading={large ? "eager" : undefined}
      onError={() => setFailed(true)}
      data-image-kind={hasCategoryImage(product) ? "category" : "product"}
      className="product-image"
    />
  );
}
// Whole percent saved against the previous price, or 0 when not discounted.
export function discountPercent(product: Product) {
  return product.old_price && cents(product.old_price) > cents(product.price)
    ? Math.round((1 - cents(product.price) / cents(product.old_price)) * 100)
    : 0;
}
export function AddButton({
  product,
  detailed = false,
}: {
  product: Product;
  detailed?: boolean;
}) {
  return <PurchaseControl product={product} detailed={detailed} />;
}
export function ProductCard({
  product,
}: {
  product: Product;
  // Existing grids can keep this prop; product tiles render immediately.
  revealIndex?: number;
}) {
  const { t, money } = usePresentation();
  const saved = useSavedItems();
  const isSaved = saved.has(product.id);
  const discount = discountPercent(product);
  const soldOut =
    stockLimit(product, defaultMode(product)) < (product.minimum_quantity || 1);
  const imageLabel = imageIllustrationLabel(product);
  return (
    <article
      className={`product-card ${styles.card}`}
      data-sold-out={soldOut || undefined}
    >
      <button
        type="button"
        className={styles.saveButton}
        data-saved={isSaved}
        aria-pressed={isSaved}
        aria-label={
          t(isSaved ? "Убрать из сохранённых: " : "Сохранить: ") +
          t(product.name)
        }
        onClick={() => saved.toggle(product.id)}
      >
        <Heart
          size={18}
          fill={isSaved ? "currentColor" : "none"}
          aria-hidden="true"
        />
      </button>
      <Link
        href={`/product/${product.slug}`}
        className="image-wrap"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage product={product} />
        {imageLabel && !soldOut && (
          <span className="product-image-note">{t(imageLabel)}</span>
        )}
        {discount > 0 && <span className="badge">−{discount}%</span>}
        {soldOut && <span className="stock-flag">{t("Нет в наличии")}</span>}
      </Link>
      <div className="product-card-body">
        <p className="unit">{t(product.unit)}</p>
        <Link
          className="product-name"
          href={`/product/${product.slug}`}
          title={t(product.name)}
        >
          {t(product.name)}
        </Link>
        <div className="prices" data-sale={discount > 0 || undefined}>
          <strong>
            {money(cents(product.price))}{" "}
            <small>
              / {t(weighted(product) ? "\u043a\u0433" : "\u0448\u0442")}
            </small>
          </strong>
          {product.old_price && <del>{money(cents(product.old_price))}</del>}
        </div>
        <AddButton product={product} />
      </div>
    </article>
  );
}
