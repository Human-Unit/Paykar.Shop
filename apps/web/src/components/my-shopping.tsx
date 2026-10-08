"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useResource, type Order, type ProductPage } from "@/lib/api";
import { usePresentation } from "@/context/presentation";
import { cents } from "@/lib/format";
import {
  deleteShoppingTemplate,
  rememberOrder,
  saveShoppingTemplate,
  useShoppingStorage,
} from "@/lib/shopping-storage";
import {
  type CuratedTemplate,
  type ShoppingItem,
  type ShoppingPreview,
  type ShoppingTemplate,
} from "@/lib/shopping";
import { Breadcrumbs } from "./breadcrumbs";
import { ShoppingProductIdentity } from "./shopping-product-identity";
import { Failure, Loading } from "./states";
import { ArrowRight, Plus } from "lucide-react";
import {
  AddShoppingItems,
  SaveShoppingTemplate,
  orderItems,
  storageWarning,
} from "./shopping-actions";
export { AddShoppingItems, SaveShoppingTemplate } from "./shopping-actions";
import {
  HistoryOrder,
  PersonalTemplateCard,
  CuratedTemplateCard,
} from "./shopping-workspace-cards";
import { useShoppingPreview } from "@/lib/use-shopping-preview";
import styles from "./my-shopping.module.css";

export function OrderShoppingActions({ order }: { order: Order }) {
  const { t } = usePresentation();
  useEffect(() => rememberOrder(order.id), [order.id]);
  return (
    <section className={styles.orderActions} aria-label={t("Повторить позже?")}>
      <h2>{t("Повторить позже?")}</h2>
      <SaveShoppingTemplate
        items={orderItems(order)}
        label="Сохранить этот заказ как шаблон"
      />
      <Link href="/my-shopping" className="text-link">
        {t("Мои покупки")}
      </Link>
    </section>
  );
}

