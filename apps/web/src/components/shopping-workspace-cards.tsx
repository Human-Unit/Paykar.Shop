"use client";

import Link from "next/link";
import {
  ArrowRight,
  FilePlus2,
  MoreHorizontal,
  Pencil,
  Repeat2,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type Order } from "@/lib/api";
import { cents } from "@/lib/format";
import type {
  CuratedTemplate,
  PreviewItem,
  ShoppingItem,
  ShoppingTemplate,
} from "@/lib/shopping";
import { useShoppingPreview } from "@/lib/use-shopping-preview";
import { ProductImage } from "./product-card";
import { Failure, Loading } from "./states";
import {
  AddShoppingItems,
  SaveShoppingTemplate,
  orderItems,
} from "./shopping-actions";
import styles from "./my-shopping.module.css";

const statuses: Record<string, string> = {
  pending: "Получен",
  confirmed: "Подтверждён",
  delivering: "В пути",
  completed: "Доставлен",
  cancelled: "Отменён",
};

function ItemCount({ count }: { count: number }) {
  const { t, locale } = usePresentation();
  const plural = new Intl.PluralRules(locale).select(count);
  return (
    <span>
      {count}{" "}
      {t(plural === "one" ? "товар" : plural === "few" ? "товара" : "товаров")}
    </span>
  );
}

function ProductPreview({
  items,
  count,
  composition = false,
  overlap = false,
}: {
  items: PreviewItem[];
  count: number;
  composition?: boolean;
  overlap?: boolean;
}) {
  const { t } = usePresentation();
  return (
    <div
      className={`${composition ? styles.composition : styles.productPreview} ${overlap ? styles.overlapPreview : ""}`}
    >
      {items.slice(0, overlap && composition ? 3 : 4).map((row, index) => (
        <div className={styles.previewTile} key={`${row.product_id}:${index}`}>
          {row.product ? (
            <ProductImage product={row.product} />
          ) : (
            <span className={styles.missingProduct}>
              <ShoppingBasket size={24} aria-hidden="true" />
              <span className="sr-only">{t("Больше не продаётся")}</span>
            </span>
          )}
          {!overlap && index === 3 && count > 4 && (
            <span className={styles.moreProducts}>+{count - 4}</span>
          )}
        </div>
      ))}
      {overlap && !composition && count > 4 && (
        <span className={styles.previewRemainder}>+{count - 4}</span>
      )}
    </div>
  );
}

function PreviewEstimate({ items }: { items: PreviewItem[] }) {
  const { t, money } = usePresentation();
  const total = items.reduce(
    (sum, row) =>
      sum +
      (row.product && row.availability === "available"
        ? cents(row.product.price) * row.available_quantity
        : 0),
    0,
  );
  const available = items.some((row) => row.availability === "available");
  return (
    <>
      {available && (
        <p className={styles.currentPrice}>
          ≈ {money(total)} <span>{t("сейчас")}</span>
        </p>
      )}
      {items.some(
        (row) =>
          row.availability !== "available" ||
          row.available_quantity < row.requested_quantity,
      ) && (
        <p className={styles.help}>
          {t("Некоторые товары недоступны или ограничены остатком.")}
        </p>
      )}
    </>
  );
}

function OrderProductPreview({ items }: { items: ShoppingItem[] }) {
  const preview = useShoppingPreview(items.filter((row) => row.product_id > 0));
  return (
    <div className={styles.orderPreview}>
      {preview.loading && <Loading label="Загружаем товары…" />}
      {preview.error && <Failure error={preview.error} retry={preview.retry} />}
      {!preview.loading && !preview.error && (
        <ProductPreview
          items={items.map(
            (item) =>
              preview.data?.items.find(
                (row) => row.product_id === item.product_id,
              ) ?? {
                product_id: item.product_id,
                requested_quantity: item.quantity,
                available_quantity: 0,
                availability: "missing",
                product: null,
              },
          )}
          count={items.length}
          overlap
        />
      )}
    </div>
  );
}

