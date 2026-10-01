"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/cart";
import {
  api,
  ApiError,
  DeliveryConfig,
  Order,
  Point,
  Quote,
  useResource,
} from "@/lib/api";
import { cents, distance, duration, money } from "@/lib/format";
import { Empty } from "./states";

const Map = dynamic(() => import("./delivery-map"), {
  ssr: false,
  loading: () => (
    <div className="delivery-map message" role="status">
      Загружаем карту…
    </div>
  ),
});
type Review = { key: string; subtotal: number; total: number; fee: number };

export function Checkout() {
  const cart = useCart();
  const router = useRouter();
  const config = useResource<DeliveryConfig>("/delivery/config");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [locationRevision, setLocationRevision] = useState(0);
  const [quoted, setQuoted] = useState<{ key: string; value: Quote }>();
  const [review, setReview] = useState<Review>();
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const quoteRequest = useRef<AbortController | null>(null);
  const point = useMemo<Point | null>(
    () =>
      lat.trim() &&
      lon.trim() &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lon)) &&
      Math.abs(Number(lat)) <= 90 &&
      Math.abs(Number(lon)) <= 180
        ? { latitude: Number(lat), longitude: Number(lon) }
        : null,
    [lat, lon],
  );
  const locationKey = `${locationRevision}|${address.trim()}|${lat}|${lon}`;
  const cartKey = JSON.stringify(cart.items);
  const key = `${locationKey}|${cartKey}`;
  const latestKey = useRef(key);
  useEffect(() => {
    latestKey.current = key;
  }, [key]);
  useEffect(() => () => quoteRequest.current?.abort(), []);
  const quote = quoted?.key === key ? quoted.value : undefined;
  const refreshed = review?.key === key ? review : undefined;
  const subtotal =
    refreshed?.subtotal ??
    cart.items.reduce((sum, item) => {
      const product = cart.products.find((p) => p.id === item.product_id);
      return sum + (product ? cents(product.price) * item.quantity : 0);
    }, 0);
  const fee = refreshed?.fee ?? (quote ? cents(quote.delivery_price) : 0);
  const total = refreshed?.total ?? subtotal + fee;
  const invalidStock = cart.items.some((item) => {
    const product = cart.products.find((p) => p.id === item.product_id);
    return (
      !product ||
      !product.is_active ||
      Number(product.stock_quantity) < item.quantity
    );
  });
  const validCustomer =
    name.trim().length >= 2 &&
    name.trim().length <= 100 &&
    /^\+?[\d ()-]+$/.test(phone.trim()) &&
    phone.replace(/\D/g, "").length >= 7 &&
    phone.replace(/\D/g, "").length <= 15 &&
    address.trim().length >= 5;
  async function calculate() {
    if (!point || address.trim().length < 5) {
      setError(
        "Введите адрес (не менее 5 символов) и выберите корректную точку доставки.",
      );
      return;
    }
    quoteRequest.current?.abort();
    const controller = new AbortController();
    quoteRequest.current = controller;
    const requestKey = key;
    setQuoting(true);
    setError("");
    setQuoted(undefined);
    setReview(undefined);
    try {
      const value = await api<Quote>("/delivery/quote", controller.signal, {
        address: address.trim(),
        ...point,
      });
      if (latestKey.current === requestKey && !controller.signal.aborted)
        setQuoted({ key: requestKey, value });
    } catch (error) {
      if (!controller.signal.aborted && latestKey.current === requestKey)
        setError(
          error instanceof Error
            ? error.message
            : "Не удалось рассчитать доставку.",
        );
    } finally {
      if (quoteRequest.current === controller) setQuoting(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      busy.current ||
      !quote ||
      !point ||
      invalidStock ||
      !validCustomer ||
      cart.loading
    )
      return;
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const order = await api<Order>("/orders", undefined, {
        customer_name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim() || null,
        ...point,
        items: cart.items,
        expected_total: (total / 100).toFixed(2),
      });
      cart.clear();
      router.push(`/order/${order.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось оформить заказ. Корзина сохранена.",
      );
      if (error instanceof ApiError && error.status === 409) {
        const detail = error.detail;
        if (
          detail?.code === "total_changed" &&
          typeof detail.subtotal === "string" &&
          typeof detail.total === "string" &&
          typeof detail.delivery_price === "string"
        ) {
          setReview({
            key,
            subtotal: cents(detail.subtotal),
            total: cents(detail.total),
            fee: cents(detail.delivery_price),
          });
          // Explicit review is required; the next click submits the newly displayed total.
          setQuoted(undefined);
        }
        cart.retry();
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }
  function select(point: Point) {
    setLat(point.latitude.toFixed(6));
    setLon(point.longitude.toFixed(6));
    invalidateLocation();
  }
  function invalidateLocation() {
    quoteRequest.current?.abort();
    setQuoting(false);
    setLocationRevision((value) => value + 1);
    setError("");
  }
  if (!cart.items.length)
    return (
      <Empty
        title="Корзина пуста"
        text="Добавьте товары, чтобы оформить доставку."
      />
    );
  return (
    <>
      <p className="breadcrumb">
        <Link href="/cart">Корзина</Link> / Оформление
      </p>
      <div className="page-title">
        <h1>Оформление заказа</h1>
        <p>Без регистрации · с доставкой до вашей двери</p>
      </div>
      <form
        onSubmit={submit}
        className="checkout-layout"
        aria-busy={submitting}
        aria-describedby={error ? "checkout-error" : undefined}
      >
        <div className="checkout-sections">
          <section className="checkout-panel">
            <h2>1. Контактные данные</h2>
            <div className="field-grid">
              <label>
                Ваше имя
                <input
                  name="customer_name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label>
                Телефон
                <input
                  aria-label="Телефон"
                  aria-describedby="phone-hint"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  pattern="\+?[0-9 ()\-]{7,30}"
                  placeholder="+992 …"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                />
                <small id="phone-hint">От 7 до 15 цифр, с кодом страны.</small>
              </label>
            </div>
            <label>
              Адрес доставки
              <input
                name="address"
                autoComplete="street-address"
                required
                minLength={5}
                maxLength={300}
                placeholder="Улица, дом, квартира"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  invalidateLocation();
                }}
                disabled={submitting}
              />
            </label>
            <label>
              Комментарий (необязательно)
              <textarea
                aria-label="Комментарий (необязательно)"
                name="comment"
                rows={3}
                maxLength={1000}
                placeholder="Подъезд, этаж, ориентир…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              />
            </label>
          </section>
          <section className="checkout-panel">
            <h2>2. Куда доставить?</h2>
            <p>
              Нажмите на карту, чтобы указать точку у дороги. Её можно изменить
              или ввести координаты вручную.
            </p>
            <Map
              config={config.data}
              point={point}
              quote={quote}
              onSelect={select}
              disabled={submitting}
            />
            <div className="map-legend">
              <span>М — магазин</span>
              <span>● — ваша точка</span>
            </div>
            <div className="field-grid">
              <label>
                Широта
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  required
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                    invalidateLocation();
                  }}
                  disabled={submitting}
                />
              </label>
              <label>
                Долгота
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  required
                  value={lon}
                  onChange={(e) => {
                    setLon(e.target.value);
                    invalidateLocation();
                  }}
                  disabled={submitting}
                />
              </label>
            </div>
            <div className="delivery-status" aria-live="polite">
              {!point ? (
                <p>Выберите точку доставки.</p>
              ) : quote ? (
                <div className="route-metrics">
                  <span>
                    Расстояние<strong>{distance(quote.distance_meters)}</strong>
                  </span>
                  <span>
                    Время в пути
                    <strong>{duration(quote.duration_seconds)}</strong>
                  </span>
                  <span>
                    Доставка
                    <strong>{money(cents(quote.delivery_price))}</strong>
                  </span>
                </div>
              ) : (
                <p>
                  {quoted
                    ? "Точка, адрес или корзина изменились. Рассчитайте доставку заново."
                    : "Точка выбрана. Рассчитайте доставку для проверки маршрута."}
                </p>
              )}
              {config.data && !config.data.available && (
                <p className="stock-warning">
                  Доставка пока недоступна. Ваши товары остаются в корзине.
                </p>
              )}
              {config.error && (
                <p role="alert">
                  {config.error.message}{" "}
                  <button
                    type="button"
                    className="text-link"
                    onClick={config.retry}
                  >
                    Повторить
                  </button>
                </p>
              )}
            </div>
            <button
              className="button"
              type="button"
              disabled={
                !point || address.trim().length < 5 || quoting || submitting
              }
              onClick={calculate}
            >
              {quoting ? "Рассчитываем маршрут…" : "Рассчитать доставку"}
            </button>
            <p className="field-hint">
              Время в пути — оценка маршрута без сборки заказа. Стоимость
              доставки фиксированная.
            </p>
          </section>
        </div>
        <aside className="cart-summary checkout-summary">
          <h2>Ваш заказ</h2>
          {cart.items.map((item) => {
            const product = cart.products.find((p) => p.id === item.product_id);
            return (
              <div className="checkout-item" key={item.product_id}>
                <span>
                  {product?.name || "Товар недоступен"}
                  <small>
                    {item.quantity} ×{" "}
                    {product ? money(cents(product.price)) : "—"}
                  </small>
                </span>
                <strong>
                  {product ? money(cents(product.price) * item.quantity) : "—"}
                </strong>
              </div>
            );
          })}
          {cart.loading && <p role="status">Проверяем товары…</p>}
          {cart.error && (
            <p role="alert">
              {cart.error.message}{" "}
              <button type="button" className="text-link" onClick={cart.retry}>
                Повторить
              </button>
            </p>
          )}
          {!cart.loading && invalidStock && (
            <p className="stock-warning">
              Проверьте наличие и количество товаров в{" "}
              <Link href="/cart">корзине</Link>.
            </p>
          )}
          <div>
            <span>Товары</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>Доставка</span>
            <strong>{quote ? money(fee) : "После расчёта"}</strong>
          </div>
          <div className="summary-total">
            <span>Итого{!quote ? " без доставки" : ""}</span>
            <strong data-testid="checkout-total">
              {money(quote ? total : subtotal)}
            </strong>
          </div>
          {error && (
            <p className="checkout-error" id="checkout-error" role="alert">
              {error} Корзина и введённые данные сохранены.
            </p>
          )}
          {!validCustomer && (
            <p className="field-hint">
              Укажите имя (от 2 символов), телефон (7–15 цифр) и полный адрес
              (от 5 символов).
            </p>
          )}
          {!quote && (
            <p className="field-hint">
              Для оформления нужен актуальный расчёт доставки.
            </p>
          )}
          <button
            className="button"
            type="submit"
            disabled={
              !quote ||
              !validCustomer ||
              invalidStock ||
              cart.loading ||
              !!cart.error ||
              submitting ||
              quoting
            }
          >
            {submitting ? "Оформляем заказ…" : "Оформить заказ"}
          </button>
          <p className="field-hint">
            При оформлении проверим цены, остатки и маршрут ещё раз. Оплата не
            требуется в учебном проекте.
          </p>
          <Link href="/cart" className="text-link">
            Изменить корзину
          </Link>
        </aside>
      </form>
    </>
  );
}
