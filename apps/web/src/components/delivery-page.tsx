"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  ReceiptText,
  Route,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type DeliveryConfig } from "@/lib/api";
import { cents } from "@/lib/format";
import { Breadcrumbs } from "./breadcrumbs";
import "./delivery-page.css";

const benefits = [
  {
    icon: Route,
    title: "Маршрут на карте",
    text: "От магазина до вашей точки — всё видно заранее.",
  },
  {
    icon: Clock3,
    title: "Время в пути",
    text: "Оценка поездки помогает спланировать покупку.",
  },
  {
    icon: Wallet,
    title: "Понятная стоимость",
    text: "Цена доставки известна до оформления заказа.",
  },
  {
    icon: ShieldCheck,
    title: "Всё под контролем",
    text: "Адрес, маршрут и итог покупки в одном месте.",
  },
];

const steps = [
  {
    icon: ShoppingBasket,
    title: "Соберите корзину",
    text: "Выберите продукты и нужное количество в каталоге.",
  },
  {
    icon: UserRound,
    title: "Укажите данные",
    text: "Добавьте имя, телефон и полный адрес без регистрации.",
  },
  {
    icon: MapPin,
    title: "Отметьте точку",
    text: "Выберите место на карте или введите координаты.",
  },
  {
    icon: Route,
    title: "Рассчитайте доставку",
    text: "Проверьте маршрут, расстояние, время в пути и цену.",
  },
  {
    icon: CheckCircle2,
    title: "Подтвердите заказ",
    text: "Выберите способ оплаты и проверьте итоговую сумму.",
  },
  {
    icon: ReceiptText,
    title: "Сохраните подтверждение",
    text: "Номер и состав заказа останутся доступны по ссылке.",
  },
];

const questions = [
  {
    question: "Сколько стоит доставка?",
    answer:
      "Стоимость доставки фиксированная. Точная сумма отображается при расчёте в оформлении и включается в итог заказа.",
    showPrice: true,
  },
  {
    question: "Когда я увижу время доставки?",
    answer:
      "После выбора точки нажмите «Рассчитать доставку» в оформлении. Вы увидите оценку времени поездки по маршруту. Она не включает сборку заказа и не является обещанием времени прибытия.",
  },
  {
    question: "Можно ли изменить адрес после оформления?",
    answer:
      "Изменить оформленный заказ на сайте пока нельзя. Обсудите возможность изменения адреса с сотрудниками магазина, указав номер заказа.",
  },
  {
    question: "Что делать, если я изменил точку или корзину?",
    answer:
      "Перед подтверждением рассчитайте доставку снова. Это нужно после изменения адреса, точки на карте или состава корзины, чтобы данные соответствовали вашей покупке.",
  },
  {
    question: "Как понять, что доставку нужно пересчитать?",
    answer:
      "В оформлении появится сообщение о необходимости нового расчёта. Подтвердить заказ получится только после расчёта для текущего адреса, точки и корзины.",
  },
];

function DeliveryRouteIllustration({ address }: { address?: string }) {
  const { t } = usePresentation();
  return (
    <div className="delivery-route-art" aria-hidden="true">
      <svg className="delivery-route-drawing" viewBox="0 0 560 360" fill="none">
        <path
          className="delivery-map-street"
          d="M-40 80H600M-40 240H600M130-20V400M410-20V400M-40 340 560-20M-40-20 600 340"
        />
        <path
          className="delivery-map-block"
          d="M174 48H360V116H174ZM174 280H316V328H174ZM450 140H522V200H450Z"
        />
        <path
          className="delivery-route-halo"
          d="M105 122V170Q105 196 132 196H344Q382 196 382 234V260Q382 292 415 292H465"
        />
        <path
          className="delivery-route-line"
          d="M105 122V170Q105 196 132 196H344Q382 196 382 234V260Q382 292 415 292H465"
        />
        <circle className="delivery-route-dot" cx="105" cy="122" r="7" />
        <circle className="delivery-route-dot" cx="465" cy="292" r="7" />
      </svg>
      <div className="delivery-route-label delivery-route-store">
        <span className="delivery-art-icon">
          <Store size={24} />
        </span>
        <div>
          <strong>{t("Магазин Пайкар")}</strong>
          <span>{address ? t(address) : t("Начало маршрута")}</span>
        </div>
      </div>
      <div className="delivery-route-vehicle">
        <Truck size={28} />
      </div>
      <div className="delivery-route-label delivery-route-destination">
        <span className="delivery-art-icon">
          <MapPin size={24} />
        </span>
        <div>
          <strong>{t("Ваша точка доставки")}</strong>
          <span>{t("Вы выбираете на карте")}</span>
        </div>
      </div>
      <span className="delivery-art-caption">{t("Схема маршрута")}</span>
    </div>
  );
}

