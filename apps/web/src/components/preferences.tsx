"use client";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  usePresentation,
  type Language,
  type Theme,
} from "@/context/presentation";

function subscribeSystemTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function Preferences() {
  const { theme, setTheme, t } = usePresentation();
  const osTheme = useSyncExternalStore(
    subscribeSystemTheme,
    systemTheme,
    () => "dark",
  );
  const activeTheme = theme === "system" ? osTheme : theme;
  const themes: { value: Theme; label: string; icon: typeof Moon }[] = [
    { value: "dark", label: t("Тёмная тема"), icon: Moon },
    { value: "light", label: t("Светлая тема"), icon: Sun },
  ];
  return (
    <div className="preferences">
      <div
        className="theme-toggle"
        role="group"
        aria-label={t("Тема оформления")}
      >
        <span
          className="preference-thumb"
          aria-hidden="true"
          style={{
            transform: `translateX(${themes.findIndex((option) => option.value === activeTheme) * 100}%)`,
          }}
        />
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={activeTheme === value}
            onClick={() => setTheme(value)}
          >
            <Icon size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LanguageSelector() {
  const { language, setLanguage, t } = usePresentation();
  return (
    <div className="preferences">
      <div
        className="language-toggle"
        role="group"
        aria-label={t("Язык интерфейса")}
      >
        <span
          className="preference-thumb"
          aria-hidden="true"
          style={{
            transform: `translateX(${["ru", "tj", "en"].indexOf(language) * 100}%)`,
          }}
        />
        {(["ru", "tj", "en"] as Language[]).map((value) => (
          <button
            key={value}
            type="button"
            lang={value === "tj" ? "tg" : value}
            aria-label={{ ru: "Русский", tj: "Тоҷикӣ", en: "English" }[value]}
            aria-pressed={language === value}
            onClick={() => setLanguage(value)}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
