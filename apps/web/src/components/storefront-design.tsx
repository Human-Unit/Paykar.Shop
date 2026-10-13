"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  defaultDesign,
  publishedDesignCss,
  validDesign,
  type DesignConfig,
} from "@/lib/design-config";

import { adminApi, type AdminIdentity } from "@/lib/admin-api";
import editorStyles from "./inline-master.module.css";
const InlineMaster = dynamic(() => import("./inline-master"), { ssr: false });
class EditorBoundary extends Component<
  { children: ReactNode; failed: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.failed();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function StorefrontDesign({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [config, setConfig] = useState<DesignConfig>(defaultDesign);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [preview, setPreview] = useState<DesignConfig | null>(null);
  const [open, setOpen] = useState(false);
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
  useEffect(() => {
    if (admin) return;
    const controller = new AbortController();
    let last = 0;
    const check = async () => {
      if (Date.now() - last < 30000) return;
      last = Date.now();
      try {
        const access = await adminApi<{
          enabled: boolean;
          identity?: AdminIdentity;
        }>("auth/design-access", undefined, undefined, controller.signal);
        if (controller.signal.aborted) return;
        if (access.enabled && access.identity?.user.role === "MASTER")
          setIdentity(access.identity);
        else {
          setIdentity(null);
          setPreview(null);
          setOpen(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIdentity(null);
          setPreview(null);
          setOpen(false);
        }
      }
    };
    void check();
    window.addEventListener("focus", check);
    return () => {
      controller.abort();
      window.removeEventListener("focus", check);
    };
  }, [admin]);
  if (admin) return <>{children}</>;
  return (
    <>
      <style id="paykar-published-design">
        {publishedDesignCss(preview && identity ? preview : config)}
      </style>
      <div
        className={open && identity ? editorStyles.reflow : undefined}
        data-storefront-design-view
      >
        {children}
      </div>
      {identity && (
        <EditorBoundary
          failed={() => {
            setPreview(null);
            setOpen(false);
          }}
        >
          <InlineMaster
            identity={identity}
            published={config}
            onPreview={setPreview}
            onOpen={setOpen}
          />
        </EditorBoundary>
      )}
    </>
  );
}
