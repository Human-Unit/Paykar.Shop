// Explicit metadata, never inferred from arbitrary DOM or computed CSS.
export const designPages = {
  home: "Home",
  promotions: "Offers",
  myShopping: "My shopping",
  catalog: "Catalog / search",
  product: "Product",
  cart: "Cart",
  checkout: "Checkout",
  stores: "Stores",
  saved: "Saved products",
  information: "Customer information",
} as const;
export type DesignPageId = keyof typeof designPages;
export const designRegions = {
  "home.hero": {
    page: "home",
    label: "Hero",
    controls: ["colors.brand", "radius.panel"],
  },
  "home.featured": {
    page: "home",
    label: "Featured offer",
    controls: ["colors.brand", "radius.panel", "effects.watermark_opacity"],
  },
  "home.offers": {
    page: "home",
    label: "Offers",
    controls: [
      "colors.brand",
      "colors.sale",
      "radius.panel",
      "effects.watermark_opacity",
    ],
  },
  "home.shopping": {
    page: "home",
    label: "My shopping preview",
    controls: ["colors.brand", "radius.panel", "effects.watermark_opacity"],
  },
  "home.stores": {
    page: "home",
    label: "Store network",
    controls: ["colors.brand", "radius.panel"],
  },
  "home.delivery": {
    page: "home",
    label: "Order journey",
    controls: ["colors.brand", "radius.panel"],
  },
  "promotions.masthead": {
    page: "promotions",
    label: "Offers masthead",
    controls: ["colors.brand", "colors.sale", "radius.panel"],
  },
  "promotions.products": {
    page: "promotions",
    label: "Sale products",
    controls: [
      "colors.brand",
      "colors.sale",
      "radius.card",
      "radius.button",
      "motion.hover_lift",
    ],
  },
  "myShopping.masthead": {
    page: "myShopping",
    label: "Shopping masthead",
    controls: ["typography.heading_scale"],
  },
  "myShopping.orders": {
    page: "myShopping",
    label: "Recent orders",
    controls: [
      "colors.brand",
      "radius.card",
      "radius.button",
      "motion.hover_lift",
    ],
  },
  "myShopping.templates": {
    page: "myShopping",
    label: "Personal templates",
    controls: [
      "colors.brand",
      "radius.card",
      "radius.button",
      "motion.hover_lift",
    ],
  },
} as const;
export type DesignRegionId = keyof typeof designRegions;
export function designPageForPath(path: string): DesignPageId | null {
  if (path === "/") return "home";
  const root = path.split("/")[1];
  if (root === "admin" || !root) return null;
  const routes: Record<string, DesignPageId> = {
    promotions: "promotions",
    "my-shopping": "myShopping",
    catalog: "catalog",
    categories: "catalog",
    category: "catalog",
    search: "catalog",
    products: "product",
    product: "product",
    cart: "cart",
    checkout: "checkout",
    stores: "stores",
    saved: "saved",
  };
  return routes[root] || "information";
}
export function regionSupports(region: string, token: string): boolean {
  return (
    Object.hasOwn(designRegions, region) &&
    (
      designRegions[region as DesignRegionId].controls as readonly string[]
    ).includes(token)
  );
}
export function designControl(path: string) {
  const field = path.split(".").at(-1)!;
  const names: Record<string, [string, string]> = {
    brand: ["Primary color", "Paykar accents and primary actions."],
    sale: ["Sale color", "Discount ribbons and sale accents."],
    background: ["Page background", "Canvas behind storefront content."],
    surface: ["Panel surface", "Base tone used by cards and panels."],
    raised: ["Raised surface", "Secondary elevated controls."],
    text: ["Primary text", "Main reading color."],
    muted: ["Secondary text", "Quiet supporting information."],
    border: ["Border color", "Tonal separators."],
    border_opacity: ["Border opacity", "Strength of tonal separators."],
    heading_scale: [
      "Heading scale",
      "Adjust the established heading hierarchy.",
    ],
    body_scale: ["Body scale", "Adjust reading size."],
    content_width: ["Content width", "Maximum contained desktop width."],
    page_padding: ["Side margins", "Responsive page gutters remain bounded."],
    section_spacing: ["Section rhythm", "Space between major sections."],
    button: ["Button radius", "Corner softness of actions."],
    card: ["Card radius", "Corner softness of shopping cards."],
    panel: ["Panel radius", "Corner softness of large panels."],
    glass_blur: ["Glass softness", "Blur on existing glass surfaces only."],
    glass_opacity: ["Glass opacity", "Opacity of existing glass surfaces."],
    glow_intensity: [
      "Ambient glow",
      "Strength of existing CSS light accents; does not change the hero shader.",
    ],
    shadow_intensity: [
      "Shadow depth",
      "Strength of existing token-based shadows.",
    ],
    watermark_opacity: [
      "Brand watermark",
      "Visibility of existing decorative marks.",
    ],
    intensity: [
      "Motion intensity",
      "Token-based hover response; reduced motion still takes precedence.",
    ],
    hover_lift: [
      "Hover lift",
      "Small lift on supported shopping/product cards.",
    ],
    duration_scale: [
      "Transition duration",
      "Speed of existing token-based transitions.",
    ],
  };
  const [label, description] = names[field] || [
    field,
    "Safe design-system value.",
  ];
  return {
    label: path.includes(".dark.")
      ? `Dark · ${label}`
      : path.includes(".light.")
        ? `Light · ${label}`
        : label,
    description,
    group:
      path.startsWith("colors.dark") || path.startsWith("colors.light")
        ? "Surfaces"
        : path.startsWith("colors") || path.startsWith("typography")
          ? "Brand"
          : path.startsWith("effects")
            ? "Effects"
            : path.startsWith("motion")
              ? "Motion"
              : "Layout",
  };
}
