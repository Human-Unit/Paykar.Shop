"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart";
import { cents, money } from "@/lib/format";
import { ProductImage } from "./product-card";
import { Empty, Failure, Loading } from "./states";

export function CartPage() {
  const cart = useCart();
  if (!cart.items.length)
    return (
      <Empty
        title="Ваша корзина пока пуста"
        text="Самое время выбрать что-нибудь вкусное."
      />
    );
  if (cart.loading) return <Loading />;
  if (cart.error) return <Failure error={cart.error} retry={cart.retry} />;
  const subtotal = cart.items.reduce((sum, item) => {
    const p = cart.products.find((p) => p.id === item.product_id);
    return sum + (p ? cents(p.price) * item.quantity : 0);
  }, 0);
  const invalidStock = cart.items.some((item) => {
    const product = cart.products.find((p) => p.id === item.product_id);
    return (
      !product ||
      !product.is_active ||
      Number(product.stock_quantity) < item.quantity
    );
  });
  return (
    <>
      <p className="breadcrumb">
        <Link href="/">Главная</Link> / Корзина
      </p>
      <div className="page-title">
        <h1>Ваша корзина</h1>
        <p>Товаров: {cart.count}</p>
      </div>
      <div className="cart-layout">
        <section aria-label="Товары в корзине">
          <div className="cart-items">
            {cart.items.map((item) => {
              const p = cart.products.find((p) => p.id === item.product_id);
              if (!p)
                return (
                  <div className="cart-item" key={item.product_id}>
                    <p>Товар больше не доступен</p>
                    <button
                      className="text-link"
                      onClick={() => cart.remove(item.product_id)}
                    >
                      Удалить
                    </button>
                  </div>
                );
              const stock = Math.floor(Number(p.stock_quantity));
              return (
                <article className="cart-item" key={p.id}>
                  <Link href={`/product/${p.slug}`} className="cart-image">
                    <ProductImage product={p} />
                  </Link>
                  <div className="cart-item-name">
                    <Link href={`/product/${p.slug}`}>{p.name}</Link>
                    <p>
                      {money(cents(p.price))} / {p.unit}
                    </p>
                    {item.quantity > stock && (
                      <p className="stock-warning">
                        Доступно только {stock}. Измените количество.
                      </p>
                    )}
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label={`Уменьшить: ${p.name}`}
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        cart.quantity(p.id, item.quantity - 1, stock)
                      }
                    >
                      <Minus size={16} />
                    </button>
                    <span data-testid="quantity">{item.quantity}</span>
                    <button
                      aria-label={`Увеличить: ${p.name}`}
                      disabled={item.quantity >= stock || item.quantity >= 99}
                      onClick={() =>
                        cart.quantity(p.id, item.quantity + 1, stock)
                      }
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong>{money(cents(p.price) * item.quantity)}</strong>
                  <button
                    className="remove-button"
                    aria-label={`Удалить: ${p.name}`}
                    onClick={() => cart.remove(p.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              );
            })}
          </div>
          <button className="text-link mt-5" onClick={cart.clear}>
            Очистить корзину
          </button>
        </section>
        <aside className="cart-summary">
          <h2>Ваши покупки</h2>
          <div>
            <span>Товары ({cart.count})</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div className="summary-total">
            <span>Подытог</span>
            <strong data-testid="subtotal">{money(subtotal)}</strong>
          </div>
          <p>Стоимость доставки будет рассчитана при оформлении.</p>
          {invalidStock ? (
            <>
              <p className="stock-warning" role="status">
                Измените количество или удалите недоступные товары.
              </p>
              <button className="button" disabled>
                К оформлению →
              </button>
            </>
          ) : (
            <Link href="/checkout" className="button">
              К оформлению →
            </Link>
          )}
          <Link href="/catalog" className="text-link">
            Продолжить покупки
          </Link>
        </aside>
      </div>
    </>
  );
}
