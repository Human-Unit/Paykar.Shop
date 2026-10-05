"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronDown, Grid2X2 } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type Category } from "@/lib/api";
import {
  catalogGroupLinks,
  catalogGroups,
  categoryHref,
  categoryImages,
} from "@/lib/category-presentation";
import "./catalog-mega-menu.css";
import { m } from "./motion-primitives";

const desktopQuery = "(min-width: 769px)";
function desktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}
function subscribeDesktop(notify: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function CatalogMegaMenuGroup({
  category,
  subcategories,
  onNavigate,
  visible,
  index,
}: {
  category: Category;
  subcategories: Category[];
  onNavigate: () => void;
  visible: boolean;
  index: number;
}) {
  const { t } = usePresentation();
  const reduceMotion = useReducedMotion();
  const path = usePathname();
  const href = categoryHref(category.slug);
  const active =
    path === href ||
    subcategories.some((child) => path === categoryHref(child.slug));
  const links = catalogGroupLinks(category, subcategories);
  const image = categoryImages[category.slug];
  return (
    <m.li
      className={`catalog-mega-group${active ? " is-active" : ""}`}
      data-reveal
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      transition={{
        duration: reduceMotion ? 0 : 0.13,
        delay: reduceMotion || !visible ? 0 : Math.min(index, 3) * 0.03,
        ease: "easeOut",
      }}
      whileHover={{
        y: reduceMotion ? 0 : -1,
        transition: { duration: reduceMotion ? 0 : 0.12, delay: 0 },
      }}
    >
      <h3>
        <Link
          href={href}
          prefetch={false}
          onClick={onNavigate}
          aria-current={path === href ? "page" : undefined}
          className="catalog-mega-category"
        >
          {image ? (
            <Image
              src={`/images/paykar/${image}.webp`}
              width={52}
              height={52}
              alt=""
              unoptimized
            />
          ) : (
            <span className="catalog-mega-icon">
              <Grid2X2 size={28} aria-hidden="true" />
            </span>
          )}
          <span>{t(category.name)}</span>
        </Link>
      </h3>
      <ul className="catalog-mega-links">
        {links.slice(0, 5).map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              prefetch={false}
              onClick={onNavigate}
              aria-current={
                link.category && path === link.href ? "page" : undefined
              }
            >
              {t(link.label)}
            </Link>
          </li>
        ))}
        {links.length > 5 && (
          <li>
            <Link
              className="catalog-mega-more"
              href={href}
              prefetch={false}
              onClick={onNavigate}
            >
              {t("Смотреть все")} <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </m.li>
  );
}

export function CatalogMegaMenu({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { t } = usePresentation();
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    desktopSnapshot,
    () => false,
  );
  const visible = desktop && open;
  const resource = useResource<Category[]>(desktop ? "/categories" : null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLButtonElement>(null);
  const [backdropPosition, setBackdropPosition] = useState<{
    top: number;
    host: HTMLElement;
  } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const focusFrame = useRef<number | undefined>(undefined);
  const suppressFocus = useRef(false);
  const panelId = useId();

  function cancelPending() {
    clearTimeout(closeTimer.current);
    if (focusFrame.current !== undefined)
      cancelAnimationFrame(focusFrame.current);
  }
  function restoreFocus() {
    suppressFocus.current = true;
    trigger.current?.focus({ preventScroll: true });
    suppressFocus.current = false;
  }
  function close(restore = false) {
    cancelPending();
    onClose();
    if (restore && root.current?.contains(document.activeElement))
      restoreFocus();
  }
  function reveal() {
    clearTimeout(closeTimer.current);
    if (desktopSnapshot() && !suppressFocus.current) onOpen();
  }

  // Measure before paint. Portal to body so the header's glass backdrop does
  // not become the containing block for a viewport-wide fixed overlay.
  useLayoutEffect(() => {
    if (!visible) {
      clearTimeout(closeTimer.current);
      if (focusFrame.current !== undefined)
        cancelAnimationFrame(focusFrame.current);
      if (panel.current?.contains(document.activeElement)) {
        suppressFocus.current = true;
        trigger.current?.focus({ preventScroll: true });
        suppressFocus.current = false;
      }
      return;
    }
    const dismiss = () => {
      clearTimeout(closeTimer.current);
      if (focusFrame.current !== undefined)
        cancelAnimationFrame(focusFrame.current);
      onClose();
      if (panel.current?.contains(document.activeElement)) {
        suppressFocus.current = true;
        trigger.current?.focus({ preventScroll: true });
        suppressFocus.current = false;
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        !backdrop.current?.contains(event.target)
      )
        dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
    };
    const resize = () => {
      if (!desktopSnapshot()) {
        onClose();
        return;
      }
      const bottom =
        root.current?.closest(".main-navigation")?.getBoundingClientRect()
          .bottom ?? 0;
      const height = Math.max(
        0,
        Math.min(window.innerHeight - 24, window.innerHeight - bottom - 24),
      );
      panel.current?.style.setProperty(
        "--catalog-panel-max-height",
        `${height}px`,
      );
      const top = Math.max(0, Math.min(window.innerHeight, bottom));
      setBackdropPosition((current) =>
        current?.top === top && current.host === document.body
          ? current
          : { top, host: document.body },
      );
    };
    let measureFrame: number | undefined;
    const onScroll = () => {
      if (measureFrame !== undefined) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = undefined;
        resize();
      });
    };
    const observer = new ResizeObserver(resize);
    const navigation = root.current?.closest(".main-navigation");
    if (navigation) observer.observe(navigation);
    resize();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      if (measureFrame !== undefined) cancelAnimationFrame(measureFrame);
    };
  }, [visible, onClose]);
  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
      if (focusFrame.current !== undefined)
        cancelAnimationFrame(focusFrame.current);
    },
    [],
  );

  return (
    <>
      {visible &&
        backdropPosition &&
        createPortal(
          <button
            ref={backdrop}
            className="catalog-mega-backdrop"
            type="button"
            tabIndex={-1}
            aria-label={t("Закрыть меню")}
            style={{ top: backdropPosition.top }}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => close(true)}
          />,
          backdropPosition.host,
        )}
      <div
        ref={root}
        className="catalog-menu-root"
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") reveal();
        }}
        onPointerLeave={() => {
          clearTimeout(closeTimer.current);
          closeTimer.current = setTimeout(() => {
            if (!root.current?.contains(document.activeElement)) onClose();
          }, 150);
        }}
        onFocusCapture={() => clearTimeout(closeTimer.current)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && visible) {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }
        }}
      >
        <Link
          ref={trigger}
          href="/catalog"
          prefetch={false}
          className="button catalog-button catalog-mega-trigger"
          aria-expanded={visible}
          aria-controls={panelId}
          onFocus={reveal}
          onClick={() => close()}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" || !desktopSnapshot()) return;
            event.preventDefault();
            reveal();
            focusFrame.current = requestAnimationFrame(() => {
              if (trigger.current?.getAttribute("aria-expanded") === "true")
                panel.current?.querySelector<HTMLAnchorElement>("a")?.focus();
            });
          }}
        >
          <Grid2X2 size={18} aria-hidden="true" />
          <span>{t("Каталог")}</span>
          <ChevronDown
            className="catalog-mega-chevron"
            size={12}
            aria-hidden="true"
          />
        </Link>
        <div
          ref={panel}
          id={panelId}
          className={`catalog-mega-panel${visible ? " is-open" : ""}`}
          inert={!visible}
          aria-hidden={!visible}
        >
          <div className="catalog-mega-heading">
            <h2>{t("Каталог товаров")}</h2>
            <Link href="/catalog" prefetch={false} onClick={() => close(true)}>
              {t("Весь каталог")}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {resource.loading && (
            <p className="catalog-mega-status" role="status">
              {t("Загружаем категории…")}
            </p>
          )}
          {resource.error && (
            <div className="catalog-mega-status" role="status">
              <p>{t("Категории временно недоступны.")}</p>
              <button
                className="text-link"
                type="button"
                onClick={resource.retry}
              >
                {t("Попробовать снова")}
              </button>
            </div>
          )}
          {resource.data && (
            <nav aria-label={t("Категории каталога")}>
              <ul className="catalog-mega-grid">
                {catalogGroups(resource.data).map(
                  ({ category, children }, index) => (
                    <CatalogMegaMenuGroup
                      key={category.id}
                      category={category}
                      subcategories={children}
                      onNavigate={() => close(true)}
                      visible={visible}
                      index={index}
                    />
                  ),
                )}
              </ul>
              {!resource.data.length && (
                <p className="catalog-mega-status">
                  {t("Категории скоро появятся.")}
                </p>
              )}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
