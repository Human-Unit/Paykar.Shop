"use client";
import Image from "next/image";
import { usePresentation } from "@/context/presentation";
import { useSavedItems } from "@/context/saved-items";
import { m, useReveal } from "./motion-primitives";
import Link from "next/link";
import { useState } from "react";
import { Heart, Plus, Minus } from "lucide-react";
import { Product } from "@/lib/api";
import { cents } from "@/lib/format";
import { useCart } from "@/context/cart";
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
export function ProductImage({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  const { t } = usePresentation();
  const [failed, setFailed] = useState(false);
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
      width={large ? 520 : 260}
      height={large ? 520 : 260}
      unoptimized
      loading={large ? "eager" : undefined}
      onError={() => setFailed(true)}
      className="product-image"
    />
  );
}
export function AddButton({ product }: { product: Product }) {
  const { t } = usePresentation();
  const cart = useCart();
  const count =
    cart.items.find((item) => item.product_id === product.id)?.quantity || 0;
  const stock = Math.floor(Number(product.stock_quantity));
  if (count > 0)
    return (
      <div
        className="quantity-control card-quantity"
        aria-label={t("Количество в корзине: ") + t(product.name)}
      >
        <button
          type="button"
          aria-label={t("Уменьшить: ") + t(product.name)}
          onClick={() =>
            count === 1
              ? cart.remove(product.id)
              : cart.quantity(product.id, count - 1, stock)
          }
        >
          <Minus size={18} />
        </button>
        <span aria-live="polite">
          {count}
          <small>{t("в корзине")}</small>
        </span>
        <button
          type="button"
          aria-label={t("Увеличить: ") + t(product.name)}
          disabled={count >= stock || count >= 99}
          onClick={() => cart.add(product)}
        >
          <Plus size={18} />
        </button>
      </div>
    );
  return (
    <button
      type="button"
      className="add-button"
      disabled={stock < 1 || count >= stock || count >= 99}
      onClick={() => cart.add(product)}
      aria-label={t("Добавить в корзину: ") + t(product.name)}
    >
      <Plus size={17} />
      {stock < 1 ? t("Нет в наличии") : t("В корзину")}
    </button>
  );
}
export function ProductCard({
  product,
  revealIndex = 0,
}: {
  product: Product;
  revealIndex?: number;
}) {
  const { t, money } = usePresentation();
  const saved = useSavedItems();
  const isSaved = saved.has(product.id);
  const reveal = useReveal({
    rise: 8,
    delay: Math.min(revealIndex, 5) * 0.05,
    hover: true,
  });
  return (
    <m.article {...reveal} className={`product-card ${styles.card}`}>
      <button
        type="button"
        className={styles.saveButton}
        data-saved={isSaved}
        aria-pressed={isSaved}
        aria-label={
          t(isSaved ? "Убрать из сохранённых: " : "Сохранить: ") + t(product.name)
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
        {product.old_price &&
          cents(product.old_price) > cents(product.price) && (
            <span className="badge">
              −
              {Math.round(
                (1 - cents(product.price) / cents(product.old_price)) * 100,
              )}
              %
            </span>
          )}
      </Link>
      <div className="product-card-body">
        <p className="unit">{t(product.unit)}</p>
        <Link className="product-name" href={`/product/${product.slug}`}>
          {t(product.name)}
        </Link>
        <div className="prices">
          <strong>{money(cents(product.price))}</strong>
          {product.old_price && <del>{money(cents(product.old_price))}</del>}
        </div>
        <AddButton product={product} />
      </div>
    </m.article>
  );
}
