"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ProductPage, useResource } from "@/lib/api";
import { cents } from "@/lib/format";
import { ProductImage } from "./product-card";
import { SearchPlaceholder } from "./search-placeholder";
import {
  catalogApiQuery,
  catalogHref,
  catalogParameters,
} from "@/lib/catalog-query";
export function SearchBox() {
  const { t, money } = usePresentation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const catalogState = pathname.startsWith("/catalog")
    ? catalogParameters(
        new URLSearchParams(searchParams.toString()),
        pathname.startsWith("/catalog/") ? pathname.slice(9) : undefined,
      )
    : new URLSearchParams();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  // "/" jumps to search from anywhere outside a text field.
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey)
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      )
        return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);
  const visible = open && query.trim().length >= 2;
  const settled = term === query.trim();
  const suggestionQuery = new URLSearchParams(catalogState);
  suggestionQuery.set("q", term);
  suggestionQuery.delete("page");
  const allResultsHref = catalogHref(catalogState, { q: query.trim() });
  const resource = useResource<ProductPage>(
    visible && settled ? catalogApiQuery(suggestionQuery, false, 6) : null,
  );
  const items = settled ? (resource.data?.items ?? []) : [];
  return (
    <form
      action="/catalog"
      className="search-box"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (visible && active >= 0 && items[active]) {
          router.push(`/product/${items[active].slug}`);
        } else router.push(allResultsHref);
        setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setFocused(false);
        }
      }}
      onFocusCapture={() => setFocused(true)}
    >
      <label htmlFor="site-search" className="sr-only">
        {t("Поиск товаров")}
      </label>
      <Search className="search-leading" size={20} aria-hidden="true" />
      <div className="search-input-wrap">
        <input
          ref={input}
          id="site-search"
          name="q"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls="search-suggestions"
          aria-activedescendant={
            visible && items[active]
              ? `suggestion-${items[active].id}`
              : undefined
          }
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t("Найти молоко, хлеб, фрукты…")}
          maxLength={200}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                Math.max(
                  0,
                  Math.min(
                    items.length - 1,
                    index + (event.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
          }}
        />
        {!focused && !query && !visible && <SearchPlaceholder />}
      </div>
      {query ? (
        <button
          type="button"
          className="search-clear"
          aria-label={t("Очистить поиск")}
          onClick={() => {
            setQuery("");
            setActive(-1);
            input.current?.focus();
          }}
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : (
        <kbd className="search-kbd" aria-hidden="true">
          /
        </kbd>
      )}
      <button type="submit" className="search-submit" aria-label={t("Искать")}>
        <Search size={20} aria-hidden="true" />
      </button>
      {visible && (
        <div className="search-dropdown">
          <div
            id="search-suggestions"
            role="listbox"
            aria-label={t("Подсказки поиска")}
          >
            {(!settled || resource.loading) && (
              <p className="search-status" role="status">
                {t("Ищем товары…")}
              </p>
            )}
            {resource.error && (
              <p className="search-status" role="status">
                {t("Подсказки недоступны. Нажмите Enter, чтобы открыть поиск.")}
              </p>
            )}
            {settled &&
              !resource.loading &&
              !resource.error &&
              items.length === 0 && (
                <p className="search-status" role="status">
                  {t("Ничего не найдено. Попробуйте другое название.")}
                </p>
              )}
            {items.map((product, index) => (
              <Link
                key={product.id}
                id={`suggestion-${product.id}`}
                role="option"
                aria-selected={active === index}
                className="search-suggestion"
                href={`/product/${product.slug}`}
                onClick={() => setOpen(false)}
              >
                <span className="thumb">
                  <ProductImage product={product} />
                </span>
                <span>
                  {t(product.name)}
                  <small>
                    {t(product.unit)}
                    {Number(product.stock_quantity) < 1
                      ? t(" · Нет в наличии")
                      : ""}
                  </small>
                </span>
                <strong>{money(cents(product.price))}</strong>
              </Link>
            ))}
          </div>
          <Link
            className="search-all"
            href={allResultsHref}
            onClick={() => setOpen(false)}
          >
            {t("Все результаты →")}
          </Link>
        </div>
      )}
    </form>
  );
}
