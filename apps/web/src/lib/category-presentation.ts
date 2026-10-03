import type { Category } from "./api";

// Local artwork shared by home tiles and navigation, keyed by API category slug.
export const categoryImages: Record<string, string> = {
  produce: "produce",
  fruit: "produce",
  dairy: "dairy",
  bakery: "bakery",
  drinks: "drinks",
  sweets: "sweets",
  household: "household",
};

// Product-family shortcuts use the existing category + q search. These are not
// database categories and never introduce category IDs or unsupported slugs.
export const categoryTopics: Record<
  string,
  readonly { label: string; query: string }[]
> = {
  produce: [
    { label: "Морковь", query: "Морковь" },
    { label: "Картофель", query: "Картофель" },
    { label: "Огурцы", query: "Огурцы" },
  ],
  dairy: [
    { label: "Молоко", query: "Молоко" },
    { label: "Кефир", query: "Кефир" },
    { label: "Йогурты", query: "Йогурт" },
    { label: "Сметана", query: "Сметана" },
    { label: "Творог", query: "Творог" },
    { label: "Сливочное масло", query: "Масло" },
    { label: "Сыры", query: "Сыр" },
  ],
  bakery: [
    { label: "Хлеб", query: "Хлеб" },
    { label: "Лепёшки", query: "Лепёшка" },
    { label: "Багеты", query: "Багет" },
    { label: "Круассаны", query: "Круассан" },
    { label: "Булочки", query: "Булочка" },
    { label: "Лаваш", query: "Лаваш" },
  ],
  drinks: [
    { label: "Вода", query: "Вода" },
    { label: "Соки", query: "Сок" },
    { label: "Чай", query: "Чай" },
    { label: "Кофе", query: "Кофе" },
  ],
  sweets: [
    { label: "Шоколад", query: "Шоколад" },
    { label: "Печенье", query: "Печенье" },
    { label: "Вафли", query: "Вафли" },
    { label: "Мармелад", query: "Мармелад" },
    { label: "Мёд", query: "Мёд" },
  ],
  household: [
    { label: "Средство для посуды", query: "Средство для посуды" },
    { label: "Мыло", query: "Мыло" },
    { label: "Бумажные товары", query: "бумажные" },
    { label: "Губки", query: "Губки" },
    { label: "Пакеты для мусора", query: "Пакеты для мусора" },
  ],
};

export function catalogGroups(categories: readonly Category[]) {
  const ids = new Set(categories.map((category) => category.id));
  const descendants = (id: number, visited: Set<number>): Category[] =>
    categories
      .filter(
        (category) => category.parent_id === id && !visited.has(category.id),
      )
      .flatMap((category) => {
        visited.add(category.id);
        return [category, ...descendants(category.id, visited)];
      });
  return categories
    .filter(
      (category) => category.parent_id === null || !ids.has(category.parent_id),
    )
    .map((category) => ({
      category,
      children: descendants(category.id, new Set([category.id])),
    }));
}

export function categoryHref(slug: string) {
  return `/catalog/${encodeURIComponent(slug)}`;
}

export function catalogGroupLinks(
  category: Category,
  children: readonly Category[],
) {
  const realNames = new Set(children.map((child) => child.name));
  return [
    ...children.map((child) => ({
      label: child.name,
      href: categoryHref(child.slug),
      category: true,
    })),
    ...(categoryTopics[category.slug] || [])
      .filter((topic) => !realNames.has(topic.label))
      .map((topic) => ({
        label: topic.label,
        href: `${categoryHref(category.slug)}?${new URLSearchParams({ q: topic.query })}`,
        category: false,
      })),
  ];
}
