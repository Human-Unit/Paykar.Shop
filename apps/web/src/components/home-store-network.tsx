"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const storeButtons = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (selectedStoreId === null) return;
    storeButtons.current[selectedStoreId]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [selectedStoreId]);

  return (
    <section className={styles.section} aria-label={t("Магазины")}>
      <SectionHeader
        eyebrow="Адрес и карта"
        title="Магазины"
        text="Найдите магазин и откройте его расположение на карте."
      />

      <div className={styles.layout}>
        <div className={styles.mapShell}>
          <StoreNetworkMap
            stores={storeLocations}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
          />
          <div className={styles.mapBadge} aria-hidden="true">
            <Store size={18} />
            <span>
              <strong>{storeLocations.length}</strong>
              <small>{t("Магазины")}</small>
            </span>
          </div>
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

          <div className={styles.list} role="list">
            {storeLocations.map((store) => {
              const selected = selectedStoreId === store.id;
              const osmUrl = `https://www.openstreetmap.org/?mlat=${store.latitude}&mlon=${store.longitude}#map=16/${store.latitude}/${store.longitude}`;

              return (
                <div
                  className={styles.storeRow}
                  data-selected={selected ? "true" : undefined}
                  key={store.id}
                  role="listitem"
                >
                  <button
                    ref={(node) => {
                      storeButtons.current[store.id] = node;
                    }}
                    className={styles.storeSelect}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${t("Показать на карте")}: ${store.name}, ${store.address}`}
                    onClick={() => setSelectedStoreId(store.id)}
                  >
                    <span className={styles.number} aria-hidden="true">
                      {String(store.id).padStart(2, "0")}
                    </span>
                    <span className={styles.storeCopy}>
                      <strong>{store.name}</strong>
                      <span>
                        <MapPin size={13} aria-hidden="true" /> {store.address}
                      </span>
                    </span>
                  </button>
                  <a
                    className={styles.externalLink}
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`OpenStreetMap: ${store.name}, ${store.address}`}
                    title="OpenStreetMap"
                  >
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
