"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Order, useResource } from "@/lib/api";
import { cents } from "@/lib/format";
import { Failure, Loading } from "./states";
import {
  CheckCircle2,
  Bookmark,
  Route,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
export function OrderConfirmation({ id }: { id: string }) {
  const { t, money, distance, duration, locale } = usePresentation();
  const validID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const resource = useResource<Order>(
    validID ? `/orders/${encodeURIComponent(id)}` : null,
  );
  if (!validID || resource.error?.status === 404) notFound();
  if (resource.loading) return <Loading label="Загружаем заказ…" />;
  if (resource.error)
    return <Failure error={resource.error} retry={resource.retry} />;
  const order = resource.data;
  if (!order) return null;
  const statuses: Record<string, string> = {
    pending: "Получен",
    confirmed: "Подтверждён",
    delivering: "В пути",
    completed: "Доставлен",
    cancelled: "Отменён",
  };
  return (
    <div className="polish-page confirmation">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Подтверждение заказа" },
        ]}
      />
      <div className="confirmation-heading">
        <span className="confirmation-check" aria-hidden="true">
          <CheckCircle2 size={40} strokeWidth={1.6} />
        </span>
        <div className="eyebrow">{t("Подтверждение заказа")}</div>
        <h1>{t("Спасибо! Заказ получен")}</h1>
        <p>
          {t("Сохраните ссылку на эту страницу, чтобы открыть заказ снова.")}
        </p>
      </div>
      <div className="confirmation-layout">
        <section className="checkout-panel confirmation-info">
          <h2>
            {t("Заказ ")}
            <span className="order-id">{order.id}</span>
          </h2>
          <dl className="order-details">
            <div>
              <dt>{t("Статус")}</dt>
              <dd>{t(statuses[order.status] || order.status)}</dd>
            </div>
            <div>
              <dt>{t("Создан")}</dt>
              <dd>{new Date(order.created_at).toLocaleString(locale)}</dd>
            </div>
            <div>
              <dt>{t("Получатель")}</dt>
              <dd>{order.customer_name}</dd>
            </div>
            <div>
              <dt>{t("Адрес")}</dt>
              <dd>{order.address}</dd>
            </div>
          </dl>
          <dl className="order-details">
            <div>
              <dt>{t("Способ оплаты")}</dt>
              <dd>
                {t(order.payment_method === "card" ? "Карта" : "Наличными")}
              </dd>
            </div>
            <div>
              <dt>{t("Статус оплаты")}</dt>
              <dd>
                {t(
                  order.payment_status === "paid"
                    ? "Оплачено"
                    : "Оплата при получении",
                )}
              </dd>
            </div>
          </dl>
          <div className="route-metrics">
            <span>
              <Route size={20} aria-hidden="true" />
              <small>{t("Расстояние")}</small>
              <strong>{distance(order.distance_meters)}</strong>
            </span>
            <span>
              <Clock3 size={20} aria-hidden="true" />
              <small>{t("Время в пути")}</small>
              <strong>{duration(order.delivery_duration_seconds)}</strong>
            </span>
          </div>
          <p className="confirmation-save-note">
            <Bookmark size={20} aria-hidden="true" />
            {t("Сохраните ссылку на эту страницу, чтобы открыть заказ снова.")}
          </p>
        </section>
        <section className="checkout-panel confirmation-purchases">
          <h2>{t("Ваши покупки")}</h2>
          <div className="confirmation-items">
            {order.items.map((item) => (
              <div key={item.product_id}>
                <span>
                  {t(item.product_name)}
                  <small>
                    {Number(item.quantity)} × {money(cents(item.unit_price))}
                  </small>
                </span>
                <strong>{money(cents(item.total_price))}</strong>
              </div>
            ))}
          </div>
          <div className="confirmation-totals">
            <p>
              {t("Товары ")}
              <strong>{money(cents(order.subtotal))}</strong>
            </p>
            <p>
              {t("Доставка ")}
              <strong>{money(cents(order.delivery_price))}</strong>
            </p>
            <p className="summary-total">
              {t("Итого ")}
              <strong>{money(cents(order.total))}</strong>
            </p>
          </div>
        </section>
      </div>
      <div className="page-actions confirmation-actions">
        <Link href="/catalog" className="button">
          {t("Продолжить покупки")} <ArrowRight size={20} aria-hidden="true" />
        </Link>
        <Link href="/" className="button secondary">
          {t("На главную")}
        </Link>
      </div>
    </div>
  );
}
