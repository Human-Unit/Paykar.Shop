"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Tags } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type ProductPage } from "@/lib/api";
import type { StorePage } from "@/lib/store-content";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import {
  ProductCard,
  ProductImage,
  imageIllustrationLabel,
} from "./product-card";
import styles from "./promotions-page.module.css";

export function PromotionsPage({ page: content }: { page: StorePage }) {
  const { t, locale } = usePresentation();
  const [page, setPage] = useState(1);
  const products = useResource<ProductPage>(
    `/products?on_sale=true&page=${page}&page_size=24`,
  );
  const images = products.data?.items.slice(0, 3) ?? [];
  const imageLabel = images.map(imageIllustrationLabel).find(Boolean);
  const total = products.data?.total ?? 0;
  const plural = new Intl.PluralRules(locale).select(total);
  const countLabel = t(
    plural === "one"
      ? "товар со скидкой"
      : plural === "few"
        ? "товара со скидкой"
        : "товаров со скидкой",
  );

  return (
    <div className={`polish-page public-page page-promotions ${styles.page}`}>
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: content.title }]}
      />
      <header
        className={styles.hero}
        data-has-products={products.loading || images.length > 0}
      >
        <div className={styles.copy}>
          <span className="eyebrow">
            <Tags size={18} aria-hidden="true" /> {t("Покупателям")}
          </span>
          <h1>{t(content.title)}</h1>
          <p>{t(content.description)}</p>
        </div>
        {(products.loading || images.length > 0) && (
          <div className={styles.visual} aria-busy={products.loading}>
            <div className={styles.stack}>
              {products.loading
                ? [0, 1, 2].map((index) => (
                    <div
                      className={`${styles.tile} ${styles.pending}`}
                      key={index}
                      aria-hidden="true"
                    />
                  ))
                : images.map((product) => (
                    <div className={styles.tile} key={product.id}>
                      <ProductImage product={product} large />
                    </div>
                  ))}
            </div>
            {(products.loading || imageLabel) && (
              <span className={styles.imageNote}>
                {!products.loading && imageLabel && t(imageLabel)}
              </span>
            )}
          </div>
        )}
      </header>
      <section id="promotions-products" aria-label={t("Акции")}>
        {products.loading ? (
          <>
            <div className={styles.collectionHeader} aria-hidden="true">
              <div className={styles.metadataSkeleton} />
              <span className={styles.linkSkeleton} />
            </div>
            <Loading kind="grid" />
          </>
        ) : products.error ? (
          <Failure error={products.error} retry={products.retry} />
        ) : !products.data?.items.length ? (
          <Empty
            title={t("Сейчас нет акционных товаров")}
            text={t(
              "Загляните в каталог, чтобы выбрать продукты на каждый день.",
            )}
          />
        ) : (
          <>
            <div className={styles.collectionHeader}>
              <div>
                <h2>
                  {total} {countLabel}
                </h2>
                <p>{t("Скидки относительно прежних цен.")}</p>
              </div>
              <Link className="text-link" href="/catalog">
                {t("Весь каталог")} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className={`product-grid ${styles.grid}`}>
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <nav className="store-pagination" aria-label={t("Страницы")}>
              <button
                type="button"
                className="button secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t("Назад")}
              </button>
              <span>
                {page} / {Math.ceil(total / 24)}
              </span>
              <button
                type="button"
                className="button secondary"
                disabled={page * 24 >= total}
                onClick={() => setPage(page + 1)}
              >
                {t("Далее")}
              </button>
            </nav>
          </>
        )}
      </section>
    </div>
  );
}
