"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin, Store } from "lucide-react";
import { usePresentation } from "@/context/presentation";
import { storeLocations } from "@/lib/store-locations";
import { SectionHeader } from "./page-patterns";
import styles from "./home-store-network.module.css";
import { m, useReveal } from "./motion-primitives";

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
  const mapReveal = useReveal({ rise: 0 });
  const directoryReveal = useReveal({ rise: 10, delay: 0.06 });
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const selectStore = (storeId: number) => {
    setSelectedStoreId(storeId);
    setSelectionRevision((revision) => revision + 1);
  };
  const list = useRef<HTMLDivElement>(null);
  const storeButtons = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (selectedStoreId === null) return;
    const container = list.current;
    const button = storeButtons.current[selectedStoreId];
    if (
      !container ||
      !button ||
      container.scrollHeight <= container.clientHeight
    ) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const target =
      container.scrollTop +
      buttonRect.top -
      containerRect.top -
      (container.clientHeight - buttonRect.height) / 2;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    container.scrollTo({
      top: Math.max(0, target),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [selectedStoreId]);

  return (
    <section className={styles.section} aria-label={t("Магазины")}>
      <SectionHeader
        eyebrow="Адрес и карта"
        title="Магазины"
        text="Выберите Пайкар — на карте сразу увидите название и адрес магазина."
      />

      <div className={styles.layout}>
        <m.div {...mapReveal} className={styles.mapShell}>
          <StoreNetworkMap
            stores={storeLocations}
            selectedStoreId={selectedStoreId}
            selectionRevision={selectionRevision}
            onSelectStore={selectStore}
          />
          <div className={styles.mapBadge} aria-hidden="true">
            <Store size={18} />
            <span>
              <strong>{storeLocations.length}</strong>
              <small>{t("Магазины")} · Душанбе</small>
            </span>
          </div>
        </m.div>

        <m.aside
          {...directoryReveal}
          className={styles.listPanel}
          aria-label={t("Магазины")}
        >
          <div className={styles.listHeader}>
            <span className={styles.listHeaderIcon}>
              <Store size={22} aria-hidden="true" />
            </span>
            <div>
              <strong>{t("Магазины")}</strong>
              <small>{storeLocations.length} · Душанбе</small>
            </div>
          </div>

          <div ref={list} className={styles.list} role="list">
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
                    onClick={() => selectStore(store.id)}
                  >
                    <span className={styles.storeMarker} aria-hidden="true">
                      <Store size={17} />
                    </span>
                    <span className={styles.storeCopy}>
                      <strong>{store.name}</strong>
                      <span>
                        <MapPin size={13} aria-hidden="true" />
                        <span>
                          {store.city} · {store.address}
                        </span>
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
        </m.aside>
      </div>
    </section>
  );
}
