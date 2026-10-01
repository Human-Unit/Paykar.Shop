export function cents(price: string): number {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

export function distance(meters: number) {
  return meters < 1000
    ? `${meters} м`
    : `${new Intl.NumberFormat("ru", { maximumFractionDigits: 1 }).format(meters / 1000)} км`;
}
export function duration(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60
    ? `${minutes} мин`
    : `${Math.floor(minutes / 60)} ч${minutes % 60 ? ` ${minutes % 60} мин` : ""}`;
}
export function money(value: number): string {
  return `${new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)} с.`;
}
