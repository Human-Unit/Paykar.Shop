"use client";

import dynamic from "next/dynamic";
import { ArrowUpRight, MapPin, Store } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { storeLocations } from "@/lib/store-locations";
import { SectionHeader } from "./page-patterns";
import styles from "./home-store-network.module.css";

function MapLoading() {
  const { t } = usePresentation();
  return <div className={styles.mapLoading}>{t("Загружаем карту…")}</div>;
}

const StoreNetworkMap = dynamic(() => import("./store-network-map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export function HomeStoreNetwork() {
  const { t } = usePresentation();

  return (
    <section className={styles.section}>
      <SectionHeader
        eyebrow="Магазины"
        title="Магазины"
        text="Найдите магазин и откройте его расположение на карте."
        action={{ href: "/stores", label: "Магазины" }}
      />

      <div className={styles.layout}>
        <div className={styles.mapShell}>
          <StoreNetworkMap stores={storeLocations} />
        </div>

        <aside className={styles.listPanel} aria-label={t("Магазины")}>
          <div className={styles.listHeader}>
            <span className={styles.listHeaderIcon}>
              <Store size={22} aria-hidden="true" />
            </span>
            <div>
              <strong>{t("Магазины")}</strong>
              <small>{storeLocations.length}</small>
            </div>
          </div>

          <div className={styles.list}>
            {storeLocations.map((store) => (
              <a
                className={styles.storeLink}
                key={store.id}
                href={`https://www.openstreetmap.org/?mlat=${store.latitude}&mlon=${store.longitude}#map=16/${store.latitude}/${store.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${store.name}: ${store.address}. ${t("Показать на карте")}`}
              >
                <span className={styles.number}>
                  {String(store.id).padStart(2, "0")}
                </span>
                <span className={styles.storeCopy}>
                  <strong>{store.name}</strong>
                  <span>
                    <MapPin size={13} aria-hidden="true" /> {store.address}
                  </span>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
