"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { usePresentation } from "@/context/presentation";
import { Brand } from "@/components/brand";
import {
  primaryNavigation,
  navigationGroups,
  isNavigationActive,
} from "@/lib/navigation";
import { CatalogMegaMenu } from "./catalog-mega-menu";
import { LanguageSelector, Preferences } from "./preferences";

export function MainNavigation() {
  const { t, language } = usePresentation();
  const path = usePathname();
  const row = useRef<HTMLDivElement>(null);
  // Labels differ in length by language, so links that do not fit are hidden
  // from the end rather than at fixed widths. The menu button lists them all.
  useLayoutEffect(() => {
    const node = row.current;
    if (!node) return;
    const fit = () => {
      const items = Array.from(node.children) as HTMLElement[];
      for (const item of items) delete item.dataset.overflow;
      for (
        let index = items.length - 1;
        index > 0 && node.scrollWidth > node.clientWidth + 1;
        index -= 1
      )
        items[index].dataset.overflow = "true";
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    document.fonts.ready.then(fit);
    return () => observer.disconnect();
  }, [language]);
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    path: string;
  } | null>(null);
  const closeCatalog = useCallback(() => {
    setActiveMenu((current) => (current?.id === "catalog" ? null : current));
  }, []);
  return (
    <nav
      className="container main-navigation"
      aria-label={t("Основная навигация")}
    >
      <div className="nav-row" ref={row}>
        <CatalogMegaMenu
          open={activeMenu?.id === "catalog" && activeMenu.path === path}
          onOpen={() => setActiveMenu({ id: "catalog", path })}
          onClose={closeCatalog}
        />
        {primaryNavigation.slice(1).map((item) => (
          <Link
            key={item.id}
            className="info-nav-link"
            href={item.href}
            aria-current={isNavigationActive(item, path) ? "page" : undefined}
          >
            {t(item.label)}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function BurgerMenu() {
  const { t } = usePresentation();
  const path = usePathname();
  const reduce = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const headingId = useId();
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="burger-button"
        aria-label={t(open ? "Закрыть меню" : "Открыть меню")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <span className="header-control-icon" aria-hidden="true">
          <AnimatePresence initial={false}>
            <m.span
              key={open ? "close" : "menu"}
              initial={reduce ? false : { opacity: 0, rotate: -8 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: reduce ? 0 : 8 }}
              transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </m.span>
          </AnimatePresence>
        </span>
      </button>
      <dialog
        ref={dialog}
        id={dialogId}
        className="navigation-drawer"
        aria-labelledby={headingId}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            close();
            return;
          }
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            close();
        }}
      >
        <div className="drawer-heading">
          <Brand />
          <h2 id={headingId} className="sr-only">
            {t("Меню")}
          </h2>
          <button
            type="button"
            autoFocus
            onClick={close}
            aria-label={t("Закрыть меню")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={t("Навигация меню")}>
          <div className="drawer-utilities">
            <LanguageSelector />
            <Preferences />
          </div>
          {navigationGroups.map((group) => (
            <section
              className="drawer-group"
              key={group.title}
              aria-label={t(group.title)}
            >
              <h3>{t(group.title)}</h3>
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={close}
                  aria-current={
                    isNavigationActive(item, path) ? "page" : undefined
                  }
                >
                  <item.icon size={18} aria-hidden="true" />
                  <span>{t(item.label)}</span>
                </Link>
              ))}
            </section>
          ))}
        </nav>
      </dialog>
    </>
  );
}