export function HistoryOrder({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const { t, money, locale } = usePresentation();
  const resource = useResource<Order>(`/orders/${encodeURIComponent(id)}`);
  const cardClassName =
    styles.card +
    " " +
    (compact
      ? styles.compactOrder
      : `${styles.latestOrder} ${styles.orderShowcaseCard}`);
  if (resource.loading)
    return (
      <article className={cardClassName} aria-busy="true">
        <Loading label="Загружаем заказ…" />
      </article>
    );
  if (resource.error)
    return (
      <article className={cardClassName}>
        <p>
          {t("Заказ недоступен:")} {id.slice(0, 8)}
        </p>
        <Failure error={resource.error} retry={resource.retry} />
      </article>
    );
  const order = resource.data;
  if (!order) return null;
  const items = orderItems(order);
  return (
    <article className={cardClassName}>
      <div className={styles.orderSummary}>
        <div className={styles.orderInformation}>
          <div className={styles.orderTitle}>
            <h3>
              {t("Заказ ")} #{order.id.slice(0, 8)}
            </h3>
            <span className={styles.statusBadge}>
              {t(statuses[order.status] || order.status)}
            </span>
          </div>
          <div className={styles.orderMeta}>
            <time dateTime={order.created_at}>
              {new Date(order.created_at).toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
              })}
            </time>
            <span aria-hidden="true">·</span>
            <ItemCount count={order.items.length} />
          </div>
        </div>
        <strong className={styles.orderTotal}>
          {money(cents(order.total))}
        </strong>
      </div>
      {!compact && <OrderProductPreview items={items} />}
      <div className={styles.orderCardActions}>
        <SaveShoppingTemplate
          items={items}
          label="В шаблон"
          icon={<FilePlus2 size={18} aria-hidden="true" />}
        />
        <AddShoppingItems
          items={items}
          label="Повторить заказ"
          icon={<Repeat2 size={18} aria-hidden="true" />}
        />
        <Link
          href={`/order/${order.id}`}
          className={`text-link ${styles.orderViewLink}`}
        >
          {t("Посмотреть заказ")} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export function PersonalTemplateCard({
  template,
}: {
  template: ShoppingTemplate;
}) {
  const { t } = usePresentation();
  const preview = useShoppingPreview(template.items);
  return (
    <article
      className={`${styles.card} ${styles.templateCard} ${styles.personalTemplateCard}`}
    >
      {preview.loading && <Loading label="Загружаем товары…" />}
      {preview.error && <Failure error={preview.error} retry={preview.retry} />}
      {preview.data && (
        <ProductPreview
          items={preview.data.items}
          count={template.items.length}
          composition
          overlap
        />
      )}
      <h3>
        <Link href={`/my-shopping/templates/${template.id}`}>
          {template.name}
        </Link>
      </h3>
      <div className={styles.cardMeta}>
        <ItemCount count={template.items.length} />
      </div>
      {preview.data && <PreviewEstimate items={preview.data.items} />}
      <div className={styles.templateActions}>
        <AddShoppingItems
          items={template.items}
          label="Добавить в корзину"
          icon={<ShoppingCart size={18} aria-hidden="true" />}
        />
        <details
          className={styles.templateMenu}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              event.currentTarget.open = false;
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label={`${t("Редактировать")}: ${template.name}`}>
            <MoreHorizontal size={22} aria-hidden="true" />
          </summary>
          <Link href={`/my-shopping/templates/${template.id}`}>
            <Pencil size={16} aria-hidden="true" /> {t("Редактировать")}
          </Link>
        </details>
      </div>
    </article>
  );
}

export function CuratedTemplateCard({
  template,
}: {
  template: CuratedTemplate;
}) {
  const { t } = usePresentation();
  const items = template.items.map((row) => ({
    product_id: row.product_id,
    quantity: row.requested_quantity,
  }));
  const href = `/my-shopping/templates/curated-${template.id}`;
  return (
    <article
      className={
        styles.card + " " + styles.templateCard + " " + styles.curatedCard
      }
    >
      <ProductPreview
        items={template.items}
        count={template.items.length}
        composition
      />
      <h3>
        <Link href={href}>{t(template.name)}</Link>
      </h3>
      <p className={styles.cardDescription}>{t(template.description)}</p>
      <div className={styles.cardMeta}>
        <ItemCount count={template.items.length} />
      </div>
      <PreviewEstimate items={template.items} />
      <div className={styles.templateActions}>
        <AddShoppingItems items={items} label="Собрать корзину" />
        <SaveShoppingTemplate
          items={items}
          templateName={t(template.name)}
          icon={<FilePlus2 size={18} aria-hidden="true" />}
        />
        <Link className="text-link" href={href}>
          {t("Посмотреть")} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
