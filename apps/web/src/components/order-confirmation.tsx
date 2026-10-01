"use client";

import Link from "next/link";
import { Order, useResource } from "@/lib/api";
import { cents, distance, duration, money } from "@/lib/format";
import { Empty, Failure } from "./states";

export function OrderConfirmation({ id }: { id: string }) {
  const validID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const resource = useResource<Order>(
    validID ? `/orders/${encodeURIComponent(id)}` : null,
  );
  if (!validID || resource.error?.status === 404)
    return (
      <Empty
        title="Заказ не найден"
        text="Проверьте сохранённую ссылку на заказ. Вы можете вернуться в каталог или открыть корзину."
      />
    );
  if (resource.loading)
    return (
      <div className="message" role="status">
        Загружаем заказ…
      </div>
    );
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
    <div className="confirmation">
      <div className="confirmation-heading">
        <span aria-hidden="true">✓</span>
        <h1>Спасибо! Заказ получен</h1>
        <p>Сохраните ссылку на эту страницу, чтобы открыть заказ снова.</p>
      </div>
      <section className="checkout-panel">
        <h2>
          Заказ <span className="order-id">{order.id}</span>
        </h2>
        <dl className="order-details">
          <div>
            <dt>Статус</dt>
            <dd>{statuses[order.status] || order.status}</dd>
          </div>
          <div>
            <dt>Создан</dt>
            <dd>{new Date(order.created_at).toLocaleString("ru")}</dd>
          </div>
          <div>
            <dt>Получатель</dt>
            <dd>{order.customer_name}</dd>
          </div>
          <div>
            <dt>Адрес</dt>
            <dd>{order.address}</dd>
          </div>
        </dl>
        <h2>Ваши покупки</h2>
        <div className="confirmation-items">
          {order.items.map((item) => (
            <div key={item.product_id}>
              <span>
                {item.product_name}
                <small>
                  {Number(item.quantity)} × {money(cents(item.unit_price))}
                </small>
              </span>
              <strong>{money(cents(item.total_price))}</strong>
            </div>
          ))}
        </div>
        <div className="route-metrics">
          <span>
            Расстояние<strong>{distance(order.distance_meters)}</strong>
          </span>
          <span>
            Время в пути
            <strong>{duration(order.delivery_duration_seconds)}</strong>
          </span>
        </div>
        <div className="confirmation-totals">
          <p>
            Товары <strong>{money(cents(order.subtotal))}</strong>
          </p>
          <p>
            Доставка <strong>{money(cents(order.delivery_price))}</strong>
          </p>
          <p className="summary-total">
            Итого <strong>{money(cents(order.total))}</strong>
          </p>
        </div>
      </section>
      <Link href="/catalog" className="button">
        Продолжить покупки
      </Link>
    </div>
  );
}
