import {
  CreditCard,
  FileText,
  Grid2X2,
  Heart,
  MapPin,
  Percent,
  Phone,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Tags,
  Truck,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavigationEntry = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  activeRoots?: readonly string[];
};

// One destination registry for all surfaces. URLs do not vary by language.
export const destinations = {
  catalog: {
    id: "catalog",
    label: "Каталог",
    href: "/catalog",
    icon: Grid2X2,
    activeRoots: ["/catalog", "/product"],
  },
  shopping: {
    id: "shopping",
    label: "Мои покупки",
    href: "/my-shopping",
    icon: ShoppingBag,
  },
  promotions: {
    id: "promotions",
    label: "Акции",
    href: "/promotions",
    icon: Percent,
  },
  stores: { id: "stores", label: "Магазины", href: "/stores", icon: MapPin },
  buy: {
    id: "buy",
    label: "Как купить",
    href: "/how-to-buy",
    icon: ShoppingCart,
  },
  delivery: {
    id: "delivery",
    label: "Условия доставки",
    href: "/delivery",
    icon: Truck,
  },
  payment: {
    id: "payment",
    label: "Условия оплаты",
    href: "/payment",
    icon: CreditCard,
  },
  returns: {
    id: "returns",
    label: "Возврат товара",
    href: "/returns",
    icon: Undo2,
  },
  about: { id: "about", label: "О нас", href: "/about", icon: Users },
  blog: { id: "blog", label: "Блог", href: "/blog", icon: FileText },
  brands: { id: "brands", label: "Бренды", href: "/brands", icon: Tags },
  contacts: {
    id: "contacts",
    label: "Контакты",
    href: "/contacts",
    icon: Phone,
  },
  saved: { id: "saved", label: "Сохранённые", href: "/saved", icon: Heart },
  cart: { id: "cart", label: "Корзина", href: "/cart", icon: ShoppingBasket },
} satisfies Record<string, NavigationEntry>;

export const primaryNavigation = [
  destinations.catalog,
  destinations.shopping,
  destinations.promotions,
  destinations.stores,
];
export const supportingNavigation = [
  {
    title: "Покупателям",
    items: [
      destinations.buy,
      destinations.delivery,
      destinations.payment,
      destinations.returns,
    ],
  },
  {
    title: "Компания",
    items: [
      destinations.about,
      destinations.blog,
      destinations.brands,
      destinations.contacts,
    ],
  },
];
export const shoppingNavigation = {
  title: "Покупки",
  items: [...primaryNavigation, destinations.saved],
};
export const navigationGroups = [shoppingNavigation, ...supportingNavigation];
export const mobileNavigation = [
  destinations.catalog,
  destinations.shopping,
  destinations.promotions,
  destinations.cart,
];

export function isNavigationActive(
  entry: NavigationEntry,
  pathname: string,
): boolean {
  const path = pathname.split(/[?#]/, 1)[0];
  return (entry.activeRoots ?? [entry.href]).some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
}
