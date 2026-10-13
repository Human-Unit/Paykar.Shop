"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { adminApi, AdminError, type AdminIdentity } from "@/lib/admin-api";
import styles from "./admin.module.css";

const Identity = createContext<AdminIdentity | null>(null);
export function useAdmin() {
  const value = useContext(Identity);
  if (!value) throw new Error("Admin identity missing");
  return value;
}
const navigationGroups = [
  {
    label: "Operations",
    links: [
      ["", "Overview"],
      ["orders", "Orders"],
    ],
  },
  {
    label: "Catalog",
    links: [
      ["products", "Products"],
      ["categories", "Categories"],
      ["promotions", "Promotions"],
      ["inventory", "Inventory"],
    ],
  },
  { label: "Locations", links: [["stores", "Stores"]] },
  {
    label: "Master",
    links: [
      ["master/design", "Design"],
      ["master/administrators", "Administrators"],
    ],
  },
  { label: "System", links: [["settings", "Settings"]] },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const login = path === "/admin/login";
  useEffect(() => {
    if (login) return;
    const controller = new AbortController();
    adminApi<AdminIdentity>("auth/me", undefined, undefined, controller.signal)
      .then((value) => {
        setIdentity(value);
        setError("");
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        if (cause instanceof AdminError && cause.status === 401)
          router.replace("/admin/login");
        else
          setError(
            cause instanceof Error ? cause.message : "Unable to load session",
          );
      });
    return () => controller.abort();
  }, [login, retry, router]);
  async function logout() {
    if (!identity) return;
    setPending(true);
    try {
      await adminApi("auth/logout", identity.csrf, {});
      setIdentity(null);
      router.replace("/admin/login");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Logout failed");
    } finally {
      setPending(false);
    }
  }
  if (login)
    return (
      <div className={styles.root} data-admin lang="en">
        {children}
      </div>
    );
  if (!identity)
    return (
      <main className={`${styles.root} ${styles.login}`} data-admin lang="en">
        <p role={error ? "alert" : "status"}>
          {error || "Checking administrative session…"}
        </p>
        {error && <button onClick={() => setRetry(retry + 1)}>Retry</button>}
        <Link href="/">Storefront</Link>
      </main>
    );
  const restricted =
    path.startsWith("/admin/master") && identity.user.role !== "MASTER";
  return (
    <Identity.Provider value={identity}>
      <div className={styles.root} data-admin lang="en">
        <a className="skip-link" href="#admin-main">
          Skip to workspace
        </a>
        <header className={styles.header}>
          <Link href="/admin" className={styles.brand}>
            Paykar <small>Administration</small>
          </Link>
          <button
            aria-expanded={open}
            aria-controls="admin-navigation"
            onClick={() => setOpen(!open)}
          >
            Menu
          </button>
          <span>
            {identity.user.display_name} · {identity.user.role}
          </span>
          <button disabled={pending} onClick={logout}>
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </header>
        <div className={styles.layout}>
          <nav
            id="admin-navigation"
            aria-label="Administration"
            className={`${styles.nav} ${open ? styles.open : ""}`}
          >
            {navigationGroups
              .filter(
                (group) =>
                  group.label !== "Master" || identity.user.role === "MASTER",
              )
              .map((group) => (
                <div key={group.label} className={styles.navGroup}>
                  <span>{group.label}</span>
                  {group.links.map(([href, label]) => {
                    const target = `/admin${href ? `/${href}` : ""}`;
                    const active =
                      path === target ||
                      (href && path.startsWith(`${target}/`));
                    return (
                      <Link
                        key={href}
                        href={target}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            <Link href="/">Back to storefront ↗</Link>
          </nav>
          <main id="admin-main" className={styles.workspace}>
            {error && <p role="alert">{error}</p>}
            {restricted ? (
              <>
                <h1>Access restricted</h1>
                <p>MASTER permission is required.</p>
              </>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </Identity.Provider>
  );
}
