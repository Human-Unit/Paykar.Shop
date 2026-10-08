"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Order } from "@/lib/api";
import { useCart } from "@/context/cart";
import { usePresentation } from "@/context/presentation";
import { saveShoppingTemplate } from "@/lib/shopping-storage";
import type { AddSummary, ShoppingItem, ShoppingPreview } from "@/lib/shopping";
import styles from "./my-shopping.module.css";
export const orderItems = (order: Order): ShoppingItem[] =>
  order.items.map((i) => ({
    product_id: i.product_id,
    quantity: Number(i.quantity),
    name: i.product_name,
  }));
export const storageWarning =
  "Хранилище недоступно: шаблоны сохранятся только до закрытия страницы.";

export function AddShoppingItems({
  items,
  label = "Добавить всё в корзину",
  icon,
}: {
  items: ShoppingItem[];
  label?: string;
  icon?: ReactNode;
}) {
  const { t } = usePresentation();
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<AddSummary>();
  const [error, setError] = useState("");
  const add = async () => {
    setBusy(true);
    setSummary(undefined);
    setError("");
    try {
      const valid = items.filter((i) => i.product_id > 0);
      const preview = valid.length
        ? await api<ShoppingPreview>("/shopping/preview", undefined, {
            items: valid.map(({ product_id, quantity }) => ({
              product_id,
              quantity,
            })),
          })
        : { items: [] };
      const result = cart.addMany(preview.items);
      result.missing += items.length - valid.length;
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить товары.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={styles.actionResult}>
      <button
        type="button"
        className="button"
        onClick={add}
        disabled={busy || !items.length}
      >
        {icon}
        {t(busy ? "Добавляем…" : label)}
      </button>
      <div role="status">
        {error && <p className="message">{t(error)}</p>}
        {summary && (
          <>
            <p>
              {t("Добавлено в корзину:")} {summary.added}.{" "}
              <Link className="text-link" href="/cart">
                {t("Перейти в корзину")}
              </Link>
            </p>
            {summary.unavailable > 0 && (
              <p>
                {t("Сейчас недоступно:")} {summary.unavailable}
              </p>
            )}
            {summary.missing > 0 && (
              <p>
                {t("Больше не продаётся:")} {summary.missing}
              </p>
            )}
            {summary.adjusted > 0 && (
              <p>
                {t("Количество ограничено остатком:")} {summary.adjusted}
              </p>
            )}
            {summary.full > 0 && (
              <p>{t("В корзине может быть до 48 разных товаров.")}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function SaveShoppingTemplate({
  items,
  label = "Сохранить как шаблон",
  icon,
}: {
  items: ShoppingItem[];
  label?: string;
  icon?: ReactNode;
}) {
  const { t } = usePresentation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className={styles.saveAction}>
      {!open && (
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setOpen(true);
            setMessage("");
          }}
        >
          {icon}
          {t(label)}
        </button>
      )}
      {open && (
        <form
          className={styles.inlineForm}
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const result = saveShoppingTemplate(name, items);
              setOpen(false);
              setName("");
              setMessage(
                result.persisted ? "Шаблон сохранён." : storageWarning,
              );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Не удалось сохранить шаблон.",
              );
            }
          }}
        >
          <label>
            {t("Название шаблона")}
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Моя неделя")}
            />
          </label>
          <button className="button" type="submit">
            {t("Сохранить")}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setOpen(false)}
          >
            {t("Отмена")}
          </button>
        </form>
      )}
      {message && (
        <p role="status">
          {t(message)}{" "}
          <Link href="/my-shopping#templates" className="text-link">
            {t("Мои шаблоны")}
          </Link>
        </p>
      )}
    </div>
  );
}
