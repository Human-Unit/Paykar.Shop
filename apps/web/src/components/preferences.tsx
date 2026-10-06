"use client";
import { Check, ChevronDown, Moon, Sun } from "lucide-react";
import {
  AnimatePresence,
  m,
  useIsPresent,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { usePresentation, type Language } from "@/context/presentation";

export function Preferences() {
  const { theme, setTheme, t } = usePresentation();
  const reduce = useReducedMotion();
  const next = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? Sun : Moon;
  const label = t(
    next === "dark"
      ? "Переключить на тёмную тему"
      : "Переключить на светлую тему",
  );
  return (
    <button
      type="button"
      className="header-preference-button theme-button"
      data-theme-preference={theme}
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
    >
      <span className="header-control-icon" aria-hidden="true">
        <AnimatePresence initial={false}>
          <m.span
            key={theme}
            initial={reduce ? false : { opacity: 0, scale: 0.9, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{
              opacity: 0,
              scale: reduce ? 1 : 0.9,
              rotate: reduce ? 0 : 8,
            }}
            transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
          >
            <Icon size={18} />
          </m.span>
        </AnimatePresence>
      </span>
    </button>
  );
}

const languages: { value: Language; name: string; lang: string }[] = [
  { value: "ru", name: "Русский", lang: "ru" },
  { value: "tj", name: "Тоҷикӣ", lang: "tg" },
  { value: "en", name: "English", lang: "en" },
];

function LanguageMenu({
  id,
  triggerId,
  children,
}: {
  id: string;
  triggerId: string;
  children: React.ReactNode;
}) {
  const present = useIsPresent();
  const reduce = useReducedMotion();
  return (
    <m.div
      className="header-language-menu"
      id={id}
      role="menu"
      aria-labelledby={triggerId}
      aria-hidden={!present}
      inert={!present}
      initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduce ? 0 : -4, scale: reduce ? 1 : 0.98 }}
      transition={{ duration: reduce ? 0 : 0.16, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}

export function LanguageSelector() {
  const { language, setLanguage, t } = usePresentation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const triggerId = useId();
  const label = `${t("Язык интерфейса")}: ${language.toUpperCase()}`;
  const close = (returnFocus = false) => {
    setOpen(false);
    if (returnFocus) trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open)
      options.current[
        languages.findIndex((entry) => entry.value === language)
      ]?.focus();
  }, [open, language]);
  return (
    <div
      className="header-language"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        className="header-preference-button language-button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {language.toUpperCase()}
        <ChevronDown size={12} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <LanguageMenu key="language-menu" id={menuId} triggerId={triggerId}>
            {languages.map(({ value, name, lang }, index) => (
              <button
                key={value}
                ref={(node) => {
                  options.current[index] = node;
                }}
                type="button"
                role="menuitemradio"
                tabIndex={-1}
                lang={lang}
                aria-label={name}
                aria-checked={language === value}
                onClick={() => {
                  setLanguage(value);
                  close(true);
                }}
                onKeyDown={(event) => {
                  const target =
                    event.key === "ArrowDown"
                      ? (index + 1) % languages.length
                      : event.key === "ArrowUp"
                        ? (index + languages.length - 1) % languages.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? languages.length - 1
                            : null;
                  if (target !== null) {
                    event.preventDefault();
                    options.current[target]?.focus();
                  }
                }}
              >
                <span>{value.toUpperCase()}</span>
                <span className="language-name">{name}</span>
                {language === value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
          </LanguageMenu>
        )}
      </AnimatePresence>
    </div>
  );
}
