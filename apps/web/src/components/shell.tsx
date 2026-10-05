"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { storePages, articles } from "@/lib/store-content";
import { MapPin, ShoppingBasket } from "lucide-react";
import { SearchBox } from "./search-box";
import { useCart } from "@/context/cart";
import { Preferences } from "./preferences";
import { Brand } from "./brand";
import { BurgerMenu, MainNavigation } from "./site-navigation";
import { Footer } from "./footer";
import { MotionProvider } from "./motion-primitives";
export function Shell({ children }: { children: React.ReactNode }) {
  const { t } = usePresentation();
  const cart = useCart();
  const path = usePathname();
  useEffect(() => {
    const page = storePages.find((entry) => path === `/${entry.slug}`);
    const article = articles.find((entry) => path === `/blog/${entry.slug}`);
    const title =
      article?.title ||
      page?.title ||
      (path.startsWith("/catalog")
        ? "Каталог"
        : path.startsWith("/checkout")
          ? "Оформление заказа"
          : path.startsWith("/cart")
            ? "Корзина"
            : path.startsWith("/order/")
              ? "Ваш заказ"
              : "Пайкар");
    document.title =
      title === "Пайкар" ? t(title) : `${t(title)} · ${t("Пайкар")}`;
    const description =
      article?.excerpt ||
      page?.description ||
      (path.startsWith("/catalog")
        ? "Выберите продукты по категории, цене и наличию."
        : "Продукты на каждый день: каталог, поиск, корзина и доставка.");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t(description));
  }, [path, t]);
  return (
    <MotionProvider>
      <a className="skip-link" href="#main">
        {t("Перейти к содержимому")}
      </a>
      <div className="info-strip">
        <div className="container topbar-inner">
          <span className="flex items-center gap-2">
            <MapPin size={14} />
            {t(" Душанбе")}
          </span>
          <div className="utility-actions">
            <Preferences />
            <BurgerMenu />
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Brand />
          <SearchBox />
          <Link
            href="/cart"
            className="cart-link"
            aria-label={t("Корзина, ") + cart.count + t(" товаров")}
          >
            <ShoppingBasket size={22} />
            <span className="cart-label">{t("Корзина")}</span>
            <span className="cart-count" data-testid="cart-count">
              {cart.count}
            </span>
          </Link>
        </div>
        <MainNavigation />
      </header>
      {cart.notice && (
        <div className="container pt-4" role="status">
          <p className="message">{t(cart.notice)}</p>
        </div>
      )}
      <main id="main" className="container main-content">
        {children}
      </main>
      <Footer />
    </MotionProvider>
  );
}
