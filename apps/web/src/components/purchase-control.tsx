"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/api";
import { useCart } from "@/context/cart";
import { usePresentation } from "@/context/presentation";
import {
  defaultMode,
  minimum,
  step,
  stockLimit,
  quantityLabel,
  isEstimated,
  weightGrams,
  lineCents,
  type PurchaseMode,
} from "@/lib/measurement";
import styles from "./purchase-control.module.css";

export function PurchaseControl({
  product,
  detailed = false,
}: {
  product: Product;
  detailed?: boolean;
}) {
  const { t, money } = usePresentation();
  const cart = useCart();
  const existing = cart.items.find((item) => item.product_id === product.id);
  const [selected, setSelected] = useState<PurchaseMode>(defaultMode(product));
  const [draft, setDraft] = useState(minimum(product, defaultMode(product)));
  const mode = existing?.purchase_mode || selected;
  const min = minimum(product, mode),
    increment = step(product, mode);
  const limit = stockLimit(product, mode);
  const quantity = existing?.quantity || draft;
  const line = { product_id: product.id, quantity, purchase_mode: mode };
  const valid =
    Number.isSafeInteger(quantity) &&
    quantity >= min &&
    quantity <= limit &&
    (mode !== "WEIGHT" || (quantity - min) % increment === 0);
  function change(amount: number) {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    if (existing) cart.quantity(product.id, amount, limit);
    else setDraft(amount);
  }
  return (
    <div className={styles.purchase}>
      {product.measurement_mode === "DUAL" && (
        <div className={styles.modes} role="group" aria-label={t("Как купить")}>
          {(["WEIGHT", "PIECE"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={Boolean(existing) && mode !== value}
              onClick={() => {
                setSelected(value);
                setDraft(minimum(product, value));
              }}
            >
              {t(value === "WEIGHT" ? "Килограммы" : "Штуки")}
            </button>
          ))}
        </div>
      )}
      {(existing || detailed) && (
        <div
          className={`quantity-control card-quantity ${styles.controls}`}
          aria-label={t("Выберите количество")}
        >
          <button
            type="button"
            aria-label={t("Уменьшить: ") + t(product.name)}
            disabled={!existing && quantity <= min}
            onClick={() =>
              existing && quantity <= min
                ? cart.remove(product.id)
                : change(Math.max(min, quantity - increment))
            }
          >
            <Minus size={18} />
          </button>
          {detailed ? (
            <label className={styles.amount}>
              <input
                type="number"
                aria-label={t("Выберите количество")}
                min={mode === "WEIGHT" ? min / 1000 : min}
                max={mode === "WEIGHT" ? limit / 1000 : limit}
                step={mode === "WEIGHT" ? increment / 1000 : increment}
                value={mode === "WEIGHT" ? quantity / 1000 : quantity}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value > 0)
                    change(
                      mode === "WEIGHT" ? Math.round(value * 1000) : value,
                    );
                }}
              />
              <span>{t(mode === "WEIGHT" ? "кг" : "шт")}</span>
            </label>
          ) : (
            <span aria-live="polite">
              <b className="quantity-value">{quantityLabel(line, t)}</b>
              <small>{t("в корзине")}</small>
            </span>
          )}
          <button
            type="button"
            aria-label={t("Увеличить: ") + t(product.name)}
            disabled={quantity + increment > limit}
            onClick={() => change(quantity + increment)}
          >
            <Plus size={18} />
          </button>
        </div>
      )}
      {isEstimated(product, line) && (
        <div className={styles.estimate} aria-live="polite">
          <span>
            ≈ {(weightGrams(product, line) || 0) / 1000} {t("кг")}
          </span>
          <strong>≈ {money(lineCents(product, line))}</strong>
          {detailed && (
            <small>
              {t(
                "Вес и итоговая стоимость могут немного измениться при сборке.",
              )}
            </small>
          )}
        </div>
      )}
      {!existing && (
        <button
          type="button"
          className="add-button"
          disabled={!valid}
          onClick={() => cart.add(product, { quantity, purchase_mode: mode })}
          aria-label={t("Добавить в корзину: ") + t(product.name)}
        >
          <Plus size={17} />
          {limit < min ? t("Нет в наличии") : t("В корзину")}
        </button>
      )}
    </div>
  );
}
