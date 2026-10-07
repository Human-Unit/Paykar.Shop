"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavigation, isNavigationActive } from "@/lib/navigation";
import { usePresentation } from "@/context/presentation";
import { useCart } from "@/context/cart";

// Thumb-reach navigation for small screens. CSS shows it below 769px and hides
// it during checkout, where leaving the form would discard what was typed.
export function MobileTabBar() {
  const { t } = usePresentation();
  const cart = useCart();
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label={t("Нижняя навигация")}>
      {mobileNavigation.map((item) => {
        const { href, label, icon: Icon } = item;
        const active = isNavigationActive(item, path);
        const count = item.id === "cart" ? cart.count : undefined;
        return (
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
        );
      })}
    </nav>
  );
}
