"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, useResource, type Order, type ProductPage } from "@/lib/api";
import { useCart } from "@/context/cart";
import { usePresentation } from "@/context/presentation";
import { cents } from "@/lib/format";
import {
  deleteShoppingTemplate,
  rememberOrder,
  saveShoppingTemplate,
  useShoppingStorage,
} from "@/lib/shopping-storage";
import {
  type AddSummary,
  type CuratedTemplate,
  type ShoppingItem,
  type ShoppingPreview,
  type ShoppingTemplate,
} from "@/lib/shopping";
import { Breadcrumbs } from "./breadcrumbs";
import { Failure, Loading } from "./states";
import { ProductImage } from "./product-card";
import styles from "./my-shopping.module.css";

const statuses: Record<string, string> = {
  pending: "Получен",
  confirmed: "Подтверждён",
  delivering: "В пути",
  completed: "Доставлен",
  cancelled: "Отменён",
};
const orderItems = (order: Order): ShoppingItem[] =>
  order.items.map((i) => ({
    product_id: i.product_id,
    quantity: Number(i.quantity),
    name: i.product_name,
  }));
const storageWarning =
  "Хранилище недоступно: шаблоны сохранятся только до закрытия страницы.";

export function AddShoppingItems({
  items,
  label = "Добавить всё в корзину",
}: {
  items: ShoppingItem[];
  label?: string;
}) {
  const { t } = usePresentation();
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<AddSummary>();
  const [error, setError] = useState("");
  const add = async () => {
    setBusy(true);
    setSummary(undefined);
    setError("");
    try {
      const valid = items.filter((i) => i.product_id > 0);
      const preview = valid.length
        ? await api<ShoppingPreview>("/shopping/preview", undefined, {
            items: valid.map(({ product_id, quantity }) => ({
              product_id,
              quantity,
            })),
          })
        : { items: [] };
      const result = cart.addMany(preview.items);
      result.missing += items.length - valid.length;
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить товары.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={styles.actionResult}>
      <button
        type="button"
        className="button"
        onClick={add}
        disabled={busy || !items.length}
      >
        {t(busy ? "Добавляем…" : label)}
      </button>
      <div role="status">
        {error && <p className="message">{t(error)}</p>}
        {summary && (
          <>
            <p>
              {t("Добавлено в корзину:")} {summary.added}.{" "}
              <Link className="text-link" href="/cart">
                {t("Перейти в корзину")}
              </Link>
            </p>
            {summary.unavailable > 0 && (
              <p>
                {t("Сейчас недоступно:")} {summary.unavailable}
              </p>
            )}
            {summary.missing > 0 && (
              <p>
                {t("Больше не продаётся:")} {summary.missing}
              </p>
            )}
            {summary.adjusted > 0 && (
              <p>
                {t("Количество ограничено остатком:")} {summary.adjusted}
              </p>
            )}
            {summary.full > 0 && (
              <p>{t("В корзине может быть до 48 разных товаров.")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function SaveShoppingTemplate({
  items,
  label = "Сохранить как шаблон",
}: {
  items: ShoppingItem[];
  label?: string;
}) {
  const { t } = usePresentation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className={styles.saveAction}>
      {!open && (
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setOpen(true);
            setMessage("");
          }}
        >
          {t(label)}
        </button>
      )}
      {open && (
        <form
          className={styles.inlineForm}
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const result = saveShoppingTemplate(name, items);
              setOpen(false);
              setName("");
              setMessage(
                result.persisted ? "Шаблон сохранён." : storageWarning,
              );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Не удалось сохранить шаблон.",
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
              placeholder={t("Моя неделя")}
            />
          </label>
          <button className="button" type="submit">
            {t("Сохранить")}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setOpen(false)}
          >
            {t("Отмена")}
          </button>
        </form>
      )}
      {message && (
        <p role="status">
          {t(message)}{" "}
          <Link href="/my-shopping#templates" className="text-link">
            {t("Мои шаблоны")}
          </Link>
        </p>
      )}
    </div>
  );
}

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

function HistoryOrder({ id }: { id: string }) {
  const { t, money, locale } = usePresentation();
  const resource = useResource<Order>(`/orders/${encodeURIComponent(id)}`);
  if (resource.loading) return <Loading label="Загружаем заказ…" />;
  if (resource.error)
    return (
      <article className={styles.card}>
        <p>
          {t("Заказ недоступен:")} {id.slice(0, 8)}
        </p>
        <Failure error={resource.error} retry={resource.retry} />
      </article>
    );
  const order = resource.data;
  if (!order) return null;
  return (
    <article className={styles.card}>
      <h3>
        {t("Заказ ")} #{order.id.slice(0, 8)}
      </h3>
      <div className={styles.meta}>
        <time dateTime={order.created_at}>
          {new Date(order.created_at).toLocaleDateString(locale)}
        </time>
        <strong>{money(cents(order.total))}</strong>
        <span>
          {t("Позиций:")} {order.items.length}
        </span>
        <span>{t(statuses[order.status] || order.status)}</span>
      </div>
      <div className={styles.actions}>
        <AddShoppingItems items={orderItems(order)} label="Повторить заказ" />
        <SaveShoppingTemplate items={orderItems(order)} />
        <Link href={`/order/${order.id}`} className="text-link">
          {t("Посмотреть заказ")}
        </Link>
      </div>
    </article>
  );
}

function TemplateCard({ template }: { template: CuratedTemplate }) {
  const { t } = usePresentation();
  const items = template.items.map((row) => ({
    product_id: row.product_id,
    quantity: row.requested_quantity,
  }));
  return (
    <article className={styles.card}>
      <h3>
        <Link href={`/my-shopping/templates/curated-${template.id}`}>
          {t(template.name)}
        </Link>
      </h3>
      <p>{t(template.description)}</p>
      <p>
        {t("Позиций:")} {template.items.length}
      </p>
      <div className={styles.preview}>
        {template.items
          .slice(0, 4)
          .map((row, index) =>
            row.product ? (
              <ProductImage key={row.product_id} product={row.product} />
            ) : (
              <span key={index}>{t("Больше не продаётся")}</span>
            ),
          )}
      </div>
      <div className={styles.actions}>
        <Link
          className="text-link"
          href={`/my-shopping/templates/curated-${template.id}`}
        >
          {t("Посмотреть")}
        </Link>
        <AddShoppingItems items={items} label="Добавить всё" />
      </div>
    </article>
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
      <p>{t("Наборы товаров, вручную подобранные Пайкар.")}</p>
      {resource.loading && <Loading />}
      {resource.error && (
        <Failure error={resource.error} retry={resource.retry} />
      )}
      <div className={styles.grid}>
        {(compact ? resource.data?.slice(0, 3) : resource.data)?.map(
          (template) => (
            <TemplateCard key={template.id} template={template} />
          ),
        )}
      </div>
    </section>
  );
}

export function MyShopping() {
  const { t } = usePresentation();
  const { templates, orderIds } = useShoppingStorage();
  return (
    <div className={"polish-page " + styles.page}>
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Мои покупки" }]}
      />
      <h1>{t("Мои покупки")}</h1>
      <p>
        {t(
          "Заказы и личные шаблоны доступны в этом браузере. Цены и наличие проверяются заново.",
        )}
      </p>
      <nav className={styles.tabs} aria-label={t("Мои покупки")}>
        <a href="#history">{t("История заказов")}</a>
        <a href="#templates">{t("Мои шаблоны")}</a>
        <a href="#curated">{t("Готовые наборы")}</a>
      </nav>
      <section id="history" className={styles.section}>
        <h2>{t("История заказов")}</h2>
        {!orderIds.length && <p>{t("У вас пока нет заказов.")}</p>}
        <div className={styles.history}>
          {orderIds.map((id) => (
            <HistoryOrder key={id} id={id} />
          ))}
        </div>
      </section>
      <section id="templates" className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>{t("Мои шаблоны")}</h2>
          <Link className="button secondary" href="/my-shopping/templates/new">
            {t("Создать шаблон")}
          </Link>
        </div>
        {!templates.length && (
          <p>{t("У вас пока нет сохранённых шаблонов.")}</p>
        )}
        <div className={styles.grid}>
          {templates.map((template) => (
            <article className={styles.card} key={template.id}>
              <h3>{template.name}</h3>
              <p>
                {t("Позиций:")} {template.items.length}
              </p>
              <div className={styles.actions}>
                <AddShoppingItems items={template.items} />
                <Link
                  className="text-link"
                  href={`/my-shopping/templates/${template.id}`}
                >
                  {t("Редактировать")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <CuratedShopping />
    </div>
  );
}

function usePreview(items: ShoppingItem[]) {
  const key = JSON.stringify(
    items.map(({ product_id, quantity }) => ({ product_id, quantity })),
  );
  const [attempt, setAttempt] = useState(0);
  const requestKey = key + attempt;
  const [result, setResult] = useState<{
    key: string;
    data?: ShoppingPreview;
    error?: Error;
  }>();
  useEffect(() => {
    const parsed: ShoppingItem[] = JSON.parse(key);
    if (!parsed.length) return;
    const controller = new AbortController();
    api<ShoppingPreview>("/shopping/preview", controller.signal, {
      items: parsed,
    }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error });
      },
    );
    return () => controller.abort();
  }, [key, requestKey]);
  return {
    data: result?.key === requestKey ? result.data : undefined,
    error: result?.key === requestKey ? result.error : undefined,
    loading: items.length > 0 && result?.key !== requestKey,
    retry: () => setAttempt((v) => v + 1),
  };
}

function ItemPreview({
  items,
  sourceItems,
}: {
  items: ShoppingPreview["items"];
  sourceItems: ShoppingItem[];
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
      <ul className={styles.itemList}>
        {items.map((row, index) => (
          <li key={row.product_id || index}>
            <div>
              {row.product ? (
                <Link href={`/product/${row.product.slug}`}>
                  {t(row.product.name)}
                </Link>
              ) : (
                t(
                  sourceItems.find((i) => i.product_id === row.product_id)
                    ?.name || "Больше не продаётся",
                )
              )}
              <small>
                {t(
                  row.availability === "missing"
                    ? "Больше не продаётся"
                    : row.availability === "unavailable"
                      ? "Сейчас недоступно"
                      : "В наличии",
                )}
              </small>
            </div>
            <span>
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
      <p className={styles.estimate}>
        {t("Стоимость сейчас:")} <strong>{money(total)}</strong>
      </p>
      <p>
        {t(
          "Оценка доступных товаров без доставки. Итог проверяется при оформлении.",
        )}
      </p>
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
  const { t } = usePresentation();
  const [name, setName] = useState(template?.name || "");
  const [items, setItems] = useState<ShoppingItem[]>(template?.items || []);
  const [query, setQuery] = useState("");
  const products = useResource<ProductPage>(
    `/products?page_size=48&q=${encodeURIComponent(query)}`,
  );
  const preview = usePreview(items);
  const [message, setMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savedId, setSavedId] = useState(template?.id);
  return (
    <div>
      <form
        className={styles.editor}
        onSubmit={(event) => {
          event.preventDefault();
          try {
            const result = saveShoppingTemplate(name, items, savedId);
            setSavedId(result.template.id);
            setMessage(result.persisted ? "Шаблон сохранён." : storageWarning);
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
          {items.map((item) => (
            <li key={item.product_id}>
              <span>
                {t(
                  preview.data?.items.find(
                    (p) => p.product_id === item.product_id,
                  )?.product?.name ||
                    item.name ||
                    "Больше не продаётся",
                )}
              </span>
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
                    current.filter((row) => row.product_id !== item.product_id),
                  )
                }
              >
                {t("Удалить")}
              </button>
            </li>
          ))}
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
      <section className={styles.section}>
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
              <span>{t(product.name)}</span>
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
      {preview.loading && <Loading />}
      {preview.error && <Failure error={preview.error} retry={preview.retry} />}
      {preview.data && (
        <ItemPreview items={preview.data.items} sourceItems={items} />
      )}
      <div className={styles.actions}>
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
    <div className={"polish-page " + styles.page}>
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Мои покупки", href: "/my-shopping" },
          { label: "Шаблон покупок" },
        ]}
      />
      <h1>
        {curated
          ? t(resource.data?.name || "Готовый набор")
          : id === "new"
            ? t("Создать шаблон")
            : template?.name || t("Мой шаблон")}
      </h1>
      {curated ? (
        <>
          {resource.loading && <Loading />}
          {resource.error && (
            <Failure error={resource.error} retry={resource.retry} />
          )}
          {resource.data && (
            <>
              <p>{t(resource.data.description)}</p>
              <ItemPreview items={resource.data.items} sourceItems={[]} />
              <AddShoppingItems
                items={resource.data.items.map((row) => ({
                  product_id: row.product_id,
                  quantity: row.requested_quantity,
                }))}
              />
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
