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
  selectionRevision,
  onSelectStore,
}: {
  stores: StoreLocation[];
  selectedStoreId: number | null;
  selectionRevision: number;
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
        iconSize: [40, 48],
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
          autoPanPadding: [12, 16],
          autoPanPaddingTopLeft: [12, 112],
        });

      marker.on("click", () => onSelectStoreRef.current(store.id));
      mapMarkers.set(store.id, marker);
      return marker;
    });

    // Labels may move or collapse; Leaflet alone owns each pin's transform.
    const layoutLabels = () => {
      const size = map.getSize();
      const points = markers.map((marker) =>
        map.latLngToContainerPoint(marker.getLatLng()),
      );
      const occupied: L.Bounds[] = [
        L.bounds([8, 8], [64, 112]), // Zoom controls.
        L.bounds([size.x - 184, 8], [size.x - 8, 76]), // Store count badge.
        ...points.map((point) =>
          L.bounds(point.subtract([24, 46]), point.add([24, 6])),
        ),
      ];
      const viewport = L.bounds([8, 8], [size.x - 8, size.y - 24]);
      const priority = (marker: L.Marker) =>
        Number(
          marker.getElement()?.matches(".is-active, :hover, :focus") ?? false,
        );

      for (const marker of [...markers].sort(
        (a, b) => priority(b) - priority(a),
      )) {
        const root = marker.getElement();
        const label = root?.querySelector<HTMLElement>(".paykar-network-label");
        if (!root || !label) continue;
        const point = map.latLngToContainerPoint(marker.getLatLng());
        const origin = point.subtract([20, 42]);
        const width = label.offsetWidth;
        const height = label.offsetHeight;
        const candidates = [
          L.point(47, (48 - height) / 2),
          L.point(-width - 7, (48 - height) / 2),
          L.point(20 - width / 2, -height - 10),
          L.point(20 - width / 2, 54),
        ];
        const offset = candidates.find((candidate) => {
          const start = origin.add(candidate);
          const bounds = L.bounds(start, start.add([width, height]));
          return (
            viewport.contains(bounds) &&
            occupied.every((other) => !other.overlaps(bounds))
          );
        });
        const visible = offset !== undefined || priority(marker) === 1;
        const position =
          offset ??
          L.point(
            Math.max(8, Math.min(size.x - width - 8, origin.x + 47)) - origin.x,
            Math.max(8, Math.min(size.y - height - 24, origin.y)) - origin.y,
          );
        label.style.left = `${position.x}px`;
        label.style.top = `${position.y}px`;
        label.dataset.collapsed = String(!visible);
        if (visible) {
          const start = origin.add(position);
          occupied.push(L.bounds(start, start.add([width, height])));
        }
      }
    };
    map.on("moveend zoomend resize", layoutLabels);

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 16);
    } else {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), {
        padding: [56, 56],
        maxZoom: 13,
      });
    }
    layoutLabels();
    for (const marker of markers) {
      marker.on("mouseover mouseout", layoutLabels);
      marker.getElement()?.addEventListener("focus", layoutLabels);
      marker.getElement()?.addEventListener("blur", layoutLabels);
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
      marker.setZIndexOffset(storeId === selectedStoreId ? 1000 : 0);
    }

    if (!map || selectedStoreId === null) return;
    const marker = markersRef.current.get(selectedStoreId);
    if (!marker) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const openPopup = () => marker.openPopup();
    map.stop();
    map.once("moveend", openPopup);
    map.panTo(marker.getLatLng(), {
      animate: !reduceMotion,
      duration: reduceMotion ? 0 : 0.35,
    });
    return () => {
      map.off("moveend", openPopup);
    };
  }, [selectedStoreId, selectionRevision, stores, t]);

  return (
    <div
      ref={element}
      className={styles.map}
      role="region"
      aria-label={`${t("Магазины")}: ${stores.length}`}
    />
  );
}
