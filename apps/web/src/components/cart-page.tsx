"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBasket,
  Route,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/context/cart";
import { cents } from "@/lib/format";
import { ProductImage } from "./product-card";
import { Empty, Failure, Loading } from "./states";
import { Breadcrumbs } from "./breadcrumbs";
import { PageIntro } from "./page-patterns";
export function CartPage() {
  const { t, money } = usePresentation();
  const cart = useCart();
  if (!cart.items.length)
    return (
      <Empty
        title={t("Ваша корзина пока пуста")}
        text={t("Самое время выбрать что-нибудь вкусное.")}
      />
    );
  if (cart.loading) return <Loading kind="cart" label="Проверяем товары…" />;
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
    <div className="polish-page cart-page">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Корзина" }]}
      />
      <PageIntro
        eyebrow="Проверьте корзину"
        title="Ваша корзина"
        description="Количество и состав покупки можно изменить до оформления."
        icon={ShoppingBasket}
      />
      <div className="cart-layout">
        <section aria-label={t("Товары в корзине")}>
          <div className="cart-list-heading">
            <strong>{t("Товары в корзине")}</strong>
            <span>
              {t("Товаров: ")}
              {cart.count}
            </span>
          </div>
          <div className="cart-items">
            {cart.items.map((item) => {
              const p = cart.products.find((p) => p.id === item.product_id);
              if (!p)
                return (
                  <div className="cart-item" key={item.product_id}>
                    <p>{t("Товар больше не доступен")}</p>
                    <button
                      className="text-link"
                      onClick={() => cart.remove(item.product_id)}
                    >
                      {t("Удалить")}
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
                    <Link href={`/product/${p.slug}`}>{t(p.name)}</Link>
                    <p>
                      {money(cents(p.price))} / {t(p.unit)}
                    </p>
                    {item.quantity > stock && (
                      <p className="stock-warning">
                        {t("Доступно только ")}
                        {stock}
                        {t(". Измените количество.")}
                      </p>
                    )}
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label={t("Уменьшить: ") + t(p.name)}
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        cart.quantity(p.id, item.quantity - 1, stock)
                      }
                    >
                      <Minus size={16} />
                    </button>
                    <span data-testid="quantity">{item.quantity}</span>
                    <button
                      aria-label={t("Увеличить: ") + t(p.name)}
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
                    aria-label={t("Удалить: ") + t(p.name)}
                    onClick={() => cart.remove(p.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              );
            })}
          </div>
          <button className="text-link mt-5" onClick={cart.clear}>
            {t("Очистить корзину")}
          </button>
        </section>
        <aside className="cart-summary">
          <span className="eyebrow">
            <CheckCircle2 size={16} aria-hidden="true" />
            {t("Следующий шаг")}
          </span>
          <h2>{t("Ваши покупки")}</h2>
          <div>
            <span>
              {t("Товары (")}
              {cart.count})
            </span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div className="summary-total">
            <span>{t("Подытог")}</span>
            <strong data-testid="subtotal">{money(subtotal)}</strong>
          </div>
          <p className="summary-note">
            <Route size={20} aria-hidden="true" />
            {t("Стоимость доставки будет рассчитана при оформлении.")}
          </p>
          {invalidStock ? (
            <>
              <p className="stock-warning" role="status">
                {t("Измените количество или удалите недоступные товары.")}
              </p>
              <button className="button" disabled>
                {t("К оформлению →")}
              </button>
            </>
          ) : (
            <Link href="/checkout" className="button">
              {t("К оформлению →")}
            </Link>
          )}
          <Link href="/catalog" className="text-link">
            {t("Продолжить покупки")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
