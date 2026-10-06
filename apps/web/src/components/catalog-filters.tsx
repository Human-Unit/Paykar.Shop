"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Category, CatalogFacets, ProductPage, useResource } from "@/lib/api";
import {
  activeFilterCount,
  catalogApiQuery,
  catalogHref,
  descendantCategories,
} from "@/lib/catalog-query";

export function CatalogFilters({
  params,
  categories,
  facets,
}: {
  params: URLSearchParams;
  categories: Category[];
  facets?: CatalogFacets | null;
}) {
  const { t, money } = usePresentation();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // Drafts exist only inside the sheet. Applying creates a new URL/history entry.
  const [draft, setDraft] = useState(() => new URLSearchParams(params));
  const [previewQuery, setPreviewQuery] = useState<string | null>(null);
  const min = draft.get("min_price") || "";
  const max = draft.get("max_price") || "";
  const invalidRange = Boolean(min && max && Number(min) > Number(max));
  const candidate = new URLSearchParams(draft);
  candidate.delete("page");
  const candidateQuery = catalogApiQuery(candidate, false, 1);
  useEffect(() => {
    const timer = setTimeout(
      () => setPreviewQuery(open && !invalidRange ? candidateQuery : null),
      250,
    );
    return () => clearTimeout(timer);
  }, [open, invalidRange, candidateQuery]);
  const preview = useResource<ProductPage>(
    open && !invalidRange ? previewQuery : null,
  );
  const settled = previewQuery === candidateQuery && !preview.loading;
  const total = settled ? preview.data?.total : undefined;
  const subcategories = draft.get("category")
    ? descendantCategories(categories, draft.get("category")!)
    : categories.filter((item) => item.parent_id !== null);
  const scope = new URLSearchParams();
  const scopeChanged = ["q", "category", "subcategory"].some(
    (key) => draft.get(key) !== params.get(key),
  );
  for (const key of ["q", "category", "subcategory"]) {
    if (draft.get(key)) scope.set(key, draft.get(key)!);
  }
  const scopedFacets = useResource<ProductPage>(
    open && scopeChanged ? catalogApiQuery(scope, true, 1) : null,
  );
  const availableFacets = scopeChanged ? scopedFacets.data?.facets : facets;

  function update(values: Record<string, string | null>) {
    setDraft((previous) => {
      const copy = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(values)) {
        if (value) copy.set(key, value);
        else copy.delete(key);
      }
      return copy;
    });
  }

  function close() {
    dialog.current?.close();
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="button secondary catalog-filter-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(new URLSearchParams(params));
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        {t("Фильтры")}
        {activeFilterCount(params) > 0 && (
          <span className="catalog-filter-badge">
            {activeFilterCount(params)}
          </span>
        )}
      </button>
      <dialog
        ref={dialog}
        className="catalog-filter-dialog"
        aria-labelledby="catalog-filter-title"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (invalidRange || total === undefined || preview.error) return;
            close();
            router.push(catalogHref(draft), { scroll: false });
          }}
        >
          <header className="catalog-sheet-heading">
            <div>
              <span className="eyebrow">{t("Каталог")}</span>
              <h2 id="catalog-filter-title">{t("Фильтры")}</h2>
            </div>
            <button
              type="button"
              className="catalog-sheet-close"
              aria-label={t("Закрыть фильтры")}
              onClick={close}
            >
              <X size={22} aria-hidden="true" />
            </button>
          </header>
          <div className="catalog-sheet-body">
            <section className="catalog-filter-group">
              <h3>{t("Категории")}</h3>
              <label>
                {t("Категория")}
                <select
                  name="category"
                  value={draft.get("category") || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    const child = draft.get("subcategory");
                    const valid =
                      !value ||
                      descendantCategories(categories, value).some(
                        (item) => item.slug === child,
                      );
                    update({
                      category: value,
                      ...(valid ? {} : { subcategory: null }),
                    });
                  }}
                >
                  <option value="">{t("Все товары")}</option>
                  {categories.map((item) => (
                    <option value={item.slug} key={item.id}>
                      {item.parent_id !== null ? "— " : ""}
                      {t(item.name)}
                    </option>
                  ))}
                </select>
              </label>
              {(subcategories.length > 0 || draft.has("subcategory")) && (
                <label>
                  {t("Подкатегория")}
                  <select
                    name="subcategory"
                    value={draft.get("subcategory") || ""}
                    onChange={(event) =>
                      update({ subcategory: event.target.value })
                    }
                  >
                    <option value="">{t("Все подкатегории")}</option>
                    {subcategories.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {t(item.name)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>
            <section className="catalog-filter-group">
              <h3>{t("Цена, сомони")}</h3>
              <div className="catalog-price-inputs">
                <label>
                  {t("Цена от")}
                  <input
                    name="min_price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    value={min}
                    placeholder={t("От")}
                    onChange={(event) =>
                      update({ min_price: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t("Цена до")}
                  <input
                    name="max_price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    value={max}
                    placeholder={t("До")}
                    onChange={(event) =>
                      update({ max_price: event.target.value })
                    }
                  />
                </label>
              </div>
              {!!availableFacets?.price_presets.length && (
                <div
                  className="catalog-price-presets"
                  aria-label={t("Быстрые диапазоны цен")}
                >
                  {availableFacets.price_presets.map((preset) => {
                    const label =
                      preset.min_price === null
                        ? `${t("До")} ${money(Number(preset.max_price) * 100)}`
                        : preset.max_price === null
                          ? `${t("От")} ${money(Number(preset.min_price) * 100)}`
                          : `${money(Number(preset.min_price) * 100)} – ${money(Number(preset.max_price) * 100)}`;
                    return (
                      <button
                        type="button"
                        key={`${preset.min_price}:${preset.max_price}`}
                        aria-pressed={
                          min === (preset.min_price || "") &&
                          max === (preset.max_price || "")
                        }
                        onClick={() => update(preset)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              {invalidRange && (
                <p className="catalog-filter-error" role="alert">
                  {t("Минимальная цена не должна превышать максимальную.")}
                </p>
              )}
            </section>
            <section className="catalog-filter-group">
              <h3>{t("Наличие и скидки")}</h3>
              <label className="catalog-sheet-check">
                <input
                  name="in_stock"
                  type="checkbox"
                  checked={draft.get("in_stock") === "true"}
                  onChange={(event) =>
                    update({ in_stock: event.target.checked ? "true" : null })
                  }
                />
                {t("Только в наличии")}
              </label>
              <label className="catalog-sheet-check">
                <input
                  name="on_sale"
                  type="checkbox"
                  checked={draft.get("on_sale") === "true"}
                  onChange={(event) =>
                    update({ on_sale: event.target.checked ? "true" : null })
                  }
                />
                {t("По акции")}
              </label>
              <label>
                {t("Минимальная скидка")}
                <select
                  name="min_discount"
                  value={draft.get("min_discount") || ""}
                  onChange={(event) =>
                    update({ min_discount: event.target.value })
                  }
                >
                  <option value="">{t("Без ограничения")}</option>
                  {[10, 20, 30].map((value) => (
                    <option value={value} key={value}>
                      {value}%+
                    </option>
                  ))}
                </select>
              </label>
            </section>
            {availableFacets?.units.length || draft.has("unit") ? (
              <section className="catalog-filter-group">
                <h3>{t("Единица продажи")}</h3>
                <label>
                  {t("Продаётся как")}
                  <select
                    name="unit"
                    value={draft.get("unit") || ""}
                    onChange={(event) => update({ unit: event.target.value })}
                  >
                    <option value="">{t("Все единицы")}</option>
                    {Array.from(
                      new Set([
                        ...(availableFacets?.units || []),
                        ...(draft.get("unit") ? [draft.get("unit")!] : []),
                      ]),
                    ).map((unit) => (
                      <option key={unit} value={unit}>
                        {t(unit)}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  {t("Единица продажи не означает вес или объём упаковки.")}
                </p>
              </section>
            ) : null}
          </div>
          {preview.error && (
            <p className="catalog-filter-error" role="alert">
              {t(
                preview.error.status === 422
                  ? "Проверьте значения фильтров."
                  : "Не удалось загрузить результаты. Повторите попытку.",
              )}
            </p>
          )}
          <footer className="catalog-sheet-footer">
            <button
              className="button secondary"
              type="button"
              onClick={() => setDraft(new URLSearchParams())}
            >
              {t("Сбросить")}
            </button>
            <button
              className="button"
              type="submit"
              disabled={
                invalidRange || total === undefined || Boolean(preview.error)
              }
            >
              {total === undefined
                ? t("Проверяем результаты…")
                : `${t("Показать товары")}: ${total}`}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
