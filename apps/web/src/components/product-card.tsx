"use client";
import Image from "next/image";
import { usePresentation } from "@/context/presentation";
import { m, useReveal } from "./motion-primitives";
import Link from "next/link";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Product } from "@/lib/api";
import { cents } from "@/lib/format";
import { useCart } from "@/context/cart";
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
// Whole percent saved against the previous price, or 0 when not discounted.
export function discountPercent(product: Product) {
  return product.old_price && cents(product.old_price) > cents(product.price)
    ? Math.round((1 - cents(product.price) / cents(product.old_price)) * 100)
    : 0;
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
          {/* Keyed by value so each change replays the count animation. */}
          <b className="quantity-value" key={count}>
            {count}
          </b>
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
  const reveal = useReveal({
    rise: 16,
    delay: Math.min(revealIndex, 6) * 0.055,
    hover: true,
  });
  const discount = discountPercent(product);
  const soldOut = Number(product.stock_quantity) < 1;
  return (
    <m.article
      {...reveal}
      className="product-card"
      data-sold-out={soldOut || undefined}
    >
      <Link
        href={`/product/${product.slug}`}
        className="image-wrap"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage product={product} />
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
          <strong>{money(cents(product.price))}</strong>
          {product.old_price && <del>{money(cents(product.old_price))}</del>}
        </div>
        <AddButton product={product} />
      </div>
    </m.article>
  );
}
