// Display-only helpers. Stock/pricing mutations remain in the existing APIs.
export type AdminRecord = Record<string, string | number | boolean | null>;
export const orderStatuses = {
  pending: "New",
  confirmed: "Confirmed",
  delivering: "Delivery",
  completed: "Delivered",
  cancelled: "Cancelled",
} as const;
export function statusPresentation(status: string) {
  const designStates = {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    ARCHIVED: "Archived",
  };
  const label: string = Object.hasOwn(orderStatuses, status)
    ? orderStatuses[status as keyof typeof orderStatuses]
    : Object.hasOwn(designStates, status)
      ? designStates[status as keyof typeof designStates]
      : status.replaceAll("_", " ");
  const tone = ["Active", "Published", "Delivered", "MASTER"].includes(label)
    ? "positive"
    : ["Out of stock", "Invalid measurement", "Cancelled"].includes(label)
      ? "danger"
      : [
            "Low stock",
            "Missing image",
            "Disabled",
            "Draft",
            "Draft saved",
            "Unsaved changes",
          ].includes(label)
        ? "warning"
        : ["New", "Confirmed", "Delivery"].includes(label)
          ? "info"
          : "neutral";
  return { label, tone };
}
export function measurementLabel(value: unknown) {
  const modes = {
    PIECE: "By piece",
    WEIGHT: "By weight",
    DUAL: "Pieces or weight",
  };
  return Object.hasOwn(modes, String(value))
    ? modes[String(value) as keyof typeof modes]
    : "Unknown sale mode";
}
export function stockUnit(record: AdminRecord) {
  return record.price_unit === "KG" ? "kg" : "pcs";
}
export function money(value: unknown) {
  return value == null || !Number.isFinite(Number(value))
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value)) + " TJS";
}
export function quantity(value: unknown, record: AdminRecord) {
  return value == null || !Number.isFinite(Number(value))
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        maximumFractionDigits: 3,
      }).format(Number(value)) +
        " " +
        stockUnit(record);
}
export function dateTime(value: unknown) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Dushanbe",
      }).format(date);
}
export function productProblems(record: AdminRecord) {
  const result: string[] = [];
  if (record.is_active === false) result.push("Disabled");
  if (record.invalid_measurement) result.push("Invalid measurement");
  if (Number(record.stock_quantity) <= 0) result.push("Out of stock");
  else if (record.low_stock) result.push("Low stock");
  if (record.missing_image || record.image_url === "")
    result.push("Missing image");
  return result;
}
