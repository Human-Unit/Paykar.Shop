"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Product } from "@/lib/api";
import { cents, money } from "@/lib/format";
import { useCart } from "@/context/cart";

export function ProductImage({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={
        failed || !product.image_url
          ? "/images/products/fallback.svg"
          : product.image_url
      }
      alt={product.name}
      width={large ? 520 : 260}
      height={large ? 520 : 260}
      unoptimized
      onError={() => setFailed(true)}
      className="product-image"
    />
  );
}
export function AddButton({ product }: { product: Product }) {
  const cart = useCart();
  const count =
    cart.items.find((item) => item.product_id === product.id)?.quantity || 0;
  const stock = Math.floor(Number(product.stock_quantity));
  if (count > 0)
    return (
      <div
        className="quantity-control card-quantity"
        aria-label={`Количество в корзине: ${product.name}`}
      >
        <button
          type="button"
          aria-label={`Уменьшить: ${product.name}`}
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
          <small>в корзине</small>
        </span>
        <button
          type="button"
          aria-label={`Увеличить: ${product.name}`}
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
      aria-label={`Добавить в корзину: ${product.name}`}
    >
      <Plus size={17} />
      {stock < 1 ? "Нет в наличии" : "В корзину"}
    </button>
  );
}
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
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
        <p className="unit">{product.unit} · демо</p>
        <Link className="product-name" href={`/product/${product.slug}`}>
          {product.name}
        </Link>
        <div className="prices">
          <strong>{money(cents(product.price))}</strong>
          {product.old_price && <del>{money(cents(product.old_price))}</del>}
        </div>
        <AddButton product={product} />
      </div>
    </article>
  );
}
