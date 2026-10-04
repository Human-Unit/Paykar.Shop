"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Wallet,
  Leaf,
  PackageCheck,
  Package,
  RotateCcw,
  MessageCircle,
  Store,
  Tags,
  BookOpen,
  Clock3,
  MapPin,
  Route,
  Search,
  ShoppingBasket,
  UserRound,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { useResource, type DeliveryConfig, type ProductPage } from "@/lib/api";
import { articles, type Article, type StorePage } from "@/lib/store-content";
import { Breadcrumbs } from "./breadcrumbs";
import { Empty, Failure, Loading } from "./states";
import { ProductCard } from "./product-card";
import {
  PageIntro,
  SectionHeader,
  StepFlow,
  CTASection,
  FAQSection,
} from "./page-patterns";
import { ArticleCard, articlePresentation } from "./article-card";
import {
  ReturnsIllustration,
  OffersIllustration,
  LocationIllustration,
} from "./public-page-visuals";
const StoreMap = dynamic(() => import("./store-map"), {
  ssr: false,
  loading: () => (
    <div className="store-map map-loading">
      <Loading label="Загружаем карту…" />
    </div>
  ),
});
const stepIcons = [
  Search,
  ShoppingBasket,
  UserRound,
  Route,
  CreditCard,
  CheckCircle2,
];
function Promotions() {
  const { t } = usePresentation();
  const [page, setPage] = useState(1);
  const products = useResource<ProductPage>(
    `/products?on_sale=true&page=${page}&page_size=24`,
  );
  if (products.loading) return <Loading kind="grid" />;
  if (products.error)
    return <Failure error={products.error} retry={products.retry} />;
  if (!products.data?.items.length)
    return (
      <Empty
        title={t("Сейчас нет акционных товаров")}
        text={t("Загляните в каталог, чтобы выбрать продукты на каждый день.")}
      />
    );
  return (
    <>
      <div className="promotion-context">
        <Tags size={24} aria-hidden="true" />
        <div>
          <strong>
            {products.data.total} {t("Товары")}
          </strong>
          <p>{t("Скидки относительно прежних цен.")}</p>
        </div>
        <Link className="text-link" href="/catalog">
          {t("Весь каталог")} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      <div className="product-grid">
        {products.data.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <nav className="store-pagination" aria-label={t("Страницы")}>
        <button
          className="button secondary"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          {t("Назад")}
        </button>
        <span>
          {page} / {Math.ceil(products.data.total / 24)}
        </span>
        <button
          className="button secondary"
          disabled={page * 24 >= products.data.total}
          onClick={() => setPage(page + 1)}
        >
          {t("Далее")}
        </button>
      </nav>
    </>
  );
}
function BlogCards() {
  return (
    <>
      <ArticleCard article={articles[0]} featured />
      <div className="editorial-grid">
        {articles.slice(1).map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </>
  );
}
function StoreLocation() {
  const { t } = usePresentation();
  const config = useResource<DeliveryConfig>("/delivery/config");
  if (config.loading)
    return (
      <div id="store-location">
        <Loading kind="location" label="Загружаем карту…" />
      </div>
    );
  if (config.error)
    return (
      <div id="store-location">
        <Failure error={config.error} retry={config.retry} />
      </div>
    );
  const store = config.data;
  if (!store) return null;
  const located = store.store_lat !== null && store.store_lon !== null;
  return (
    <section className="store-location" id="store-location">
      <div className="information-panel">
        <div className="location-card-top">
          <span className="icon-tile">
            <Store size={28} aria-hidden="true" />
          </span>
          <span className="eyebrow">{t("Магазин Пайкар")}</span>
        </div>
        <h2>{t("Адрес магазина")}</h2>
        <p className="location-address">
          <MapPin size={20} aria-hidden="true" />
          {t(store.store_address)}
        </p>
        <p>{t("Найдите магазин и откройте его расположение на карте.")}</p>
        {located ? (
          <a
            className="button secondary"
            href={`https://www.openstreetmap.org/?mlat=${store.store_lat}&mlon=${store.store_lon}#map=16/${store.store_lat}/${store.store_lon}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("Показать на карте")}{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ) : (
          <p>{t("Координаты магазина пока недоступны.")}</p>
        )}
        <Link className="text-link location-catalog-link" href="/catalog">
          {t("Выбрать продукты")} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {located && (
        <StoreMap
          latitude={store.store_lat!}
          longitude={store.store_lon!}
          address={store.store_address}
        />
      )}
    </section>
  );
}
export function PublicPage({ page }: { page: StorePage }) {
  const { t } = usePresentation();
  const pageIcons = {
    "how-to-buy": ShoppingBasket,
    payment: Wallet,
    returns: RotateCcw,
    promotions: Tags,
    blog: BookOpen,
    brands: Tags,
    about: Leaf,
    contacts: MapPin,
    stores: Store,
  };
  const Icon = pageIcons[page.slug as keyof typeof pageIcons] ?? ShoppingBasket;
  const questions =
    page.slug === "payment"
      ? [
          {
            question: "Списываются ли деньги в тестовой оплате?",
            answer: page.sections[1].text,
          },
          {
            question: "Что делать, если оплата не прошла?",
            answer: page.sections[2].text,
          },
        ]
      : page.slug === "returns"
        ? [
            {
              question: "Какая информация понадобится?",
              answer:
                "Сохраните номер заказа и сведения о товаре. Опишите, что произошло, и по возможности сохраните упаковку.",
            },
            {
              question: "Как согласовать возврат?",
              answer: page.sections[3].text,
            },
          ]
        : page.slug === "how-to-buy"
          ? [
              {
                question: "Нужна ли регистрация?",
                answer:
                  "Введите имя, телефон и полный адрес. Регистрация не требуется.",
              },
              {
                question: "Можно ли изменить корзину?",
                answer:
                  "Выберите количество. В корзине можно изменить состав покупки и проверить наличие.",
              },
            ]
          : [];
  const visual =
    page.slug === "payment" ? (
      <div className="payment-illustration" aria-hidden="true">
        <div className="payment-demo-card">
          <CreditCard size={28} />
          <span className="test-badge">{t("Тестовая оплата")}</span>
          <span className="card-chip" />
          <strong>{t("Банковской картой")}</strong>
          <small>{t("Не вводите данные настоящей банковской карты.")}</small>
        </div>
        <div className="payment-cash-note">
          <Wallet size={22} />
          {t("Наличными при получении")}
        </div>
      </div>
    ) : page.slug === "about" ? (
      <div className="brand-story-visual">
        <Image
          src="/images/paykar/hero.webp"
          width={768}
          height={512}
          alt=""
          unoptimized
        />
        <span>
          <Leaf size={20} aria-hidden="true" />
          {t("Продукты на каждый день")}
        </span>
      </div>
    ) : page.slug === "how-to-buy" ? (
      <div className="shopping-story-visual" aria-hidden="true">
        {[
          { icon: Search, title: "Каталог" },
          { icon: ShoppingBasket, title: "Ваша корзина" },
          { icon: CheckCircle2, title: "Спасибо! Заказ получен" },
        ].map(({ icon: StepIcon, title }, index) => (
          <div key={title}>
            <span className="flow-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <StepIcon size={24} />
            <strong>{t(title)}</strong>
          </div>
        ))}
      </div>
    ) : page.slug === "returns" ? (
      <ReturnsIllustration />
    ) : page.slug === "promotions" ? (
      <OffersIllustration />
    ) : ["contacts", "stores"].includes(page.slug) ? (
      <LocationIllustration />
    ) : undefined;
  const introAction = ["contacts", "stores"].includes(page.slug)
    ? { href: "#store-location", label: "Адрес и карта" }
    : page.slug === "returns"
      ? { href: "/contacts", label: "Контакты" }
      : page.slug === "payment"
        ? { href: "/checkout", label: "Перейти к оформлению" }
        : page.slug === "promotions"
          ? { href: "#promotions-products", label: "Выбрать продукты" }
          : ["how-to-buy", "about", "brands"].includes(page.slug)
            ? { href: "/catalog", label: "Перейти в каталог" }
            : undefined;
  return (
    <div className={`polish-page public-page page-${page.slug}`}>
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: page.title }]}
      />
      <PageIntro
        eyebrow={
          page.slug === "about"
            ? "Знакомый магазин. Удобный выбор."
            : page.slug === "blog"
              ? "Полезно знать"
              : "Покупателям"
        }
        title={page.title}
        description={page.description}
        icon={Icon}
        visual={visual}
        action={introAction}
      />
      {page.slug === "how-to-buy" && (
        <section>
          <SectionHeader
            eyebrow="От корзины до подтверждения"
            title="Ваш путь к покупке"
          />
          <StepFlow
            steps={page.sections.map((section, index) => ({
              ...section,
              icon: stepIcons[index],
            }))}
          />
        </section>
      )}
      {page.slug === "returns" && (
        <section>
          <SectionHeader
            eyebrow="Поможем разобраться"
            title="Если возникла проблема"
          />
          <StepFlow
            steps={page.sections.map((section, index) => ({
              ...section,
              icon: [Package, BookOpen, MessageCircle, PackageCheck][index],
            }))}
          />
        </section>
      )}
      {page.slug === "payment" && (
        <>
          <div className="payment-options-grid">
            {page.sections.slice(0, 2).map((section, index) => (
              <section
                className="information-panel payment-option"
                key={section.title}
              >
                <span className="icon-tile">
                  {index === 0 ? (
                    <Wallet size={28} aria-hidden="true" />
                  ) : (
                    <CreditCard size={28} aria-hidden="true" />
                  )}
                </span>
                <h2>{t(section.title)}</h2>
                <p>{t(section.text)}</p>
                {index === 1 && (
                  <span className="test-badge">{t("Тестовая оплата")}</span>
                )}
              </section>
            ))}
          </div>
          <section className="support-callout">
            <RotateCcw size={24} aria-hidden="true" />
            <div>
              <h2>{t(page.sections[2].title)}</h2>
              <p>{t(page.sections[2].text)}</p>
            </div>
          </section>
          <section>
            <SectionHeader title="Как проходит тестовая оплата" />
            <StepFlow
              steps={[
                {
                  title: "Выберите способ оплаты",
                  text: "Тестовая онлайн-оплата картой",
                  icon: CreditCard,
                },
                {
                  title: "Выберите сценарий",
                  text: "Используйте только синтетические значения. Выберите сценарий, чтобы заполнить форму.",
                  icon: Wallet,
                },
                {
                  title: "Подтвердите заказ",
                  text: "Не вводите данные настоящей банковской карты.",
                  icon: CheckCircle2,
                },
                {
                  title: "Сохраните подтверждение",
                  text: "Сохраните ссылку на эту страницу, чтобы открыть заказ снова.",
                  icon: PackageCheck,
                },
              ]}
            />
          </section>
        </>
      )}
      {page.slug === "about" && (
        <div className="about-feature-grid">
          {page.sections.map((section, index) => {
            const FeatureIcon = [ShoppingBasket, CheckCircle2, Leaf, Route][
              index
            ];
            return (
              <section className="information-panel" key={section.title}>
                <span className="icon-tile">
                  <FeatureIcon size={26} aria-hidden="true" />
                </span>
                <h2>{t(section.title)}</h2>
                <p>{t(section.text)}</p>
              </section>
            );
          })}
        </div>
      )}
      {page.slug === "brands" && (
        <div className="brands-assortment">
          <div className="assortment-visual" aria-hidden="true">
            {["produce", "dairy", "bakery"].map((image) => (
              <Image
                key={image}
                src={`/images/paykar/${image}.webp`}
                width={240}
                height={240}
                alt=""
                unoptimized
              />
            ))}
          </div>
          <Empty
            icon={Tags}
            title={t("Информация о производителях")}
            text={t(page.sections[0].text)}
          />
        </div>
      )}
      {page.slug === "promotions" && (
        <section id="promotions-products" aria-label={t("Акции")}>
          <Promotions />
        </section>
      )}
      {page.slug === "blog" && <BlogCards />}
      {["contacts", "stores"].includes(page.slug) && <StoreLocation />}
      {["contacts", "stores"].includes(page.slug) && (
        <div className="location-help">
          <Link href="/delivery">
            <Route size={22} aria-hidden="true" />
            <span>
              <strong>{t("Доставка")}</strong>
              <small>
                {t(
                  "Маршрут, расстояние и стоимость — до подтверждения заказа.",
                )}
              </small>
            </span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <Link href={page.slug === "contacts" ? "/stores" : "/contacts"}>
            <Store size={22} aria-hidden="true" />
            <span>
              <strong>
                {t(page.slug === "contacts" ? "Магазины" : "Контакты")}
              </strong>
              <small>{t("Адрес и карта")}</small>
            </span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      )}
      {["how-to-buy", "payment", "returns", "about"].includes(page.slug) && (
        <CTASection
          eyebrow={
            page.slug === "returns" ? "Поможем разобраться" : "ПРОСТО ПОКУПКИ"
          }
          title={
            page.slug === "returns"
              ? "Обсудите решение"
              : "Соберите корзину в вашем темпе"
          }
          text={
            page.slug === "returns"
              ? "Вопросы о товаре и заказе обсудите с сотрудниками магазина."
              : "Заказывайте без регистрации. Выберите точку доставки, проверьте маршрут и итоговую сумму, затем сохраните подтверждение."
          }
          href={page.slug === "returns" ? "/contacts" : "/catalog"}
          label={page.slug === "returns" ? "Контакты" : "Перейти в каталог"}
          icon={page.slug === "returns" ? MessageCircle : ShoppingBasket}
        />
      )}
      {!!questions.length && <FAQSection questions={questions} />}
    </div>
  );
}
export function BlogArticle({ article }: { article: Article }) {
  const { t } = usePresentation();
  return (
    <div className="polish-page article-page">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Блог", href: "/blog" },
          { label: article.title },
        ]}
      />
      <article className="blog-article">
        <PageIntro
          eyebrow={articlePresentation[article.slug]?.label ?? "Полезно знать"}
          title={article.title}
          description={article.excerpt}
          icon={BookOpen}
        />
        <span className="article-reading-time">
          <Clock3 size={16} aria-hidden="true" />
          {article.minutes} {t("мин чтения")}
        </span>
        <Image
          className="article-hero-image"
          src={`/images/paykar/${articlePresentation[article.slug]?.image ?? "hero"}.webp`}
          width={820}
          height={480}
          alt=""
          unoptimized
        />
        {article.sections.map((section, index) => (
          <section key={section.title}>
            <span className="article-section-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2>{t(section.title)}</h2>
            <p>{t(section.text)}</p>
          </section>
        ))}
        <div className="page-actions">
          <Link className="button" href="/catalog">
            {t("Перейти в каталог")}
          </Link>
          <Link className="button secondary" href="/blog">
            {t("Все статьи")}
          </Link>
        </div>
      </article>
      <section className="related-reading">
        <SectionHeader
          eyebrow="Полезно знать"
          title="Читайте также"
          action={{ href: "/blog", label: "Все статьи" }}
        />
        <div className="editorial-grid">
          {articles
            .filter((item) => item.slug !== article.slug)
            .slice(0, 3)
            .map((item) => (
              <ArticleCard key={item.slug} article={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
