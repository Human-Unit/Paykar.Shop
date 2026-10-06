"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { storePages, articles } from "@/lib/store-content";
import { Info, MapPin, ShoppingBasket } from "lucide-react";
import { SearchBox } from "./search-box";
import { useCart } from "@/context/cart";
import { Preferences } from "./preferences";
import { Brand } from "./brand";
import { BurgerMenu, MainNavigation } from "./site-navigation";
import { Footer } from "./footer";
import { MotionProvider } from "./motion-primitives";
import { MobileTabBar } from "./mobile-tabbar";

// Sticky header state lives on the element, not in React: scrolling must not
// re-render the page. The navigation row tucks away on the way down and
// returns on the first scroll up, but never while one of its menus is in use.
function useHeaderScroll() {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = header.current;
    if (!node) return;
    let last = window.scrollY;
    let turn = last;
    let down = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (y > last !== down) {
        down = y > last;
        turn = last;
      }
      last = y;
      node.dataset.scrolled = String(y > 8);
      const navigation = node.querySelector(".main-navigation");
      const busy =
        navigation?.contains(document.activeElement) ||
        navigation?.querySelector('[aria-expanded="true"]');
      if (y < 200 || busy) node.dataset.nav = "shown";
      else if (down && y - turn > 40) node.dataset.nav = "hidden";
      else if (!down && turn - y > 16) node.dataset.nav = "shown";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocus = () => {
      node.dataset.nav = "shown";
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    node.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      node.removeEventListener("focusin", onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return header;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { t } = usePresentation();
  const cart = useCart();
  const path = usePathname();
  const header = useHeaderScroll();
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
          <span className="topbar-city">
            <MapPin size={14} aria-hidden="true" />
            {t(" Душанбе")}
          </span>
          <div className="utility-actions">
            <Preferences />
            <BurgerMenu />
          </div>
        </div>
      </div>
      <header className="site-header" ref={header}>
        <div className="header-bar">
          <div className="container header-main">
            <Brand />
            <Suspense fallback={null}>
              <SearchBox />
            </Suspense>
            <Link
              href="/cart"
              className="cart-link"
              data-empty={cart.count === 0}
              aria-label={t("Корзина, ") + cart.count + t(" товаров")}
            >
              <ShoppingBasket size={22} aria-hidden="true" />
              <span className="cart-label">{t("Корзина")}</span>
              {/* Keyed by value so the badge replays its pop on every change. */}
              <span
                className="cart-count"
                data-testid="cart-count"
                key={cart.count}
              >
                {cart.count}
              </span>
            </Link>
          </div>
        </div>
        <div className="nav-bar">
          <MainNavigation />
        </div>
      </header>
      <div className="toast-region" role="status" aria-live="polite">
        {cart.notice && (
          <p className="toast" key={cart.noticeId}>
            <Info size={18} aria-hidden="true" />
            {t(cart.notice)}
          </p>
        )}
      </div>
      <main id="main" className="container main-content">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
    </MotionProvider>
  );
}
