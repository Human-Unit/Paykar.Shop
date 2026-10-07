"use client";
import dynamic from "next/dynamic";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/cart";
import {
  api,
  ApiError,
  DeliveryConfig,
  Order,
  Payment,
  PaymentConfirmation,
  Point,
  Quote,
  useResource,
} from "@/lib/api";
import { cents } from "@/lib/format";
import { rememberOrder } from "@/lib/shopping-storage";
import { Empty } from "./states";
import { SandboxCard, validSandbox, type SandboxFields } from "./sandbox-card";
import {
  Check,
  UserRound,
  MapPin,
  CreditCard,
  Wallet,
  Route,
  Clock3,
  ShoppingBasket,
} from "lucide-react";
import { ProductImage } from "./product-card";
import { Breadcrumbs } from "./breadcrumbs";
import { PageIntro } from "./page-patterns";
const Map = dynamic(() => import("./delivery-map"), {
  ssr: false,
  loading: MapLoading,
});
function MapLoading() {
  const { t } = usePresentation();
  return (
    <div className="delivery-map message map-loading" role="status">
      <MapPin size={32} aria-hidden="true" />
      <span>{t("Загружаем карту…")}</span>
    </div>
  );
}
type Review = {
  key: string;
  subtotal: number;
  total: number;
  fee: number;
};
export function Checkout() {
  const { t, money, distance, duration } = usePresentation();
  const cart = useCart();
  const router = useRouter();
  const config = useResource<DeliveryConfig>("/delivery/config");
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [card, setCard] = useState<SandboxFields>({
    number: "",
    expiry: "",
    cvv: "",
    holder: "",
  });
  // Ephemeral idempotency state contains checkout details, never card-form fields.
  const attempt = useRef<{
    fingerprint: string;
    key: string;
    payment?: Payment;
  } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [locationRevision, setLocationRevision] = useState(0);
  const [quoted, setQuoted] = useState<{
    key: string;
    value: Quote;
  }>();
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
      cart.loading ||
      !!cart.error ||
      quoting ||
      (method === "card" && !validSandbox(card))
    )
      return;
    busy.current = true;
    setSubmitting(true);
    setError("");
    try {
      const checkout = {
        customer_name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim() || null,
        ...point,
        items: cart.items,
        expected_total: (total / 100).toFixed(2),
        payment_method: method,
      };
      const fingerprint = JSON.stringify(checkout);
      if (!attempt.current || attempt.current.fingerprint !== fingerprint)
        attempt.current = { fingerprint, key: crypto.randomUUID() };
      const current = attempt.current;
      const request = { ...checkout, idempotency_key: current.key };
      let order: Order;
      if (method === "card" && validSandbox(card)) {
        // Only a synthetic scenario is sent; number/expiry/CVV/holder never leave this component.
        if (!current.payment)
          current.payment = await api<Payment>(
            "/payments/sandbox/session",
            undefined,
            request,
          );
        const result = await api<PaymentConfirmation>(
          "/payments/sandbox/confirm",
          undefined,
          { payment_id: current.payment.id, scenario: card.number },
        );
        current.payment = result.payment;
        if (!result.order) {
          const messages: Record<string, string> = {
            declined:
              "Тестовая оплата отклонена. Выберите другой сценарий и повторите попытку.",
            insufficient_funds:
              "Недостаточно средств в тестовом сценарии. Выберите другой сценарий.",
            processing_error:
              "Не удалось обработать тестовую оплату. Повторите попытку.",
            session_expired: "Срок тестовой оплаты истёк. Повторите попытку.",
          };
          if (result.payment.status === "cancelled") attempt.current = null;
          throw new Error(
            messages[result.payment.failure_reason || "processing_error"] ||
              messages.processing_error,
          );
        }
        order = result.order;
      } else order = await api<Order>("/orders", undefined, request);
      cart.clear();
      rememberOrder(order.id);
      router.push(`/order/${order.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось оформить заказ. Корзина сохранена.",
      );
      if (error instanceof ApiError && error.status === 409) {
        attempt.current = null;
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
        title={t("Корзина пуста")}
        text={t("Добавьте товары, чтобы оформить доставку.")}
      />
    );
  // Presentation only: mirrors the checks the submit button already applies.
  const steps = [
    { id: "checkout-contact", label: "Контактные данные", done: validCustomer },
    { id: "checkout-delivery", label: "Доставка", done: !!quote },
    {
      id: "checkout-payment",
      label: "Способ оплаты",
      done: method === "cash" || validSandbox(card),
    },
    { id: "checkout-summary", label: "Ваш заказ", done: false },
  ];
  const currentStep = steps.findIndex((step) => !step.done);
  return (
    <div className="polish-page checkout-page">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Корзина", href: "/cart" },
          { label: "Оформление заказа" },
        ]}
      />
      <PageIntro
        eyebrow="Всё заранее"
        title="Оформление заказа"
        description="Без регистрации · с доставкой до вашей двери"
        icon={ShoppingBasket}
      />
      <nav className="checkout-steps" aria-label={t("Шаги оформления")}>
        <ol>
          {steps.map(({ id, label, done }, index) => (
            <li key={id} data-done={done || undefined}>
              <a
                href={`#${id}`}
                aria-current={index === currentStep ? "step" : undefined}
              >
                <span className="checkout-step-mark">
                  {done ? <Check size={16} aria-hidden="true" /> : index + 1}
                </span>
                <span>{t(label)}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <form
        onSubmit={submit}
        className="checkout-layout"
        aria-busy={submitting}
        aria-describedby={error ? "checkout-error" : undefined}
      >
        <div className="checkout-sections">
          <section className="checkout-panel" id="checkout-contact">
            <h2 className="checkout-step-heading">
              <span className="flow-number">01</span>
              <UserRound size={22} aria-hidden="true" />
              <span>{t("Контактные данные")}</span>
            </h2>
            <div className="field-grid">
              <label>
                {t("Ваше имя")}
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
                {t("Телефон")}
                <input
                  aria-label={t("Телефон")}
                  aria-describedby="phone-hint"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={30}
                  pattern="\+?[0-9 \(\)\-]{7,30}"
                  placeholder="+992 …"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                />
                <small id="phone-hint">
                  {t("От 7 до 15 цифр, с кодом страны.")}
                </small>
              </label>
            </div>
            <label>
              {t("Адрес доставки")}
              <input
                name="address"
                autoComplete="street-address"
                required
                minLength={5}
                maxLength={300}
                placeholder={t("Улица, дом, квартира")}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  invalidateLocation();
                }}
                disabled={submitting}
              />
            </label>
            <label>
              {t("Комментарий (необязательно)")}
              <textarea
                aria-label={t("Комментарий (необязательно)")}
                name="comment"
                rows={3}
                maxLength={1000}
                placeholder={t("Подъезд, этаж, ориентир…")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              />
            </label>
          </section>
          <section className="checkout-panel" id="checkout-delivery">
            <h2 className="checkout-step-heading">
              <span className="flow-number">02</span>
              <MapPin size={22} aria-hidden="true" />
              <span>{t("Доставка")}</span>
            </h2>
            <p>
              {t(
                "Нажмите на карту, чтобы указать точку у дороги. Её можно изменить или ввести координаты вручную.",
              )}
            </p>
            <Map
              config={config.data}
              point={point}
              quote={quote}
              onSelect={select}
              disabled={submitting}
            />
            <div className="map-legend">
              <span>{t("М — магазин")}</span>
              <span>{t("● — ваша точка")}</span>
            </div>
            <div className="field-grid">
              <label>
                {t("Широта")}
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
                {t("Долгота")}
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
                <p>{t("Выберите точку доставки.")}</p>
              ) : quote ? (
                <div className="route-metrics">
                  <span>
                    <Route size={20} aria-hidden="true" />
                    <small>{t("Расстояние")}</small>
                    <strong>{distance(quote.distance_meters)}</strong>
                  </span>
                  <span>
                    <Clock3 size={20} aria-hidden="true" />
                    <small>{t("Время в пути")}</small>
                    <strong>{duration(quote.duration_seconds)}</strong>
                  </span>
                  <span>
                    <Wallet size={20} aria-hidden="true" />
                    <small>{t("Доставка")}</small>
                    <strong>{money(cents(quote.delivery_price))}</strong>
                  </span>
                </div>
              ) : (
                <p>
                  {quoted
                    ? t(
                        "Точка, адрес или корзина изменились. Рассчитайте доставку заново.",
                      )
                    : t(
                        "Точка выбрана. Рассчитайте доставку для проверки маршрута.",
                      )}
                </p>
              )}
              {config.data && !config.data.available && (
                <p className="stock-warning">
                  {t(
                    "Доставка пока недоступна. Ваши товары остаются в корзине.",
                  )}
                </p>
              )}
              {config.error && (
                <p role="alert">
                  {t(config.error.message)}{" "}
                  <button
                    type="button"
                    className="text-link"
                    onClick={config.retry}
                  >
                    {t("Повторить")}
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
              {quoting ? t("Рассчитываем маршрут…") : t("Рассчитать доставку")}
            </button>
            <p className="field-hint">
              {t(
                "Время в пути — оценка маршрута без сборки заказа. Стоимость доставки фиксированная.",
              )}
            </p>
          </section>
          <section
            className="checkout-panel payment-panel"
            id="checkout-payment"
          >
            <h2 className="checkout-step-heading">
              <span className="flow-number">03</span>
              <CreditCard size={22} aria-hidden="true" />
              <span>{t("Способ оплаты")}</span>
            </h2>
            <fieldset className="payment-methods" disabled={submitting}>
              <legend className="sr-only">{t("Способ оплаты")}</legend>
              <label>
                <Wallet size={22} aria-hidden="true" />
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={method === "cash"}
                  onChange={() => setMethod("cash")}
                />
                {t("Наличными при получении")}
              </label>
              <label>
                <CreditCard size={22} aria-hidden="true" />
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  checked={method === "card"}
                  onChange={() => setMethod("card")}
                />
                {t("Банковской картой")}
              </label>
            </fieldset>
            {method === "card" && (
              <SandboxCard
                value={card}
                onChange={setCard}
                disabled={submitting}
                error={!!error}
              />
            )}
          </section>
        </div>
        <aside className="cart-summary checkout-summary" id="checkout-summary">
          <h2 className="checkout-step-heading">
            <span className="flow-number">04</span>
            <span>{t("Ваш заказ")}</span>
          </h2>
          {cart.items.map((item) => {
            const product = cart.products.find((p) => p.id === item.product_id);
            return (
              <div className="checkout-item" key={item.product_id}>
                <span className="thumb">
                  {product && <ProductImage product={product} />}
                </span>
                <span>
                  {t(product?.name) || t("Товар недоступен")}
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
          {cart.loading && <p role="status">{t("Проверяем товары…")}</p>}
          {cart.error && (
            <p role="alert">
              {t(cart.error.message)}{" "}
              <button type="button" className="text-link" onClick={cart.retry}>
                {t("Повторить")}
              </button>
            </p>
          )}
          {!cart.loading && invalidStock && (
            <p className="stock-warning">
              {t("Проверьте наличие и количество товаров в")}{" "}
              <Link href="/cart">{t("корзине")}</Link>.
            </p>
          )}
          <div>
            <span>{t("Товары")}</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>{t("Доставка")}</span>
            <strong>{quote ? money(fee) : t("После расчёта")}</strong>
          </div>
          <div className="summary-payment-method">
            <span>{t("Способ оплаты")}</span>
            <strong>
              {t(method === "card" ? "Тестовая оплата" : "Наличными")}
            </strong>
          </div>
          <div className="summary-total">
            <span>
              {t("Итого")}
              {!quote ? t(" без доставки") : ""}
            </span>
            <strong data-testid="checkout-total">
              {money(quote ? total : subtotal)}
            </strong>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {submitting
              ? t(
                  method === "card"
                    ? "Обрабатываем тестовую оплату…"
                    : "Оформляем заказ…",
                )
              : ""}
          </p>
          {error && (
            <p className="checkout-error" id="checkout-error" role="alert">
              {t(error)}
              {t(" Корзина и введённые данные сохранены.")}
            </p>
          )}
          {!validCustomer && (
            <p className="field-hint">
              {t(
                "Укажите имя (от 2 символов), телефон (7–15 цифр) и полный адрес (от 5 символов).",
              )}
            </p>
          )}
          {!quote && (
            <p className="field-hint">
              {t("Для оформления нужен актуальный расчёт доставки.")}
            </p>
          )}
          <button
            className="button"
            type="submit"
            disabled={
              !quote ||
              !validCustomer ||
              (method === "card" && !validSandbox(card)) ||
              invalidStock ||
              cart.loading ||
              !!cart.error ||
              submitting ||
              quoting
            }
          >
            {submitting
              ? t(
                  method === "card"
                    ? "Обрабатываем тестовую оплату…"
                    : "Оформляем заказ…",
                )
              : t(
                  method === "card"
                    ? "Оплатить и оформить заказ"
                    : "Оформить заказ",
                )}
          </button>
          <p className="field-hint">
            {t(
              "Перед подтверждением проверим цены, наличие и итоговую стоимость заказа.",
            )}
          </p>
          <Link href="/cart" className="text-link">
            {t("Изменить корзину")}
          </Link>
        </aside>
      </form>
    </div>
  );
}
