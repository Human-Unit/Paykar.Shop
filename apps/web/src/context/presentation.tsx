"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import translations from "@/lib/translations.json";
import {
  money as russianMoney,
  distance as russianDistance,
  duration as russianDuration,
} from "@/lib/format";

export type Language = "ru" | "tj" | "en";
export type Theme = "dark" | "light" | "system";
type Preferences = { language: Language; theme: Theme };
const defaults: Preferences = { language: "ru", theme: "dark" };
const storageKey = "paykar-presentation-v1";
const changed = "paykar-presentation-change";
let fallback = JSON.stringify(defaults);
function snapshot() {
  try {
    return localStorage.getItem(storageKey) || fallback;
  } catch {
    return fallback;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changed, callback);
  };
}
function parse(raw: string): Preferences {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || !value) return defaults;
    const candidate = value as Record<string, unknown>;
    return {
      language:
        candidate.language === "en" || candidate.language === "tj"
          ? candidate.language
          : "ru",
      theme:
        candidate.theme === "light" || candidate.theme === "system"
          ? candidate.theme
          : "dark",
    };
  } catch {
    return defaults;
  }
}
type Presentation = Preferences & {
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  t: (source: string | undefined) => string;
  money: (value: number) => string;
  distance: (meters: number) => string;
  duration: (seconds: number) => string;
  locale: string;
};
const Context = createContext<Presentation | null>(null);
const dictionary: Record<string, readonly string[]> = translations;
export function PresentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, snapshot, () =>
    JSON.stringify(defaults),
  );
  const preferences = parse(raw);
  const { language, theme } = preferences;
  const t = useCallback(
    (source: string | undefined) => {
      if (!source) return "";
      if (language === "ru") return source;
      const key = source.trim();
      const stockMessage =
        /^Недостаточно товара «(.+)»\. Измените количество в корзине\.$/.exec(
          key,
        );
      if (stockMessage) {
        const index = language === "tj" ? 0 : 1;
        return (
          dictionary["Недостаточно товара «"][index] +
          (dictionary[stockMessage[1]]?.[index] || stockMessage[1]) +
          dictionary["». Измените количество в корзине."][index]
        );
      }
      const translated = dictionary[key]?.[language === "tj" ? 0 : 1];
      return translated ? source.replace(key, translated) : source;
    },
    [language],
  );
  const locale =
    language === "tj" ? "tg-TJ" : language === "en" ? "en-US" : "ru-RU";
  function save(next: Preferences) {
    fallback = JSON.stringify(next);
    try {
      localStorage.setItem(storageKey, fallback);
    } catch {
      /* Preferences still work for this tab. */
    }
    window.dispatchEvent(new Event(changed));
  }
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = language === "tj" ? "tg" : language;
  }, [language, t]);
  const value: Presentation = {
    ...preferences,
    t,
    locale,
    setLanguage: (next) => save({ ...preferences, language: next }),
    setTheme: (next) => save({ ...preferences, theme: next }),
    money: (value) =>
      language === "ru"
        ? russianMoney(value)
        : `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)} ${language === "tj" ? "сом." : "TJS"}`,
    distance: (meters) =>
      language === "ru"
        ? russianDistance(meters)
        : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(meters < 1000 ? meters : meters / 1000)} ${t(meters < 1000 ? "м" : "км")}`,
    duration: (seconds) => {
      if (language === "ru") return russianDuration(seconds);
      const minutes = Math.ceil(seconds / 60);
      return minutes < 60
        ? `${minutes} ${t("мин")}`
        : `${Math.floor(minutes / 60)} ${t("ч")}${minutes % 60 ? ` ${minutes % 60} ${t("мин")}` : ""}`;
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePresentation() {
  const value = useContext(Context);
  if (!value) throw new Error("PresentationProvider is required");
  return value;
}
