"use client";
import { usePresentation } from "@/context/presentation";
export const scenarios = [
  "SUCCESS",
  "DECLINED",
  "INSUFFICIENT",
  "ERROR",
] as const;
export type Scenario = (typeof scenarios)[number];
export type SandboxFields = {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
};
export function validSandbox(
  fields: SandboxFields,
): fields is SandboxFields & { number: Scenario } {
  return (
    scenarios.some((scenario) => scenario === fields.number) &&
    fields.expiry === "12/99" &&
    fields.cvv === "000" &&
    fields.holder === "SANDBOX"
  );
}
export function SandboxCard({
  value,
  onChange,
  disabled,
  error,
}: {
  value: SandboxFields;
  onChange: (next: SandboxFields) => void;
  disabled: boolean;
  error: boolean;
}) {
  const { t } = usePresentation();
  const labels = {
    SUCCESS: "Успешная оплата",
    DECLINED: "Отклонено",
    INSUFFICIENT: "Недостаточно средств",
    ERROR: "Ошибка обработки",
  };
  return (
    <div
      className="sandbox-card"
      aria-describedby="sandbox-disclosure sandbox-hint"
    >
      <div id="sandbox-disclosure" className="sandbox-disclosure">
        <strong>{t("Тестовая оплата")}</strong>
        <p>{t("Не вводите данные настоящей банковской карты.")}</p>
      </div>
      <p id="sandbox-hint">
        {t(
          "Используйте только синтетические значения. Выберите сценарий, чтобы заполнить форму.",
        )}
      </p>
      <div className="sandbox-scenarios">
        {scenarios.map((scenario) => (
          <button
            key={scenario}
            type="button"
            className="button secondary"
            disabled={disabled}
            onClick={() =>
              onChange({
                number: scenario,
                expiry: "12/99",
                cvv: "000",
                holder: "SANDBOX",
              })
            }
          >
            {t(labels[scenario])}
          </button>
        ))}
      </div>
      <div className="field-grid">
        <label>
          {t("Номер карты")}
          <input
            autoComplete="off"
            name="sandbox_number"
            required
            value={value.number}
            maxLength={12}
            pattern="SUCCESS|DECLINED|INSUFFICIENT|ERROR"
            placeholder="SUCCESS"
            disabled={disabled}
            aria-describedby={
              error ? "sandbox-hint checkout-error" : "sandbox-hint"
            }
            aria-invalid={error || undefined}
            onChange={(event) =>
              onChange({ ...value, number: event.target.value.toUpperCase() })
            }
          />
        </label>
        <label>
          {t("Имя владельца")}
          <input
            autoComplete="off"
            required
            value={value.holder}
            aria-describedby={
              error ? "sandbox-hint checkout-error" : "sandbox-hint"
            }
            maxLength={7}
            pattern="SANDBOX"
            placeholder="SANDBOX"
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, holder: event.target.value.toUpperCase() })
            }
          />
        </label>
        <label>
          {t("Срок действия")}
          <input
            autoComplete="off"
            required
            value={value.expiry}
            aria-describedby={
              error ? "sandbox-hint checkout-error" : "sandbox-hint"
            }
            maxLength={5}
            pattern="12/99"
            placeholder="12/99"
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, expiry: event.target.value })
            }
          />
        </label>
        <label>
          CVV
          <input
            autoComplete="off"
            required
            type="password"
            value={value.cvv}
            aria-describedby={
              error ? "sandbox-hint checkout-error" : "sandbox-hint"
            }
            maxLength={3}
            pattern="000"
            placeholder="000"
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, cvv: event.target.value })
            }
          />
        </label>
      </div>
    </div>
  );
}