export function CuratedShopping({ compact = false }: { compact?: boolean }) {
  const { t } = usePresentation();
  const resource = useResource<CuratedTemplate[]>("/shopping/templates");
  return (
    <section id="curated" className={styles.section}>
      <div className={styles.sectionHeading}>
        <h2>{t("Готовые наборы")}</h2>
        {compact && (
          <Link href="/my-shopping#curated" className="text-link">
            {t("Все наборы")}
          </Link>
        )}
      </div>
      <p>{t("Быстрый способ собрать привычную корзину.")}</p>
      {resource.loading && <Loading />}
      {resource.error && (
        <Failure error={resource.error} retry={resource.retry} />
      )}
      <div className={styles.grid}>
        {(compact ? resource.data?.slice(0, 3) : resource.data)?.map(
          (template) => (
            <CuratedTemplateCard key={template.id} template={template} />
          ),
        )}
      </div>
      {resource.data && resource.data.length > 0 && (
        <p className={styles.help}>
          {t(
            "Оценка доступных товаров без доставки. Итог проверяется при оформлении.",
          )}
        </p>
      )}
      {resource.data?.length === 0 && (
        <Link className="text-link" href="/catalog">
          {t("Перейти в каталог")} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

export function ShoppingDiscovery() {
  const { t, locale } = usePresentation();
  const { templates, orderIds } = useShoppingStorage();
  const hasPersonalContent = orderIds.length > 0 || templates.length > 0;
  const countLabel = (
    count: number,
    one: string,
    few: string,
    many: string,
  ) => {
    const plural = new Intl.PluralRules(locale).select(count);
    return `${count} ${t(plural === "one" ? one : plural === "few" ? few : many)}`;
  };
  const counts = [
    orderIds.length > 0
      ? countLabel(orderIds.length, "заказ", "заказа", "заказов")
      : null,
    templates.length > 0
      ? countLabel(templates.length, "шаблон", "шаблона", "шаблонов")
      : null,
  ].filter(Boolean);
  return (
    <section className={styles.discovery} aria-label={t("Мои покупки")}>
      <div className={styles.discoveryCopy}>
        <h2>{t("Мои покупки")}</h2>
        <p>
          {t(
            hasPersonalContent
              ? "Ваши сохранённые покупки всегда под рукой."
              : "Повторяйте прошлые заказы, сохраняйте любимые наборы и собирайте привычную корзину быстрее.",
          )}
        </p>
        {counts.length > 0 && (
          <p className={styles.discoveryCounts}>{counts.join(" · ")}</p>
        )}
      </div>
      <Link href="/my-shopping" className="button">
        {t("Открыть мои покупки")}
      </Link>
    </section>
  );
}

export function MyShopping() {
  const { t } = usePresentation();
  const { templates, orderIds } = useShoppingStorage();
  const hasHistory = orderIds.length > 0;
  const hasTemplates = templates.length > 0;
  const [showOlderOrders, setShowOlderOrders] = useState(false);
  return (
    <div
      className={
        "polish-page shopping-page " + styles.page + " " + styles.workspace
      }
    >
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Мои покупки" }]}
      />
      <div className={styles.intro + " commerce-heading"}>
        <h1>{t("Мои покупки")}</h1>
        <p>
          {t(
            "Повторяйте привычные покупки, сохраняйте любимые наборы и собирайте корзину за пару кликов.",
          )}
        </p>
        {!hasTemplates && (
          <Link
            className={hasHistory ? "button secondary" : "button"}
            href="/my-shopping/templates/new"
          >
            <Plus size={18} aria-hidden="true" />
            {t("Создать свой шаблон")}
          </Link>
        )}
      </div>
      {hasHistory && (
        <section id="history" className={styles.section}>
          <h2>{t("Последний заказ")}</h2>
          <p className={styles.help}>
            {t(
              "Актуальные цены и наличие проверим перед добавлением в корзину.",
            )}
          </p>
          <HistoryOrder id={orderIds[0]} />
          {orderIds.length > 1 && (
            <div className={styles.recentOrders}>
              <button
                type="button"
                className="text-link"
                aria-expanded={showOlderOrders}
                aria-controls="recent-orders"
                onClick={() => setShowOlderOrders((value) => !value)}
              >
                {t(showOlderOrders ? "Скрыть заказы" : "Все заказы")}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              {showOlderOrders && (
                <div id="recent-orders" className={styles.history}>
                  <h3>{t("Недавние заказы")}</h3>
                  {orderIds.slice(1).map((id) => (
                    <HistoryOrder key={id} id={id} compact />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {hasTemplates && (
        <section id="templates" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>{t("Мои шаблоны")}</h2>
            <Link
              className="button secondary"
              href="/my-shopping/templates/new"
            >
              <Plus size={17} aria-hidden="true" />
              {t("Создать")}
            </Link>
          </div>
          <p className={styles.help}>
            {t("Ваши шаблоны сохраняются в этом браузере.")}
          </p>
          <div className={styles.grid}>
            {templates.map((template) => (
              <PersonalTemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      )}
      <CuratedShopping />
    </div>
  );
}

function ItemPreview({
  items,
  sourceItems,
  summaryOnly = false,
  showSummary = true,
}: {
  items: ShoppingPreview["items"];
  sourceItems: ShoppingItem[];
  summaryOnly?: boolean;
  showSummary?: boolean;
}) {
  const { t, money } = usePresentation();
  const total = items.reduce(
    (sum, row) =>
      sum +
      (row.product && row.availability === "available"
        ? cents(row.product.price) * row.available_quantity
        : 0),
    0,
  );
  return (
    <>
      {!summaryOnly && (
        <ul className={styles.itemList}>
          {items.map((row, index) => (
            <li key={row.product_id || index}>
              <ShoppingProductIdentity
                product={row.product}
                name={
                  sourceItems.find((i) => i.product_id === row.product_id)?.name
                }
              >
                <small>
                  {t(
                    row.availability === "missing"
                      ? "Больше не продаётся"
                      : row.availability === "unavailable"
                        ? "Сейчас недоступно"
                        : "В наличии",
                  )}
                </small>
              </ShoppingProductIdentity>
              <span className={styles.rowQuantity}>
                {t("Количество:")} {row.requested_quantity}
                {row.available_quantity < row.requested_quantity && (
                  <>
                    {" "}
                    · {t("Доступно:")} {row.available_quantity}
                  </>
                )}
              </span>
              <strong>
                {row.product ? money(cents(row.product.price)) : "—"}
              </strong>
            </li>
          ))}
        </ul>
      )}
      {showSummary && (
        <>
          <p className={styles.estimate}>
            {t("Стоимость сейчас:")} <strong>{money(total)}</strong>
          </p>
          <p>
            {t(
              "Оценка доступных товаров без доставки. Итог проверяется при оформлении.",
            )}
          </p>
        </>
      )}
    </>
  );
}

function PersonalEditor({
  template,
  onDeleted,
}: {
  template?: ShoppingTemplate;
  onDeleted: (persisted: boolean) => void;
}) {
  const { t, money } = usePresentation();
  const [name, setName] = useState(template?.name || "");
  const [items, setItems] = useState<ShoppingItem[]>(template?.items || []);
  const [query, setQuery] = useState("");
  const products = useResource<ProductPage>(
    `/products?page_size=48&q=${encodeURIComponent(query)}`,
  );
  const preview = useShoppingPreview(items);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savedId, setSavedId] = useState(template?.id);
  return (
    <div className={styles.editorWorkspace}>
      <div className={styles.editorMain}>
        <form
          className={styles.editor}
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const result = saveShoppingTemplate(name, items, savedId);
              setSavedId(result.template.id);
              setMessage(
                result.persisted ? "Шаблон сохранён." : storageWarning,
              );
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "Не удалось сохранить шаблон.",
              );
            }
          }}
        >
          <label>
            {t("Название шаблона")}
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <ul className={styles.itemList}>
            {items.map((item) => {
              const row = preview.data?.items.find(
                (entry) => entry.product_id === item.product_id,
              );
              const product =
                row?.product ??
                products.data?.items.find(
                  (entry) => entry.id === item.product_id,
                );
              return (
                <li key={item.product_id}>
                  <ShoppingProductIdentity product={product} name={item.name}>
                    {row?.product && (
                      <small>
                        {money(cents(row.product.price))} /{" "}
                        {t(row.product.unit)}
                      </small>
                    )}
                    {row && (
                      <small>
                        {t(
                          row.availability === "missing"
                            ? "Больше не продаётся"
                            : row.availability === "unavailable"
                              ? "Сейчас недоступно"
                              : "В наличии",
                        )}
                        {row.available_quantity < item.quantity && (
                          <>
                            {" "}
                            · {t("Доступно:")} {row.available_quantity}
                          </>
                        )}
                      </small>
                    )}
                  </ShoppingProductIdentity>
                  <label>
                    {t("Количество")}
                    <input
                      type="number"
                      min={1}
                      max={99}
                      required
                      value={item.quantity}
                      onChange={(e) => {
                        const quantity = Number(e.target.value);
                        if (
                          Number.isInteger(quantity) &&
                          quantity >= 1 &&
                          quantity <= 99
                        )
                          setItems((current) =>
                            current.map((row) =>
                              row.product_id === item.product_id
                                ? { ...row, quantity }
                                : row,
                            ),
                          );
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="button secondary"
                    aria-label={t("Удалить: ") + t(item.name || "Товар")}
                    onClick={() =>
                      setItems((current) =>
                        current.filter(
                          (row) => row.product_id !== item.product_id,
                        ),
                      )
                    }
                  >
                    {t("Удалить")}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={styles.actions}>
            <button type="submit" className="button" disabled={!items.length}>
              {t("Сохранить")}
            </button>
            {preview.data?.items.some(
              (row) => row.availability !== "available",
            ) && (
              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  setItems((current) =>
                    current.filter((item) =>
                      preview.data?.items.some(
                        (row) =>
                          row.product_id === item.product_id &&
                          row.availability === "available",
                      ),
                    ),
                  )
                }
              >
                {t("Удалить недоступные товары")}
              </button>
            )}
          </div>
        </form>
        {preview.loading && <Loading />}
        {preview.error && (
          <Failure error={preview.error} retry={preview.retry} />
        )}
        {preview.data && (
          <ItemPreview
            items={preview.data.items}
            sourceItems={items}
            summaryOnly
          />
        )}
        <div className={styles.actions + " " + styles.editorSecondaryActions}>
          <AddShoppingItems items={items} />
          {savedId &&
            (!deleteConfirm ? (
              <button
                className="button secondary"
                type="button"
                onClick={() => setDeleteConfirm(true)}
              >
                {t("Удалить шаблон")}
              </button>
            ) : (
              <div>
                <p>{t("Удалить этот шаблон?")}</p>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    const persisted = deleteShoppingTemplate(savedId);
                    onDeleted(persisted);
                  }}
                >
                  {t("Подтвердить удаление")}
                </button>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                >
                  {t("Отмена")}
                </button>
              </div>
            ))}
        </div>
        <p role="status">{t(message)}</p>
      </div>
      <section className={styles.pickerSection}>
        <h2>{t("Добавить товары")}</h2>
        <label>
          {t("Поиск товаров")}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {products.loading && <Loading />}
        {products.error && (
          <Failure error={products.error} retry={products.retry} />
        )}
        <ul className={styles.productPicker}>
          {products.data?.items.map((product) => (
            <li key={product.id}>
              <ShoppingProductIdentity product={product} />
              <button
                type="button"
                className="button secondary"
                disabled={
                  items.some((i) => i.product_id === product.id) ||
                  items.length >= 48
                }
                onClick={() =>
                  setItems((current) => [
                    ...current,
                    { product_id: product.id, quantity: 1, name: product.name },
                  ])
                }
              >
                {t("Добавить")}
              </button>
            </li>
          ))}
        </ul>
        {products.data?.total === 0 && <p>{t("Товары не найдены.")}</p>}
      </section>
    </div>
  );
}

export function ShoppingTemplateDetail({ id }: { id: string }) {
  const { t } = usePresentation();
  const [deletedMessage, setDeletedMessage] = useState("");
  const { templates } = useShoppingStorage();
  const curated = id.startsWith("curated-");
  const resource = useResource<CuratedTemplate>(
    curated ? `/shopping/templates/${encodeURIComponent(id.slice(8))}` : null,
  );
  const template = templates.find((row) => row.id === id);
  return (
    <div
      className={
        "polish-page shopping-page " + styles.page + " " + styles.templatePage
      }
    >
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Мои покупки", href: "/my-shopping" },
          { label: "Шаблон покупок" },
        ]}
      />
      <header className="commerce-heading">
        <h1>
          {curated
            ? t(resource.data?.name || "Готовый набор")
            : id === "new"
              ? t("Создать шаблон")
              : template?.name || t("Мой шаблон")}
        </h1>
      </header>
      {curated ? (
        <>
          {resource.loading && <Loading />}
          {resource.error && (
            <Failure error={resource.error} retry={resource.retry} />
          )}
          {resource.data && (
            <>
              <p>{t(resource.data.description)}</p>
              <div className={styles.curatedDetail}>
                <aside className={styles.templateSummary}>
                  <ItemPreview
                    items={resource.data.items}
                    sourceItems={[]}
                    summaryOnly
                  />
                  <AddShoppingItems
                    items={resource.data.items.map((row) => ({
                      product_id: row.product_id,
                      quantity: row.requested_quantity,
                    }))}
                  />
                </aside>
                <section className={styles.templateContents}>
                  <h2>{t("Состав набора")}</h2>
                  <ItemPreview
                    items={resource.data.items}
                    sourceItems={[]}
                    showSummary={false}
                  />
                </section>
              </div>
            </>
          )}
        </>
      ) : deletedMessage ? (
        <p role="status">
          {t(deletedMessage)}{" "}
          <Link className="text-link" href="/my-shopping">
            {t("Мои покупки")}
          </Link>
        </p>
      ) : id === "new" || template ? (
        <PersonalEditor
          key={id}
          template={template}
          onDeleted={(persisted) =>
            setDeletedMessage(persisted ? "Шаблон удалён." : storageWarning)
          }
        />
      ) : (
        <p>{t("Шаблон не найден в этом браузере.")}</p>
      )}
    </div>
  );
}
