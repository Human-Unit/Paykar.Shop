"use client";

import Link from "next/link";
import { ArrowRight, Home, ShoppingBasket } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import styles from "./not-found-view.module.css";

export function NotFoundView() {
  const { t } = usePresentation();

  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.code} aria-hidden="true">
        <span className={styles.digit}>4</span>
        <span className={styles.zero}>
          <ShoppingBasket />
        </span>
        <span className={styles.digit}>4</span>
      </div>

      <div className={styles.copy}>
        <h1 id="not-found-title">{t("Страница не найдена")}</h1>
        <p>
          {t(
            "Возможно, адрес изменился. Вернитесь на главную или найдите нужные товары в каталоге.",
          )}
        </p>

        <div className={styles.actions}>
          <Link className="button" href="/catalog">
            {t("В каталог")} <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <Link className="button secondary" href="/">
            <Home size={18} aria-hidden="true" /> {t("На главную")}
          </Link>
        </div>

        <Link className={styles.secondaryLink} href="/my-shopping">
          {t("Мои покупки")} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
