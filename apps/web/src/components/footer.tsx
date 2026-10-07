"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Brand } from "./brand";
import { usePresentation } from "@/context/presentation";
import { navigationGroups, destinations } from "@/lib/navigation";
import { useResource, type DeliveryConfig } from "@/lib/api";

function subscribe(callback: () => void) {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export function Footer() {
  const { t } = usePresentation();
  const config = useResource<DeliveryConfig>("/delivery/config");
  const mobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(max-width: 640px)").matches,
    () => false,
  );
  const contact = destinations.contacts;
  return (
    <footer className="footer store-footer">
      <div className="container store-footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>{t("Знакомый магазин. Удобный выбор.")}</p>
        </div>
        {navigationGroups.map((group) => (
          <details key={group.title} className="footer-group" open={!mobile}>
            <summary
              tabIndex={mobile ? 0 : -1}
              onClick={(event) => {
                if (!mobile) event.preventDefault();
              }}
            >
              {t(group.title)}
            </summary>
            <nav aria-label={t(group.title)}>
              {group.items.map((item) => (
                <Link key={item.id} href={item.href}>
                  {t(item.label)}
                </Link>
              ))}
            </nav>
          </details>
        ))}
        <div className="footer-contact">
          <h2>{t(contact.label)}</h2>
          {config.data?.store_address && <p>{t(config.data.store_address)}</p>}
          <Link href={contact.href}>{t("Адрес и карта")}</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {t("Пайкар")}</span>
        <span>{t("Цены указаны в сомони (TJS)")}</span>
      </div>
    </footer>
  );
}
