"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { Brand } from "./brand";
export function NotFoundView() {
  const { t } = usePresentation();
  return (
    <section className="not-found-page">
      <div className="not-found-brand">
        <Brand />
      </div>
      <span className="not-found-number" aria-hidden="true">
        404
      </span>
      <h1>{t("Страница не найдена")}</h1>
      <p>
        {t(
          "Возможно, адрес изменился. Вернитесь на главную или найдите нужные товары в каталоге.",
        )}
      </p>
      <div className="page-actions">
        <Link className="button" href="/">
          {t("На главную")}
        </Link>
        <Link className="button secondary" href="/catalog">
          {t("В каталог")} <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
