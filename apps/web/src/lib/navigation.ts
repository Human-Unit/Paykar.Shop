import {
  CreditCard,
  FileText,
  MapPin,
  Percent,
  Phone,
  ShoppingCart,
  Tags,
  Truck,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type InformationEntry = {
  id: string;
  label: string;
  href: string;
  content: string[];
  icon: LucideIcon;
  desktop?: boolean;
};
// Shared by the header, drawer and footer. URLs stay stable across languages.
export const informationNavigation: InformationEntry[] = [
  {
    id: "buy",
    label: "Как купить",
    href: "/how-to-buy",
    icon: ShoppingCart,
    content: [
      "Выберите товары.",
      "Добавьте их в корзину.",
      "Укажите адрес и точку доставки.",
      "Проверьте стоимость и подтвердите заказ.",
    ],
  },
  {
    id: "payment",
    label: "Условия оплаты",
    href: "/payment",
    icon: CreditCard,
    content: ["Наличными при получении или тестовая онлайн-оплата картой."],
  },
  {
    id: "delivery",
    label: "Условия доставки",
    href: "/delivery",
    icon: Truck,
    content: [
      "Выберите точку доставки на карте.",
      "Получите маршрут, расстояние и примерное время.",
      "Стоимость доставки отображается до оформления заказа.",
    ],
  },
  {
    id: "returns",
    label: "Возврат товара",
    href: "/returns",
    icon: Undo2,
    content: ["Обсудите вопрос возврата с сотрудниками магазина."],
  },
  {
    id: "promotions",
    label: "Акции",
    href: "/promotions",
    icon: Percent,
    content: [],
  },
  {
    id: "blog",
    label: "Блог",
    href: "/blog",
    icon: FileText,
    content: ["Полезные материалы о покупках и доставке."],
  },
  {
    id: "brands",
    label: "Бренды",
    href: "/brands",
    icon: Tags,
    content: ["Информация о производителях товаров."],
  },
  {
    id: "about",
    label: "О нас",
    href: "/about",
    icon: Users,
    content: ["Пайкар — продукты и товары на каждый день."],
  },
  {
    id: "contacts",
    label: "Контакты",
    href: "/contacts",
    icon: Phone,
    content: ["Адрес магазина и карта."],
  },
  {
    id: "stores",
    label: "Магазины",
    href: "/stores",
    icon: MapPin,
    content: ["Найдите магазин на карте."],
    desktop: false,
  },
];
