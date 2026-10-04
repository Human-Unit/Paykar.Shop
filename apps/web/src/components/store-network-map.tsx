"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePresentation } from "@/context/presentation";
import type { StoreLocation } from "@/lib/store-locations";
import styles from "./home-store-network.module.css";

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
      scrollWheelZoom: false,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers = stores.map((store) => {
      const icon = L.divIcon({
        className: "paykar-network-marker",
        html: `<span>${store.id}</span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const popup = document.createElement("div");
      popup.className = "paykar-network-popup";
      const title = document.createElement("strong");
      title.textContent = store.name;
      const address = document.createElement("span");
      address.textContent = store.address;
      popup.append(title, address);

      const marker = L.marker([store.latitude, store.longitude], {
        icon,
        title: `${store.name} — ${store.address}`,
        keyboard: true,
      })
        .addTo(map)
        .bindPopup(popup);

      marker.on("click", () => onSelectStoreRef.current(store.id));
      markersRef.current.set(store.id, marker);
      return marker;
    });

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 16);
    } else {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), {
        padding: [48, 48],
        maxZoom: 13,
      });
    }

    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(element.current);

    return () => {
      resize.disconnect();
      markersRef.current.clear();
      mapRef.current = null;
      map.remove();
    };
  }, [stores]);

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
