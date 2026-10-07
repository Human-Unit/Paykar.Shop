"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { usePresentation } from "@/context/presentation";
import type { StoreLocation } from "@/lib/store-locations";
import styles from "./home-store-network.module.css";

function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

export default function StoreNetworkMap({
  stores,
  selectedStoreId,
  onSelectStore,
}: {
  stores: StoreLocation[];
  selectedStoreId: number | null;
  onSelectStore: (storeId: number) => void;
}) {
  const { t } = usePresentation();
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const onSelectStoreRef = useRef(onSelectStore);

  useEffect(() => {
    onSelectStoreRef.current = onSelectStore;
  }, [onSelectStore]);

  useEffect(() => {
    if (!element.current || stores.length === 0) return;

    const map = L.map(element.current, {
      scrollWheelZoom: true,
      touchZoom: true,
      dragging: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomControl: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelDebounceTime: 20,
      wheelPxPerZoomLevel: 90,
    });
    mapRef.current = map;
    const mapMarkers = markersRef.current;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers = stores.map((store) => {
      const icon = L.divIcon({
        className: "paykar-network-marker",
        html: [
          '<span class="paykar-network-pin" aria-hidden="true"><span>П</span></span>',
          '<span class="paykar-network-label">',
          `<strong>${escapeMarkup(store.name)}</strong>`,
          `<small>${escapeMarkup(store.shortAddress)}</small>`,
          "</span>",
        ].join(""),
        iconSize: [154, 48],
        iconAnchor: [20, 42],
        popupAnchor: [0, -34],
      });

      const popup = document.createElement("div");
      popup.className = "paykar-network-popup";

      const meta = document.createElement("span");
      meta.className = "paykar-network-popup-meta";
      meta.textContent = `${t("Супермаркет")} · ${store.city}`;

      const title = document.createElement("strong");
      title.textContent = store.name;

      const address = document.createElement("span");
      address.className = "paykar-network-popup-address";
      address.textContent = store.address;

      const mapLink = document.createElement("a");
      mapLink.className = "paykar-network-popup-link";
      mapLink.href = `https://www.openstreetmap.org/?mlat=${store.latitude}&mlon=${store.longitude}#map=17/${store.latitude}/${store.longitude}`;
      mapLink.target = "_blank";
      mapLink.rel = "noopener noreferrer";
      mapLink.textContent = `${t("Открыть на карте")} ↗`;

      popup.append(meta, title, address, mapLink);

      const marker = L.marker([store.latitude, store.longitude], {
        icon,
        title: `${store.name} — ${store.address}`,
        keyboard: true,
      })
        .addTo(map)
        .bindPopup(popup, {
          closeButton: true,
          maxWidth: 260,
          minWidth: 190,
        });

      marker.on("click", () => onSelectStoreRef.current(store.id));
      mapMarkers.set(store.id, marker);
      return marker;
    });

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 16);
    } else {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), {
        padding: [56, 56],
        maxZoom: 13,
      });
    }

    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(element.current);

    return () => {
      resize.disconnect();
      mapMarkers.clear();
      mapRef.current = null;
      map.remove();
    };
  }, [stores, t]);

  useEffect(() => {
    const map = mapRef.current;

    for (const [storeId, marker] of markersRef.current.entries()) {
      marker
        .getElement()
        ?.classList.toggle("is-active", storeId === selectedStoreId);
    }

    if (!map || selectedStoreId === null) return;
    const marker = markersRef.current.get(selectedStoreId);
    if (!marker) return;

    marker.openPopup();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    map.panTo(marker.getLatLng(), {
      animate: !reduceMotion,
      duration: reduceMotion ? 0 : 0.35,
    });
  }, [selectedStoreId]);

  return (
    <div
      ref={element}
      className={styles.map}
      role="region"
      aria-label={`${t("Магазины")}: ${stores.length}`}
    />
  );
}
