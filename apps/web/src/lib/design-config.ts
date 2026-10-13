import {
  designPages,
  designRegions,
  regionSupports,
  type DesignPageId,
  type DesignRegionId,
} from "./design-registry.ts";
// Canonical approved values; kept in parity with the backend Pydantic defaults.
export const defaultDesign = {
  colors: {
    brand: "#00a82d",
    sale: "#ff0000",
    dark: {
      background: "#080808",
      surface: "#111111",
      raised: "#161616",
      text: "#f5f5f5",
      muted: "#a3a3a3",
      border: "#ffffff",
      border_opacity: 0.08,
    },
    light: {
      background: "#f7f8f5",
      surface: "#ffffff",
      raised: "#f1f3ef",
      text: "#181818",
      muted: "#646b65",
      border: "#e3e6e1",
      border_opacity: 1,
    },
  },
  typography: { heading_scale: 1, body_scale: 1 },
  layout: { content_width: 1320, page_padding: 32, section_spacing: 72 },
  radius: { button: 12, card: 18, panel: 24 },
  effects: {
    glass_blur: 14,
    glass_opacity: 0.78,
    glow_intensity: 1,
    shadow_intensity: 1,
    watermark_opacity: 0.09,
  },
  motion: { intensity: 1, hover_lift: 0, duration_scale: 1 },
};
export type DesignTokens = typeof defaultDesign;
export type DesignOverrides = Record<string, string | number>;
export type DesignConfig = DesignTokens & {
  pages?: Partial<Record<DesignPageId, DesignOverrides>>;
  sections?: Partial<Record<DesignRegionId, DesignOverrides>>;
};
export const tokenRanges: Record<string, [number, number, number]> = {
  "colors.dark.border_opacity": [0.04, 1, 0.01],
  "colors.light.border_opacity": [0.04, 1, 0.01],
  "typography.heading_scale": [0.85, 1.2, 0.01],
  "typography.body_scale": [0.85, 1.2, 0.01],
  "layout.content_width": [960, 1600, 10],
  "layout.page_padding": [20, 64, 1],
  "layout.section_spacing": [40, 96, 1],
  "radius.button": [4, 24, 1],
  "radius.card": [8, 32, 1],
  "radius.panel": [12, 40, 1],
  "effects.glass_blur": [0, 20, 1],
  "effects.glass_opacity": [0.6, 1, 0.01],
  "effects.glow_intensity": [0, 1.25, 0.05],
  "effects.shadow_intensity": [0, 1.25, 0.05],
  "effects.watermark_opacity": [0, 0.12, 0.01],
  "motion.intensity": [0, 1, 0.05],
  "motion.hover_lift": [0, 5, 0.1],
  "motion.duration_scale": [0.7, 1.3, 0.05],
};
export function designEntries(
  config: DesignConfig,
): [string, string | number][] {
  const result: [string, string | number][] = [];
  function visit(value: object, prefix = "") {
    for (const [key, item] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof item === "object") visit(item, path);
      else result.push([path, item]);
    }
  }
  visit(
    Object.fromEntries(
      Object.keys(defaultDesign).map((key) => [
        key,
        config[key as keyof DesignTokens],
      ]),
    ),
  );
  return result;
}
export function validDesign(value: unknown): value is DesignConfig {
  function match(actual: unknown, expected: unknown, path = ""): boolean {
    if (typeof expected === "object" && expected !== null) {
      if (!actual || typeof actual !== "object" || Array.isArray(actual))
        return false;
      const a = actual as Record<string, unknown>;
      return (
        Object.keys(a).length === Object.keys(expected).length &&
        Object.entries(expected).every(([key, v]) =>
          match(a[key], v, path ? `${path}.${key}` : key),
        )
      );
    }
    if (typeof expected === "string")
      return typeof actual === "string" && /^#[0-9a-fA-F]{6}$/.test(actual);
    const range = tokenRanges[path];
    return (
      typeof actual === "number" &&
      Number.isFinite(actual) &&
      !!range &&
      actual >= range[0] &&
      actual <= range[1] &&
      ((range[2] !== 1 && path !== "layout.content_width") ||
        Number.isInteger(actual))
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (
    Object.keys(data).some(
      (key) =>
        !Object.hasOwn(defaultDesign, key) &&
        key !== "pages" &&
        key !== "sections",
    )
  )
    return false;
  const base = Object.fromEntries(
    Object.keys(defaultDesign).map((key) => [key, data[key]]),
  );
  if (!match(base, defaultDesign)) return false;
  for (const kind of ["pages", "sections"] as const) {
    const scopes = data[kind];
    if (scopes === undefined) continue;
    if (!scopes || typeof scopes !== "object" || Array.isArray(scopes))
      return false;
    for (const [id, overrides] of Object.entries(scopes)) {
      if (
        !Object.hasOwn(kind === "pages" ? designPages : designRegions, id) ||
        !overrides ||
        typeof overrides !== "object" ||
        Array.isArray(overrides)
      )
        return false;
      for (const [token, v] of Object.entries(overrides)) {
        const entry = designEntries(defaultDesign).find(
          ([key]) => key === token,
        );
        if (
          !entry ||
          (kind === "sections" && !regionSupports(id, token)) ||
          !match(v, entry[1], token)
        )
          return false;
      }
    }
  }
  return true;
}
export function setDesignToken(
  config: DesignConfig,
  path: string,
  value: string | number,
): DesignConfig {
  if (!designEntries(defaultDesign).some(([key]) => key === path))
    throw new Error("Unknown design token");
  const copy = structuredClone(config);
  const parts = path.split(".");
  let target = copy as unknown as Record<string, unknown>;
  for (const key of parts.slice(0, -1))
    target = target[key] as Record<string, unknown>;
  target[parts.at(-1)!] = value;
  return copy;
}

// Emit only changed tokens: the default emits nothing, preserving every legacy breakpoint.
export function designVariables(
  config: DesignConfig,
  theme: "dark" | "light",
  complete = false,
): Record<string, string> {
  if (!validDesign(config)) return {};
  const vars: Record<string, string> = {};
  const add = (
    key: string,
    value: number | string,
    original: number | string,
    suffix = "",
  ) => {
    if (complete || value !== original) vars[key] = `${value}${suffix}`;
  };
  add("--paykar-green", config.colors.brand, defaultDesign.colors.brand);
  add("--sale-color", config.colors.sale, defaultDesign.colors.sale);
  const palette = config.colors[theme],
    defaults = defaultDesign.colors[theme];
  if (
    complete ||
    palette.border !== defaults.border ||
    palette.border_opacity !== defaults.border_opacity
  )
    vars["--line"] =
      `color-mix(in srgb, ${palette.border} ${palette.border_opacity * 100}%, transparent)`;
  for (const [key, css] of Object.entries({
    background: "--page-surface",
    surface: "--surface",
    raised: "--elevated-surface",
    text: "--ink",
    muted: "--muted",
  }))
    add(
      css,
      palette[key as keyof typeof palette],
      defaults[key as keyof typeof defaults],
    );
  add(
    "--page-max-width",
    config.layout.content_width,
    defaultDesign.layout.content_width,
    "px",
  );
  add(
    "--page-gutter",
    config.layout.page_padding,
    defaultDesign.layout.page_padding,
    "px",
  );
  add(
    "--section-gap",
    config.layout.section_spacing,
    defaultDesign.layout.section_spacing,
    "px",
  );
  for (const [field, css] of [
    ["button", "--radius-control"],
    ["card", "--radius"],
    ["panel", "--radius-lg"],
  ] as const)
    add(css, config.radius[field], defaultDesign.radius[field], "px");
  add("--radius-xl", config.radius.panel, 24, "px");
  add("--design-panel-radius", config.radius.panel, 24, "px");
  add("--design-card-radius", config.radius.card, 18, "px");
  add("--shopping-card-radius", config.radius.card, 18, "px");
  add("--shopping-control-radius", config.radius.button, 12, "px");
  add("--shopping-panel-radius", config.radius.panel, 24, "px");
  if (
    complete ||
    config.effects.glass_opacity !== defaultDesign.effects.glass_opacity
  )
    vars["--glass"] =
      `color-mix(in srgb, var(--surface) ${config.effects.glass_opacity * 100}%, transparent)`;
  if (complete || config.effects.glow_intensity !== 1)
    vars["--green-glow"] =
      `color-mix(in srgb, var(--paykar-green) ${(theme === "dark" ? 42 : 30) * config.effects.glow_intensity}%, transparent)`;
  add("--design-glass-blur", config.effects.glass_blur, 14, "px");
  if (complete || config.effects.watermark_opacity !== 0.09)
    vars["--design-watermark-opacity"] =
      `${config.effects.watermark_opacity * (theme === "light" ? 0.5 : 1)}`;
  if (complete || config.effects.shadow_intensity !== 1)
    vars["--card-shadow"] =
      `0 8px 24px rgb(0 0 0 / ${config.effects.shadow_intensity * (theme === "dark" ? 24 : 8)}%)`;
  if (complete || config.motion.duration_scale !== 1)
    for (const [i, duration] of [140, 220, 360, 620].entries())
      vars[`--dur-${i + 1}`] = `${duration * config.motion.duration_scale}ms`;
  if (
    complete ||
    config.motion.intensity !== 1 ||
    config.motion.hover_lift !== 0
  )
    vars["--design-hover-translate"] =
      config.motion.intensity === 0
        ? "none"
        : `0 -${config.motion.hover_lift * config.motion.intensity}px`;
  if (complete || config.motion.intensity !== 1)
    vars["--design-image-scale"] = `${1 + 0.02 * config.motion.intensity}`;
  add("--design-body-size", 16 * config.typography.body_scale, 16, "px");
  add("--design-heading-scale", config.typography.heading_scale, 1);
  add("--shopping-page-title", 40 * config.typography.heading_scale, 40, "px");
  add(
    "--shopping-section-title",
    28 * config.typography.heading_scale,
    28,
    "px",
  );
  return vars;
}
export function publishedDesignCss(config: DesignConfig): string {
  if (!validDesign(config)) return "";
  const render = (values: Record<string, string>) =>
    Object.entries(values)
      .map(([key, value]) => `${key}:${value}`)
      .join(";");
  const dark = render(designVariables(config, "dark")),
    light = render(designVariables(config, "light"));
  let css =
    dark || light ? `:root{${dark}}:root[data-theme="light"]{${light}}` : "";
  if (config.layout.page_padding !== 32)
    css += `@media(max-width:1100px){:root{--page-gutter:${Math.min(config.layout.page_padding, 24)}px}}@media(max-width:640px){:root{--page-gutter:${Math.min(config.layout.page_padding, 16)}px}}`;
  if (config.layout.section_spacing !== 72)
    css += `@media(max-width:1100px){:root{--section-gap:${Math.min(config.layout.section_spacing, 60)}px}}@media(max-width:640px){:root{--section-gap:${Math.min(config.layout.section_spacing, 48)}px}}`;
  if (config.typography.heading_scale !== 1)
    css += `@media(max-width:640px){:root{--shopping-page-title:${28 * config.typography.heading_scale}px;--shopping-section-title:${24 * config.typography.heading_scale}px}}`;
  return css + scopedDesignCss(config);
}

export type DesignScope =
  | { kind: "global" }
  | { kind: "page"; id: DesignPageId }
  | { kind: "section"; id: DesignRegionId };
export function resolveDesign(
  config: DesignConfig,
  page?: DesignPageId | null,
  region?: DesignRegionId,
): DesignConfig {
  let resolved = structuredClone(config);
  for (const tokens of [
    page ? config.pages?.[page] : undefined,
    region ? config.sections?.[region] : undefined,
  ])
    for (const [path, value] of Object.entries(tokens || {}))
      resolved = setDesignToken(resolved, path, value);
  return resolved;
}
export function setScopedToken(
  config: DesignConfig,
  scope: DesignScope,
  path: string,
  value: string | number,
): DesignConfig {
  if (scope.kind === "global") return setDesignToken(config, path, value);
  if (scope.kind === "section" && !regionSupports(scope.id, path))
    throw new Error("Unsupported section control");
  if (scope.kind === "page" && !Object.hasOwn(designPages, scope.id))
    throw new Error("Unknown page");
  if (!designEntries(defaultDesign).some(([key]) => key === path))
    throw new Error("Unknown token");
  const copy = structuredClone(config);
  const kind = scope.kind === "page" ? "pages" : "sections";
  const scopes = (copy[kind] || {}) as Record<string, DesignOverrides>;
  scopes[scope.id] = { ...scopes[scope.id], [path]: value };
  Object.assign(copy, { [kind]: scopes });
  return copy;
}
export function resetDesignScope(
  config: DesignConfig,
  scope: DesignScope,
): DesignConfig {
  if (scope.kind === "global")
    return {
      ...structuredClone(defaultDesign),
      pages: config.pages,
      sections: config.sections,
    };
  const copy = structuredClone(config);
  const kind = scope.kind === "page" ? "pages" : "sections";
  if (copy[kind])
    delete (copy[kind] as Record<string, DesignOverrides>)[scope.id];
  return copy;
}
export function scopedDesignCss(config: DesignConfig): string {
  if (!validDesign(config)) return "";
  let css = "";
  const render = (
    selector: string,
    effective: DesignConfig,
    parent: DesignConfig,
  ) => {
    for (const theme of ["dark", "light"] as const) {
      const current = designVariables(effective, theme, true),
        inherited = designVariables(parent, theme, true);
      const vars = Object.entries(current).filter(
        ([key, v]) => v !== inherited[key],
      );
      if (!vars.length) continue;
      const prefix = theme === "light" ? ':root[data-theme="light"] ' : "";
      css += `${prefix}${selector}{${vars.map(([k, v]) => `${k}:${v}`).join(";")}}`;
      const responsive = (max: number, values: Record<string, string>) => {
        const entries = Object.entries(values).filter(([key]) =>
          vars.some(([k]) => k === key),
        );
        if (entries.length)
          css += `@media(max-width:${max}px){${prefix}${selector}{${entries.map(([k, v]) => `${k}:${v}`).join(";")}}}`;
      };
      responsive(1100, {
        "--page-gutter": `${Math.min(effective.layout.page_padding, 24)}px`,
        "--section-gap": `${Math.min(effective.layout.section_spacing, 60)}px`,
      });
      responsive(640, {
        "--page-gutter": `${Math.min(effective.layout.page_padding, 16)}px`,
        "--section-gap": `${Math.min(effective.layout.section_spacing, 48)}px`,
        "--shopping-page-title": `${28 * effective.typography.heading_scale}px`,
        "--shopping-section-title": `${24 * effective.typography.heading_scale}px`,
      });
    }
  };
  for (const page of Object.keys(config.pages || {}) as DesignPageId[])
    render(`[data-design-page="${page}"]`, resolveDesign(config, page), config);
  for (const region of Object.keys(config.sections || {}) as DesignRegionId[]) {
    const page = designRegions[region].page;
    render(
      `[data-design-page="${page}"] [data-design-region="${region}"]`,
      resolveDesign(config, page, region),
      resolveDesign(config, page),
    );
  }
  return css;
}
export function designEditState(
  config: DesignConfig,
  saved: DesignConfig,
  savedId: number | null,
): "unsaved" | "draft" | "published" {
  return JSON.stringify(config) !== JSON.stringify(saved)
    ? "unsaved"
    : savedId
      ? "draft"
      : "published";
}