export function DeliveryPage() {
  const { t, money } = usePresentation();
  const config = useResource<DeliveryConfig>("/delivery/config");
  return (
    <div className="delivery-page">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Доставка" }]}
      />
      <section className="delivery-hero" aria-labelledby="delivery-title">
        <div className="delivery-hero-copy">
          <span className="eyebrow">
            <Truck size={18} aria-hidden="true" />
            {t("Доставка с Пайкар")}
          </span>
          <h1 id="delivery-title">{t("Доставка")}</h1>
          <p className="delivery-hero-lead">
            {t(
              "Продукты на каждый день — с понятной доставкой до вашей двери.",
            )}
          </p>
          <p>
            {t(
              "Выберите адрес и узнайте маршрут, время в пути и стоимость до подтверждения заказа.",
            )}
          </p>
          <Link className="button" href="/catalog">
            {t("Выбрать продукты")}
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <span className="delivery-hero-note">
            <CheckCircle2 size={16} aria-hidden="true" />
            {t("Без регистрации. Всё заранее.")}
          </span>
        </div>
        <DeliveryRouteIllustration address={config.data?.store_address} />
      </section>

      <section
        className="delivery-benefits"
        aria-label={t("Преимущества доставки")}
      >
        {benefits.map(({ icon: Icon, title, text }) => (
          <div className="delivery-benefit" key={title}>
            <span className="delivery-feature-icon">
              <Icon size={24} aria-hidden="true" />
            </span>
            <div>
              <h2>{t(title)}</h2>
              <p>{t(text)}</p>
            </div>
          </div>
        ))}
      </section>

      <section
        className="delivery-process"
        aria-labelledby="delivery-process-title"
      >
        <div className="delivery-section-heading">
          <span className="eyebrow">{t("От корзины до подтверждения")}</span>
          <h2 id="delivery-process-title">{t("Как работает доставка?")}</h2>
          <p>{t("Шесть простых шагов — без лишних вопросов.")}</p>
        </div>
        <ol className="delivery-steps">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li className="delivery-step" key={title}>
              <div className="delivery-step-top">
                <span className="delivery-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon size={24} aria-hidden="true" />
              </div>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="delivery-cta" aria-labelledby="delivery-cta-title">
        <div className="delivery-cta-copy">
          <span className="eyebrow">{t("Сначала маршрут. Потом заказ.")}</span>
          <h2 id="delivery-cta-title">
            {t("Точная стоимость для вашего адреса")}
          </h2>
          <p>
            {t(
              "Укажите точку в оформлении: карта покажет дорогу от магазина, расстояние и время в пути. Проверьте стоимость и решите, когда подтвердить заказ.",
            )}
          </p>
          <Link className="button" href="/checkout">
            {t("Рассчитать доставку")}
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
        <div className="delivery-cta-art" aria-hidden="true">
          <span className="delivery-cta-ring" />
          <span className="delivery-cta-pin">
            <MapPin size={64} strokeWidth={1.5} />
          </span>
          <span className="delivery-cta-art-label">{t("Ваша точка")}</span>
        </div>
      </section>

      <section className="delivery-faq" aria-labelledby="delivery-faq-title">
        <div className="delivery-section-heading">
          <span className="eyebrow">{t("Полезно знать")}</span>
          <h2 id="delivery-faq-title">{t("Частые вопросы")}</h2>
        </div>
        <div className="delivery-faq-list">
          {questions.map(({ question, answer, showPrice }) => (
            <details className="delivery-faq-item" key={question}>
              <summary>
                <span>{t(question)}</span>
                <ChevronDown size={20} aria-hidden="true" />
              </summary>
              <div className="delivery-faq-answer">
                <p>{t(answer)}</p>
                {showPrice && config.data && (
                  <p className="delivery-fee">
                    <Wallet size={18} aria-hidden="true" />
                    {t("Стоимость доставки:")}{" "}
                    <strong>{money(cents(config.data.delivery_price))}</strong>
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
