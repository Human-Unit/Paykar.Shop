"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";
import { useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Route,
  ShoppingBasket,
  Truck,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { cents } from "@/lib/format";
import { ProductImage } from "./product-card";
import { m, usePointerLight, useReveal } from "./motion-primitives";

// Presentation snapshot from db/seed/products.json. No customer/order reads,
// catalog requests, cart mutations, or simulated order submission.
const demoProducts = [
  {
    slug: "black-tea",
    name: "Чай чёрный, 25 пакетиков",
    price: "15.00",
    image_url: "/images/products/bottle.svg",
  },
  {
    slug: "oat-cookies",
    name: "Печенье овсяное, 250 г",
    price: "12.00",
    image_url: "/images/products/chocolate.svg",
  },
  {
    slug: "honey",
    name: "Мёд цветочный, 250 г",
    price: "32.00",
    image_url: "/images/products/chocolate.svg",
  },
] as const;
const demoDelivery = 2000;
const demoSubtotal = demoProducts.reduce(
  (sum, product) => sum + cents(product.price),
  0,
);
const spring = { stiffness: 130, damping: 22, mass: 0.8 };
const orderStages = [
  {
    key: "accepted",
    label: "Принят",
    status: "Заказ принят",
    detail: "Мы получили ваш заказ",
    Icon: Check,
  },
  {
    key: "preparing",
    label: "Собираем",
    status: "Собираем заказ",
    detail: "Подготавливаем товары",
    Icon: ShoppingBasket,
  },
  {
    key: "courier",
    label: "В пути",
    status: "Курьер в пути",
    detail: "Оплата при получении",
    Icon: Truck,
  },
  {
    key: "delivered",
    label: "Доставлен",
    status: "Заказ доставлен",
    detail: "Спасибо за покупку",
    Icon: CheckCircle2,
  },
] as const;
const lastStage = orderStages.length - 1;

// Hydration uses the same stage as the server, then resolves the live preference.
function subscribeReducedMotion(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}
function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function OrderPhone() {
  const { t, money } = usePresentation();
  const reduce = useReducedMotion();
  const motionPreference = useSyncExternalStore(
    subscribeReducedMotion,
    reducedMotionSnapshot,
    () => null,
  );
  const shouldReduceMotion = motionPreference ?? reduce;
  const light = usePointerLight();
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const depth = useSpring(0, spring);
  const scale = useSpring(1, spring);
  const entrance = useReveal({ rise: 30, scale: 0.96, duration: 0.62 });
  const stageNode = useRef<HTMLDivElement>(null);
  const stageIndex = useRef(0);
  const sequenceStarted = useRef(false);
  const sequenceFinished = useRef(false);
  const [currentStage, setCurrentStage] = useState(0);
  const activeStage = motionPreference === true ? lastStage : currentStage;
  const stage = orderStages[activeStage];
  const StatusIcon = stage.Icon;

  useEffect(() => {
    const node = stageNode.current;
    if (!node) return;
    if (shouldReduceMotion) {
      // Commit the delivered state after hydration and retain it if the setting changes.
      const frame = requestAnimationFrame(() => {
        stageIndex.current = lastStage;
        sequenceStarted.current = true;
        sequenceFinished.current = true;
        setCurrentStage(lastStage);
      });
      return () => cancelAnimationFrame(frame);
    }
    if (sequenceFinished.current) return;
    let cancelled = false;
    let timer: number | undefined;

    const advance = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        const next = Math.min(stageIndex.current + 1, lastStage);
        stageIndex.current = next;
        setCurrentStage(next);
        if (next === lastStage) {
          sequenceFinished.current = true;
          return;
        }
        advance();
      }, 1400);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || sequenceStarted.current) return;
        sequenceStarted.current = true;
        observer.disconnect();
        advance();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
      if (!sequenceFinished.current) sequenceStarted.current = false;
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!shouldReduceMotion) return;
    rotateX.jump(0);
    rotateY.jump(0);
    depth.jump(0);
    scale.jump(1);
  }, [shouldReduceMotion, rotateX, rotateY, depth, scale]);

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
    depth.set(0);
    scale.set(1);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (
      shouldReduceMotion ||
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    light.onPointerMove(event);
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
    );
    const y = Math.max(
      -1,
      Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2),
    );
    rotateX.set(-y * 5);
    rotateY.set(x * 7);
    depth.set(12);
    scale.set(1.01);
  };

  return (
    <div
      ref={stageNode}
      className="phone-stage pointer-surface"
      onPointerMove={move}
      onPointerLeave={(event) => {
        light.onPointerLeave(event);
        reset();
      }}
      onPointerCancel={(event) => {
        light.onPointerCancel(event);
        reset();
      }}
      aria-hidden="true"
    >
      <span className="surface-light" />
      <m.div
        {...entrance}
        initial={{ opacity: 0, y: 30, rotateY: 6, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
        className="phone-entrance"
      >
        <m.div
          className="order-phone"
          style={{ rotateX, rotateY, z: depth, scale }}
        >
          <div className="phone-hardware">
            <i />
            <span />
          </div>
          <div className="phone-screen">
            <div className="phone-brand-row">
              <Image
                src="/images/paykar/logo.png"
                width={110}
                height={31}
                alt=""
                unoptimized
              />
              <span>{t("Пример заказа")}</span>
            </div>
            <div className="phone-confirmed">
              <span className="phone-success">
                <Check size={24} strokeWidth={2.6} />
              </span>
              <h3>{t("Заказ оформлен")}</h3>
              <p>{t("Заказ №")} DEMO-001</p>
            </div>
            <ul className="phone-order-items">
              {demoProducts.map((product) => (
                <li key={product.slug}>
                  <span className="phone-product-image">
                    <ProductImage product={product} />
                  </span>
                  <span className="phone-product-copy">
                    <strong>{t(product.name)}</strong>
                    <small>1 × {t("упак.")}</small>
                  </span>
                  <b>{money(cents(product.price))}</b>
                </li>
              ))}
            </ul>
            <div className="phone-totals">
              <p>
                <span>{t("Товары")}</span>
                <strong>{money(demoSubtotal)}</strong>
              </p>
              <p>
                <span>{t("Доставка")}</span>
                <strong>{money(demoDelivery)}</strong>
              </p>
              <p className="phone-total">
                <span>{t("Итого")}</span>
                <strong>{money(demoSubtotal + demoDelivery)}</strong>
              </p>
            </div>
            <div className="phone-delivery-status">
              <m.span
                key={stage.key + "-icon"}
                className="phone-status-icon"
                initial={
                  shouldReduceMotion || activeStage === 0
                    ? false
                    : { opacity: 0, scale: 0.92 }
                }
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
              >
                <StatusIcon size={20} />
              </m.span>
              <m.div
                key={stage.key}
                className="phone-status-copy"
                initial={
                  shouldReduceMotion || activeStage === 0
                    ? false
                    : { opacity: 0, y: 4 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
              >
                <strong>{t(stage.status)}</strong>
                <small>{t(stage.detail)}</small>
              </m.div>
            </div>
            <div className="phone-progress">
              {orderStages.map(({ key, label, Icon }, index) => {
                const StepIcon = index < activeStage ? Check : Icon;
                return (
                  <span
                    key={key}
                    data-current={index === activeStage || undefined}
                    data-complete={index < activeStage || undefined}
                  >
                    <i>
                      <StepIcon size={10} />
                    </i>
                    <small>{t(label)}</small>
                  </span>
                );
              })}
            </div>
          </div>
          <span className="phone-reflection" />
        </m.div>
      </m.div>
    </div>
  );
}

export function OrderShowcase() {
  const { t } = usePresentation();
  const copy = useReveal({ rise: 20 });
  return (
    <section className="order-showcase" aria-labelledby="order-showcase-title">
      <m.div {...copy} className="order-showcase-copy">
        <span className="eyebrow">{t("ПОКУПКИ БЕЗ ЛИШНИХ ШАГОВ")}</span>
        <h2 id="order-showcase-title">{t("От корзины до двери.")}</h2>
        <p>{t("Выбираете продукты. Видите доставку. Подтверждаете заказ.")}</p>
        <ul className="showcase-benefits">
          <li>
            <ShoppingBasket size={20} aria-hidden="true" />
            <span>{t("Покупки без регистрации")}</span>
          </li>
          <li>
            <Route size={20} aria-hidden="true" />
            <span>{t("Маршрут и стоимость — до заказа.")}</span>
          </li>
          <li>
            <CheckCircle2 size={20} aria-hidden="true" />
            <span>{t("Оплата при получении")}</span>
          </li>
        </ul>
        <Link className="button large" href="/catalog">
          {t("За покупками")}
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
        <p className="showcase-demo-note">
          {t("Демонстрационный заказ — пример оформления в Пайкар.")}
        </p>
      </m.div>
      <OrderPhone />
    </section>
  );
}
