import type { Metadata } from "next";
import { CartProvider } from "@/context/cart";
import { Shell } from "@/components/shell";
import { PresentationProvider } from "@/context/presentation";
import "./globals.css";
import "./paykar-theme.css";
import "./site-polish.css";
import "./shopping-redesign.css";
import "./phase4-editorial.css";

export const metadata: Metadata = {
  title: "Пайкар",
  description: "Продукты на каждый день: каталог, поиск, корзина и доставка.",
  icons: {
    icon: "/images/paykar/logo.png",
  },
};
// Resolve saved preferences before first paint; light is the grocery storefront default.
const restorePresentation = `try{const p=JSON.parse(localStorage.getItem("paykar-presentation-v1")||"{}");document.documentElement.dataset.theme=p.theme==="dark"?"dark":p.theme==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"light";document.documentElement.lang=p.language==="tj"?"tg":p.language==="en"?"en":"ru";}catch{document.documentElement.dataset.theme="light";document.documentElement.lang="ru";}`;
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="light" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/NotoSans-Latin-Cyrillic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: restorePresentation }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <PresentationProvider>
          <CartProvider>
            <Shell>{children}</Shell>
          </CartProvider>
        </PresentationProvider>
      </body>
    </html>
  );
}
