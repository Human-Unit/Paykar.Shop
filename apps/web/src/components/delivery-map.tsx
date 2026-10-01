"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DeliveryConfig, Point, Quote } from "@/lib/api";

export default function DeliveryMap({
  config,
  point,
  quote,
  onSelect,
  disabled,
}: {
  config?: DeliveryConfig;
  point: Point | null;
  quote?: Quote;
  onSelect: (point: Point) => void;
  disabled: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const routeBounds = useRef<L.LatLngBounds | null>(null);
  const latest = useRef({ onSelect, disabled });
  useEffect(() => {
    latest.current = { onSelect, disabled };
  }, [onSelect, disabled]);
  useEffect(() => {
    if (!element.current) return;
    // Camera fallback only. A store marker requires verified server configuration.
    const instance = L.map(element.current).setView([38.57, 68.78], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instance);
    instance.on("click", (event: L.LeafletMouseEvent) => {
      if (!latest.current.disabled)
        latest.current.onSelect({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        });
    });
    const observer = new ResizeObserver(() => {
      instance.invalidateSize();
      if (routeBounds.current)
        instance.fitBounds(routeBounds.current, {
          padding: [30, 30],
          maxZoom: 16,
          animate: false,
        });
    });
    observer.observe(element.current);
    map.current = instance;
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    routeBounds.current = null;
    const layers = L.layerGroup().addTo(instance);
    function marker(lat: number, lon: number, store: boolean) {
      L.marker([lat, lon], {
        title: store ? "Магазин" : "Ваш адрес",
        keyboard: true,
        icon: L.divIcon({
          className: `delivery-marker ${store ? "store-marker" : "customer-marker"}`,
          html: store ? "М" : "●",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(layers);
    }
    if (config?.store_lat != null && config.store_lon != null) {
      marker(config.store_lat, config.store_lon, true);
      if (!point) instance.setView([config.store_lat, config.store_lon], 14);
    }
    if (point) marker(point.latitude, point.longitude, false);
    if (quote) {
      // GeoJSON [longitude, latitude] -> Leaflet [latitude, longitude].
      const line = L.polyline(
        quote.route.features[0].geometry.coordinates.map(([lon, lat]) => [
          lat,
          lon,
        ]),
        { color: "#087e29", weight: 5 },
      ).addTo(layers);
      const bounds = line.getBounds();
      // Provider endpoints may snap to roads; include the actual selected markers too.
      if (config?.store_lat != null && config.store_lon != null)
        bounds.extend([config.store_lat, config.store_lon]);
      if (point) bounds.extend([point.latitude, point.longitude]);
      routeBounds.current = bounds;
      instance.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 16,
        animate: false,
      });
    } else if (point) instance.panTo([point.latitude, point.longitude]);
    return () => {
      layers.remove();
    };
  }, [config, point, quote]);
  return (
    <div
      ref={element}
      className="delivery-map"
      role="region"
      aria-label="Карта доставки. Выберите точку нажатием или введите координаты ниже."
    />
  );
}
