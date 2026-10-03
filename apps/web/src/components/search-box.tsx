"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { ProductPage, useResource } from "@/lib/api";
import { cents } from "@/lib/format";
import { ProductImage } from "./product-card";
export function SearchBox() {
  const { t, money } = usePresentation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const visible = open && query.trim().length >= 2;
  const settled = term === query.trim();
  const resource = useResource<ProductPage>(
    visible && settled
      ? `/products?q=${encodeURIComponent(term)}&page_size=6`
      : null,
  );
  const items = settled ? (resource.data?.items ?? []) : [];
  return (
    <form
      action="/catalog"
      className="search-box"
      role="search"
      onSubmit={(event) => {
        if (visible && active >= 0 && items[active]) {
          event.preventDefault();
          router.push(`/product/${items[active].slug}`);
        }
        setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        {t("Поиск товаров")}
      </label>
      <input
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
      {query && (
        <button
          type="button"
          aria-label={t("Очистить поиск")}
          onClick={() => {
            setQuery("");
            setActive(-1);
            document.getElementById("site-search")?.focus();
          }}
        >
          <X size={18} />
        </button>
      )}
      <button type="submit" aria-label={t("Искать")}>
        <Search size={21} />
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
                <ProductImage product={product} />
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
            href={`/catalog?q=${encodeURIComponent(query.trim())}`}
            onClick={() => setOpen(false)}
          >
            {t("Все результаты →")}
          </Link>
        </div>
      )}
    </form>
  );
}
