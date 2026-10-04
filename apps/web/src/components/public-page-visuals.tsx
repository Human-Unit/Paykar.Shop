"use client";

import Image from "next/image";
import {
  MapPin,
  MessageCircle,
  Package,
  RotateCcw,
  Store,
  Tags,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";

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
  const { t } = usePresentation();
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
      <div className="offer-caption">
        <strong>{t("Акции")}</strong>
        <span>{t("Скидки относительно прежних цен.")}</span>
      </div>
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
