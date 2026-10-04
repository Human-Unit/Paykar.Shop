"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePresentation } from "@/context/presentation";
import type { StoreLocation } from "@/lib/store-locations";

export default function StoreNetworkMap({
  stores,
}: {
  stores: StoreLocation[];
}) {
  const { t } = usePresentation();
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current || stores.length === 0) return;

    const map = L.map(element.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });

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

      return L.marker([store.latitude, store.longitude], {
        icon,
        title: `${store.name} — ${store.address}`,
      })
        .addTo(map)
        .bindPopup(popup);
    });

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 16);
    } else {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), {
        padding: [42, 42],
        maxZoom: 13,
      });
    }

    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(element.current);

    return () => {
      resize.disconnect();
      map.remove();
    };
  }, [stores]);

  return (
    <div
      ref={element}
      className="store-network-map"
      role="region"
      aria-label={t("Расположение магазина")}
    />
  );
}
