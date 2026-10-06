"use client";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { usePresentation, type Language } from "@/context/presentation";

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

// Where supported, the new theme grows out of the pressed button. The
// attribute is set inside the transition so its snapshot is already themed;
// the provider's own effect then finds nothing left to change.
function revealTheme(
  value: "dark" | "light",
  x: number,
  y: number,
  apply: () => void,
) {
  const root = document.documentElement;
  if (
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.dataset.themeSwitch = "true";
  const transition = document.startViewTransition(() => {
    flushSync(apply);
    root.dataset.theme = value;
  });
  const finish = () => {
    delete root.dataset.themeSwitch;
  };
  // A second click can skip the first transition; that rejection is expected.
  void transition.finished.then(finish, finish);
}

export function Preferences() {
  const { theme, setTheme, t } = usePresentation();
  const osTheme = useSyncExternalStore(
    subscribeSystemTheme,
    systemTheme,
    () => "dark",
  );
  const activeTheme = theme === "system" ? osTheme : theme;
  const themes: {
    value: "dark" | "light";
    label: string;
    icon: typeof Moon;
  }[] = [
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
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              if (value === activeTheme) setTheme(value);
              else
                revealTheme(
                  value,
                  box.left + box.width / 2,
                  box.top + box.height / 2,
                  () => setTheme(value),
                );
            }}
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
