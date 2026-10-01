"use client";

import Link from "next/link";
import { Grid2X2, MapPin, ShoppingBasket, ArrowRight } from "lucide-react";
import { SearchBox } from "./search-box";
import { useCart } from "@/context/cart";

export function Shell({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <div className="info-strip">
        <div className="container flex items-center justify-between gap-4 py-2.5 text-xs">
          <span className="flex items-center gap-2">
            <MapPin size={14} /> Душанбе
          </span>
          <span>Учебный магазин · демонстрационные товары и цены</span>
        </div>
      </div>
      <header className="bg-white border-b border-stone-200">
        <div className="container header-main">
          <Link href="/" className="brand" aria-label="Paykar, главная">
            paykar<span>shop</span>
            <small>продукты на каждый день</small>
          </Link>
          <Link href="/catalog" className="button catalog-button">
            <Grid2X2 size={19} /> Каталог
          </Link>
          <SearchBox />
          <Link
            href="/cart"
            className="cart-link"
            aria-label={`Корзина, ${cart.count} товаров`}
          >
            <ShoppingBasket size={25} />
            <span className="cart-label">Корзина</span>
            <span className="cart-count" data-testid="cart-count">
              {cart.count}
            </span>
          </Link>
        </div>
        <nav className="container nav-row" aria-label="Основная навигация">
          <Link href="/catalog/produce">Фрукты и овощи</Link>
          <Link href="/catalog/dairy">Молочные продукты</Link>
          <Link href="/catalog/bakery">Хлеб и выпечка</Link>
          <Link href="/catalog/drinks">Напитки</Link>
          <Link href="/catalog/sweets">Сладости</Link>
          <Link href="/catalog/household">Для дома</Link>
        </nav>
      </header>
      {cart.notice && (
        <div className="container pt-4" role="status">
          <p className="message">{cart.notice}</p>
        </div>
      )}
      <main id="main" className="container main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Link href="/" className="brand">
              paykar<span>shop</span>
            </Link>
            <p>Знакомый магазин. Удобный выбор.</p>
            <p className="text-xs mt-4">
              Независимое учебное воспроизведение.
              <br />
              Не официальный сайт Paykar.
            </p>
          </div>
          <div>
            <h2>Покупателям</h2>
            <Link href="/catalog">
              Каталог товаров <ArrowRight size={14} />
            </Link>
            <Link href="/cart">Ваша корзина</Link>
          </div>
          <div>
            <h2>О проекте</h2>
            <p>
              Демонстрационный ассортимент.
              <br />
              Доставка с выбором точки на карте.
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          Учебный проект · цены указаны в сомони (TJS)
        </div>
      </footer>
    </>
  );
}
