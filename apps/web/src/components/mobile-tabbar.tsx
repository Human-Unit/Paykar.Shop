"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, Percent, ShoppingBasket } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useCart } from "@/context/cart";

// Thumb-reach navigation for small screens. CSS shows it below 769px and hides
// it during checkout, where leaving the form would discard what was typed.
export function MobileTabBar() {
  const { t } = usePresentation();
  const cart = useCart();
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Главная", icon: House, active: path === "/" },
    {
      href: "/catalog",
      label: "Каталог",
      icon: LayoutGrid,
      active: path.startsWith("/catalog") || path.startsWith("/product"),
    },
    {
      href: "/promotions",
      label: "Акции",
      icon: Percent,
      active: path === "/promotions",
    },
    {
      href: "/cart",
      label: "Корзина",
      icon: ShoppingBasket,
      active: path.startsWith("/cart"),
      count: cart.count,
    },
  ];
  return (
    <nav className="tabbar" aria-label={t("Нижняя навигация")}>
      {tabs.map(({ href, label, icon: Icon, active, count }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={
            count === undefined
              ? undefined
              : t("Корзина, ") + count + t(" товаров")
          }
        >
          <span className="tabbar-icon">
            <Icon size={22} aria-hidden="true" />
            {!!count && (
              <span className="tabbar-badge" key={count}>
                {count}
              </span>
            )}
          </span>
          <span>{t(label)}</span>
        </Link>
      ))}
    </nav>
  );
}
