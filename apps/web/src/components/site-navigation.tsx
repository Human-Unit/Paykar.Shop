"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown, Grid2X2, Menu, X, ShoppingBag } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { usePresentation } from "@/context/presentation";
import { Brand } from "@/components/brand";
import { informationNavigation, type InformationEntry } from "@/lib/navigation";
import { CatalogMegaMenu } from "./catalog-mega-menu";
import { LanguageSelector, Preferences } from "./preferences";

function InformationContent({ content }: { content: string[] }) {
  const { t } = usePresentation();
  return content.length > 1 ? (
    <ol className="info-steps">
      {content.map((line) => (
        <li key={line}>{t(line)}</li>
      ))}
    </ol>
  ) : (
    <p>{t(content[0])}</p>
  );
}

function InfoNavMenu({
  label,
  content,
  href,
  open,
  onOpen,
  onClose,
  current,
}: InformationEntry & {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  current: boolean;
}) {
  const { t } = usePresentation();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        onClose();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, onClose]);
  return (
    <div
      ref={root}
      className="info-nav-item"
      data-open={open}
      onMouseEnter={onOpen}
      onMouseLeave={() => {
        if (!root.current?.contains(document.activeElement)) onClose();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          trigger.current?.focus();
        }
      }}
    >
      <Link
        href={href}
        ref={trigger}
        className="info-nav-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={current ? "page" : undefined}
        onFocus={onOpen}
        onClick={onClose}
      >
        {t(label)} <ChevronDown size={12} aria-hidden="true" />
      </Link>
      <div
        id={panelId}
        className="info-nav-panel"
        hidden={!open}
        aria-hidden={!open}
        inert={!open}
      >
        <strong>{t(label)}</strong>
        <InformationContent content={content} />
      </div>
    </div>
  );
}

export function MainNavigation() {
  const { t, language } = usePresentation();
  const path = usePathname();
  const row = useRef<HTMLDivElement>(null);
  // Labels differ in length by language, so links that do not fit are hidden
  // from the end rather than at fixed widths. The menu button lists them all.
  // Items in the right half open their panel leftwards to stay on screen.
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
      for (const item of items)
        item.dataset.align =
          item.offsetLeft + item.offsetWidth / 2 > node.clientWidth / 2
            ? "end"
            : "start";
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
        {informationNavigation
          .filter((item) => item.desktop !== false || item.id === "stores")
          .map((item) =>
            item.content.length ? (
              <InfoNavMenu
                key={item.id}
                {...item}
                current={path === item.href || path.startsWith(`${item.href}/`)}
                open={activeMenu?.id === item.id && activeMenu.path === path}
                onOpen={() => setActiveMenu({ id: item.id, path })}
                onClose={() =>
                  setActiveMenu((current) =>
                    current?.id === item.id ? null : current,
                  )
                }
              />
            ) : (
              <Link
                key={item.id}
                className="info-nav-link"
                href={item.href}
                aria-current={path === item.href ? "page" : undefined}
              >
                {t(item.label)}
              </Link>
            ),
          )}
      </div>
    </nav>
  );
}

export function BurgerMenu() {
  const { t } = usePresentation();
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
          <Link href="/my-shopping" onClick={close}>
            <ShoppingBag size={18} aria-hidden="true" />
            <span>{t("Мои покупки")}</span>
          </Link>
          <Link href="/catalog" prefetch={false} onClick={close}>
            <Grid2X2 size={18} aria-hidden="true" />
            <span>{t("Каталог")}</span>
          </Link>
          {informationNavigation.map((item) => (
            <Link key={item.id} href={item.href} onClick={close}>
              <item.icon size={18} aria-hidden="true" />
              <span>{t(item.label)}</span>
            </Link>
          ))}
        </nav>
      </dialog>
    </>
  );
}
