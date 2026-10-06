"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Grid2X2, Menu, X } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Brand } from "@/components/brand";
import { LanguageSelector, Preferences } from "@/components/preferences";
import { informationNavigation, type InformationEntry } from "@/lib/navigation";
import { CatalogMegaMenu } from "./catalog-mega-menu";

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
  const { t } = usePresentation();
  const path = usePathname();
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
      <div className="nav-row">
        <CatalogMegaMenu
          open={activeMenu?.id === "catalog" && activeMenu.path === path}
          onOpen={() => setActiveMenu({ id: "catalog", path })}
          onClose={closeCatalog}
        />
        {informationNavigation
          .filter((item) => item.id === "delivery" || item.id === "stores")
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
        aria-label={t("Открыть меню")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu size={20} aria-hidden="true" />
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
        <div className="drawer-language">
          <p>{t("Язык интерфейса")}</p>
          <LanguageSelector />
        </div>
        <div className="drawer-language">
          <p>{t("Тема оформления")}</p>
          <Preferences />
        </div>
        <nav aria-label={t("Навигация меню")}>
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
