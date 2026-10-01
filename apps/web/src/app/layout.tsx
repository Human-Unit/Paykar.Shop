import type { Metadata } from "next";
import { CartProvider } from "@/context/cart";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paykar · учебный магазин",
  description: "Демонстрационный супермаркет: каталог, поиск и корзина.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          <Shell>{children}</Shell>
        </CartProvider>
      </body>
    </html>
  );
}
