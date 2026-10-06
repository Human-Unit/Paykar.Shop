"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { usePresentation } from "@/context/presentation";
export default function StoreMap({
  latitude,
  longitude,
  address,
}: {
  latitude: number;
  longitude: number;
  address: string;
}) {
  const { t } = usePresentation();
  const element = useRef<HTMLDivElement>(null);
  const label = t(address);
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, { scrollWheelZoom: false }).setView(
      [latitude, longitude],
      16,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const icon = L.divIcon({
      className: "delivery-marker store-marker",
      html: "●",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const text = document.createElement("span");
    text.textContent = label;
    L.marker([latitude, longitude], { icon, title: label })
      .addTo(map)
      .bindTooltip(text);
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(element.current);
    return () => {
      resize.disconnect();
      map.remove();
    };
  }, [latitude, longitude, label]);
  return (
    <div
      ref={element}
      className="store-map"
      role="region"
      aria-label={t("Расположение магазина")}
    />
  );
}
