"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  defaultDesign,
  publishedDesignCss,
  validDesign,
} from "@/lib/design-config";

export function StorefrontDesign() {
  const path = usePathname();
  const [config, setConfig] = useState(defaultDesign);
  const admin = path === "/admin" || path.startsWith("/admin/");
  useEffect(() => {
    if (admin) return;
    let active = true;
    let last = 0;
    const controller = new AbortController();
    async function refresh(force = false) {
      if (!force && Date.now() - last < 30000) return;
      last = Date.now();
      try {
        const base =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
        const response = await fetch(`${base}/design/public`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const value = await response.json();
        if (active && validDesign(value.config)) setConfig(value.config);
      } catch {
        /* Local defaults/last valid published config keep the store usable. */
      }
    }
    const focus = () => {
      void refresh();
    };
    const published = () => {
      void refresh(true);
    };
    void refresh(true);
    window.addEventListener("focus", focus);
    window.addEventListener("paykar-design-published", published);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener("focus", focus);
      window.removeEventListener("paykar-design-published", published);
    };
  }, [admin]);
  if (admin) return null;
  return (
    <style id="paykar-published-design">{publishedDesignCss(config)}</style>
  );
}
