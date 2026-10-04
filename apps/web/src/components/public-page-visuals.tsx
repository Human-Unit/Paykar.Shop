"use client";

import Image from "next/image";
import {
  CreditCard,
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
  Store,
  Tags,
  Wallet,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";

export function PaymentIllustration() {
  const { t } = usePresentation();
  return (
    <div className="payment-illustration" aria-hidden="true">
      <div className="payment-demo-card">
        <div className="payment-card-heading">
          <CreditCard size={28} />
          <span className="test-badge">{t("Тестовая оплата")}</span>
        </div>
        <span className="card-chip" />
        <strong>{t("Банковской картой")}</strong>
        <small>{t("Не вводите данные настоящей банковской карты.")}</small>
      </div>
      <div className="payment-cash-note">
        <Wallet size={22} />
        <span>{t("Наличными при получении")}</span>
      </div>
    </div>
  );
}

export function ReturnsIllustration() {
  const { t } = usePresentation();
  return (
    <div className="returns-illustration" aria-hidden="true">
      <div className="support-package">
        <Package size={88} strokeWidth={1.2} />
        <span className="support-return">
          <RotateCcw size={28} />
        </span>
      </div>
      <div className="support-receipt">
        <span className="eyebrow">{t("Номер заказа")}</span>
        <i />
        <i />
        <i />
      </div>
      <div className="support-conversation">
        <MessageCircle size={24} />
        <span>{t("Обсудите решение")}</span>
      </div>
    </div>
  );
}

export function OffersIllustration() {
  return (
    <div className="offers-illustration" aria-hidden="true">
      <Image
        src="/images/paykar/produce.webp"
        width={320}
        height={320}
        alt=""
        unoptimized
      />
      <span className="offer-symbol">
        <Tags size={48} strokeWidth={1.4} />
      </span>
    </div>
  );
}

export function LocationIllustration() {
  const { t } = usePresentation();
  return (
    <div className="location-illustration" aria-hidden="true">
      <span className="location-street street-horizontal" />
      <span className="location-street street-vertical" />
      <span className="location-pin">
        <MapPin size={56} strokeWidth={1.4} />
      </span>
      <div className="location-marker-label">
        <Store size={24} />
        <div>
          <strong>{t("Магазин Пайкар")}</strong>
          <span>{t("Адрес и карта")}</span>
        </div>
      </div>
    </div>
  );
}
