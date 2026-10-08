"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Category, CatalogFacets, ProductPage, useResource } from "@/lib/api";
import {
  advancedFilterCount,
  catalogApiQuery,
  catalogFilterChanges,
  catalogHref,
  catalogPriceError,
  categoryFilterChanges,
  descendantCategories,
  resetCatalogFilters,
} from "@/lib/catalog-query";
import { catalogGroups } from "@/lib/category-presentation";

// Advanced controls extend Diyor's toolbar, using the same surfaces and tokens.
// Only unapplied dialog edits are local; the URL owns every applied filter.
export function CatalogFilterDialog({
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
  const titleId = useId();
  const dialogId = useId();
  const priceErrorId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => new URLSearchParams(params));
  const [previewQuery, setPreviewQuery] = useState<string | null>(null);
  const appliedQuery = params.toString();
  useEffect(() => {
    // URL changes close an open draft without replacing its focus-return target.
    // The current URL is copied into draft whenever the shopper opens it again.
    if (dialog.current?.open) dialog.current.close();
  }, [appliedQuery]);
  const min = draft.get("min_price") || "";
  const max = draft.get("max_price") || "";
  const priceError = catalogPriceError(draft);
  const candidate = new URLSearchParams(draft);
  candidate.delete("page");
  const candidateQuery = catalogApiQuery(candidate, false, 1);
  useEffect(() => {
    const timer = setTimeout(
      () => setPreviewQuery(open && !priceError ? candidateQuery : null),
      250,
    );
    return () => clearTimeout(timer);
  }, [open, priceError, candidateQuery]);
  const preview = useResource<ProductPage>(
    open && !priceError && previewQuery === candidateQuery
      ? previewQuery
      : null,
  );
  const settled =
    open && !priceError && previewQuery === candidateQuery && !preview.loading;
  const total = settled ? preview.data?.total : undefined;
  const categorySlug = draft.get("category") || "";
  const subcategories = categorySlug
    ? descendantCategories(categories, categorySlug)
    : categories.filter((item) => item.parent_id !== null);
  const scope = new URLSearchParams();
  const scopeChanged = ["q", "category", "subcategory"].some(
    (key) => draft.get(key) !== params.get(key),
  );
  for (const key of ["q", "category", "subcategory"]) {
    const value = draft.get(key);
    if (value) scope.set(key, value);
  }
  const scopedFacets = useResource<ProductPage>(
    open && scopeChanged ? catalogApiQuery(scope, true, 1) : null,
  );
  const availableFacets = scopeChanged ? scopedFacets.data?.facets : facets;
  const units = availableFacets?.units || [];
  const unit = draft.get("unit") || "";
  const unitUnavailable = Boolean(
    unit && availableFacets && !units.includes(unit),
  );
  const filterCount = advancedFilterCount(params);
  function update(values: Record<string, string | null>) {
    // Re-entering a previously previewed query still needs a fresh server count.
    preview.retry();
    setDraft((previous) => catalogFilterChanges(previous, values));
  }
  function close() {
    dialog.current?.close();
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="filter-toggle more-filters"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => {
          preview.retry();
          setDraft(new URLSearchParams(params));
          setPreviewQuery(null);
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
        <span>{t("Фильтры")}</span>
        {filterCount > 0 && (
          <span className="filter-group-count">{filterCount}</span>
        )}
      </button>
      <dialog
        ref={dialog}
        id={dialogId}
        className="filter-panel"
        aria-labelledby={titleId}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (priceError || total === undefined || preview.error) return;
            close();
            router.push(catalogHref(draft), { scroll: false });
          }}
        >
          <header className="filter-panel-heading">
            <h2 id={titleId}>
              <SlidersHorizontal size={22} aria-hidden="true" />
              {t("Фильтры")}
            </h2>
            <button
              type="button"
              autoFocus
              className="filter-panel-close"
              aria-label={t("Закрыть фильтры")}
              onClick={close}
            >
              <X size={22} aria-hidden="true" />
            </button>
          </header>
          <div className="filter-panel-fields">
            <fieldset>
              <legend>{t("Категории")}</legend>
              <label>
                {t("Категория")}
                <select
                  name="category"
                  value={categorySlug}
                  onChange={(event) => {
                    update(
                      categoryFilterChanges(
                        draft,
                        categories,
                        event.target.value,
                      ),
                    );
                  }}
                >
                  <option value="">{t("Все товары")}</option>
                  {catalogGroups(categories)
                    .flatMap(({ category, children }) => [
                      category,
                      ...children,
                    ])
                    .map((item) => (
                      <option value={item.slug} key={item.id}>
                        {item.parent_id !== null ? "— " : ""}
                        {t(item.name)}
                      </option>
                    ))}
                </select>
              </label>
              {subcategories.length > 0 && (
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
            </fieldset>
            <fieldset>
              <legend>{t("Цена, сомони")}</legend>
              <div className="filter-price-bounds">
                {(
                  [
                    {
                      key: "min_price",
                      label: "Цена от",
                      value: min,
                      placeholder: "От",
                    },
                    {
                      key: "max_price",
                      label: "Цена до",
                      value: max,
                      placeholder: "До",
                    },
                  ] as const
                ).map((field) => (
                  <label key={field.key}>
                    {t(field.label)}
                    <input
                      name={field.key}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={32}
                      aria-invalid={Boolean(priceError)}
                      aria-describedby={priceError ? priceErrorId : undefined}
                      value={field.value}
                      placeholder={t(field.placeholder)}
                      onChange={(event) =>
                        update({ [field.key]: event.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              {!!availableFacets?.price_presets.length && (
                <div
                  className="filter-presets"
                  aria-label={t("Быстрые диапазоны цен")}
                >
                  {availableFacets.price_presets.map((preset) => (
                    <button
                      type="button"
                      key={`${preset.min_price}:${preset.max_price}`}
                      aria-pressed={
                        !priceError &&
                        (min === (preset.min_price || "") ||
                          (Boolean(min && preset.min_price) &&
                            Number(min) === Number(preset.min_price))) &&
                        (max === (preset.max_price || "") ||
                          (Boolean(max && preset.max_price) &&
                            Number(max) === Number(preset.max_price)))
                      }
                      onClick={() => update(preset)}
                    >
                      {preset.min_price === null
                        ? `${t("До")} ${money(Number(preset.max_price) * 100)}`
                        : preset.max_price === null
                          ? `${t("От")} ${money(Number(preset.min_price) * 100)}`
                          : `${money(Number(preset.min_price) * 100)} – ${money(Number(preset.max_price) * 100)}`}
                    </button>
                  ))}
                </div>
              )}
              {priceError && (
                <p
                  className="filter-panel-validation"
                  id={priceErrorId}
                  role="alert"
                >
                  {t(
                    priceError === "reversed_price"
                      ? "Минимальная цена не должна превышать максимальную."
                      : "Введите целую цену от 0 до 9 999 999 999 сомони.",
                  )}
                </p>
              )}
            </fieldset>
            <fieldset>
              <legend>{t("Наличие и скидки")}</legend>
              <div className="filter-options">
                {(
                  [
                    { key: "in_stock", label: "Только в наличии" },
                    { key: "on_sale", label: "Со скидкой" },
                  ] as const
                ).map((option) => (
                  <label className="filter-toggle" key={option.key}>
                    <input
                      name={option.key}
                      type="checkbox"
                      checked={draft.get(option.key) === "true"}
                      onChange={(event) =>
                        update({
                          [option.key]: event.target.checked ? "true" : null,
                        })
                      }
                    />
                    <span>{t(option.label)}</span>
                  </label>
                ))}
              </div>
              <label>
                {t("Размер скидки")}
                <select
                  name="min_discount"
                  value={draft.get("min_discount") || ""}
                  onChange={(event) =>
                    update({ min_discount: event.target.value })
                  }
                >
                  <option value="">{t("Любая")}</option>
                  {draft.has("min_discount") &&
                    !["10", "20", "30"].includes(
                      draft.get("min_discount")!,
                    ) && (
                      <option value={draft.get("min_discount")!}>
                        {draft.get("min_discount")}
                        {t("% и больше")}
                      </option>
                    )}
                  {[10, 20, 30].map((value) => (
                    <option value={value} key={value}>
                      {value}
                      {t("% и больше")}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
            {units.length > 1 || unit ? (
              <fieldset>
                <legend>{t("Единица продажи")}</legend>
                <label>
                  {t("Продаётся как")}
                  <select
                    name="unit"
                    value={unit}
                    onChange={(event) => update({ unit: event.target.value })}
                  >
                    <option value="">{t("Все единицы")}</option>
                    {unit && !units.includes(unit) && (
                      <option value={unit} disabled>
                        {t(unit)}
                      </option>
                    )}
                    {units.map((value) => (
                      <option key={value} value={value}>
                        {t(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="filter-panel-note">
                  {t("Единица продажи не означает вес или объём упаковки.")}
                </p>
                {unitUnavailable && (
                  <p className="filter-panel-note" role="status">
                    {t(
                      "Эта единица недоступна в выбранной категории. Выберите другую или сбросьте фильтр.",
                    )}
                  </p>
                )}
              </fieldset>
            ) : null}
          </div>
          {preview.error && (
            <p className="filter-panel-error" role="alert">
              {t(
                preview.error.status === 422
                  ? "Проверьте значения фильтров."
                  : "Не удалось загрузить результаты. Повторите попытку.",
              )}
              <button type="button" onClick={preview.retry}>
                {t("Повторить")}
              </button>
            </p>
          )}
          <footer className="filter-panel-actions">
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                preview.retry();
                setDraft(resetCatalogFilters(draft));
              }}
            >
              {t("Сбросить")}
            </button>
            <button
              className="button"
              type="submit"
              disabled={
                Boolean(priceError) ||
                total === undefined ||
                Boolean(preview.error)
              }
            >
              {priceError || preview.error
                ? t("Показать товары")
                : total === undefined
                  ? t("Проверяем результаты…")
                  : `${t("Показать товары")}: ${total}`}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
