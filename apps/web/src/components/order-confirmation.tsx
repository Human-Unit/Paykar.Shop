"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Order, useResource } from "@/lib/api";
import { cents } from "@/lib/format";
import { Failure, Loading } from "./states";
import { Bookmark, Route, Clock3, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "./breadcrumbs";
import { m, useReveal } from "./motion-primitives";
import { OrderShoppingActions } from "./my-shopping";
export function OrderConfirmation({ id }: { id: string }) {
  const { t, money, distance, duration, locale } = usePresentation();
  const success = useReveal({ rise: 0, scale: 0.6, inView: false });
  const heading = useReveal({ rise: 12, delay: 0.06, inView: false });
  const details = useReveal({ rise: 0, delay: 0.12 });
  const validID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const resource = useResource<Order>(
    validID ? `/orders/${encodeURIComponent(id)}` : null,
  );
  if (!validID || resource.error?.status === 404) notFound();
  if (resource.loading)
    return <Loading kind="confirmation" label="Загружаем заказ…" />;
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
      <m.div {...heading} className="confirmation-heading">
        <m.span {...success} className="confirmation-check" aria-hidden="true">
          {/* Drawn stroke by stroke in CSS; pathLength normalises the dashes. */}
          <svg viewBox="0 0 52 52" fill="none">
            <circle
              className="check-ring"
              cx="26"
              cy="26"
              r="23"
              pathLength="1"
            />
            <path className="check-mark" d="M15 27l8 8 15-17" pathLength="1" />
          </svg>
        </m.span>
        <div className="eyebrow">{t("Подтверждение заказа")}</div>
        <h1>{t("Спасибо! Заказ получен")}</h1>
        <p>
          {t("Сохраните ссылку на эту страницу, чтобы открыть заказ снова.")}
        </p>
      </m.div>
      <m.div {...details} className="confirmation-layout">
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
      </m.div>
      <OrderShoppingActions order={order} />
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
