"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { adminApi, AdminError, type AdminIdentity } from "@/lib/admin-api";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Layers,
  Boxes,
  Tags,
  Store,
  Paintbrush,
  Users,
  Settings,
  ArrowUpRight,
  Menu,
} from "lucide-react";
import { AdminDrawer } from "./admin-drawer";
import { StatusBadge } from "./admin-primitives";
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
      ["inventory", "Inventory"],
      ["promotions", "Promotions"],
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
const navigationIcons = {
  "": LayoutDashboard,
  orders: ClipboardList,
  products: Package,
  categories: Layers,
  inventory: Boxes,
  promotions: Tags,
  stores: Store,
  "master/design": Paintbrush,
  "master/administrators": Users,
  settings: Settings,
};

function AdminNavigation({
  path,
  master,
  operational,
  close,
  id,
}: {
  path: string;
  master: boolean;
  operational: boolean;
  close: () => void;
  id: string;
}) {
  return (
    <nav id={id} aria-label="Administration" className={styles.nav}>
      {operational && (
        <Link href="/admin" className={styles.brand} onClick={close}>
          PAYKAR <small>Administration</small>
        </Link>
      )}
      {navigationGroups
        .filter((group) => group.label !== "Master" || master)
        .map((group) => (
          <div className={styles.navGroup} key={group.label}>
            <span>{group.label}</span>
            {group.links.map(([href, label]) => {
              const target = `/admin${href ? `/${href}` : ""}`,
                active =
                  path === target ||
                  Boolean(href && path.startsWith(`${target}/`)),
                Icon = navigationIcons[href];
              return (
                <Link
                  href={target}
                  key={href}
                  aria-current={active ? "page" : undefined}
                  onClick={close}
                >
                  {operational && <Icon size={17} aria-hidden="true" />}
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      <Link href="/" onClick={close}>
        {operational && <ArrowUpRight size={17} aria-hidden="true" />}Back to
        storefront ↗
      </Link>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const login = path === "/admin/login";
  const designTool =
    path === "/admin/master/design" || path.startsWith("/admin/master/design/");
  const rootClass = `${styles.root} ${designTool ? "" : styles.operational}`;
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
      <div className={rootClass} data-admin lang="en">
        {children}
      </div>
    );
  if (!identity)
    return (
      <main className={`${rootClass} ${styles.login}`} data-admin lang="en">
        <p role={error ? "alert" : "status"}>
          {error || "Checking administrative session…"}
        </p>
        {error && <button onClick={() => setRetry(retry + 1)}>Retry</button>}
        <Link href="/">Storefront</Link>
      </main>
    );
  const restricted =
    path.startsWith("/admin/master") && identity.user.role !== "MASTER";
  const header = (
    <header className={styles.header}>
      {designTool ? (
        <Link href="/admin" className={styles.brand}>
          Paykar <small>Administration</small>
        </Link>
      ) : (
        <span className={styles.headerTitle}>Administration</span>
      )}
      <button
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="admin-navigation-mobile"
        onClick={() => setOpen(true)}
      >
        <Menu size={18} aria-hidden="true" />
        <span className="sr-only">Menu</span>
      </button>
      {designTool ? (
        <span>
          {identity.user.display_name} · {identity.user.role}
        </span>
      ) : (
        <div className={styles.account}>
          <span title={identity.user.display_name}>
            {identity.user.display_name}
          </span>
          <StatusBadge status={identity.user.role} />
        </div>
      )}
      <button disabled={pending} onClick={logout}>
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </header>
  );
  return (
    <Identity.Provider value={identity}>
      <div className={rootClass} data-admin lang="en">
        <a className="skip-link" href="#admin-main">
          Skip to workspace
        </a>
        {designTool && header}
        <div className={styles.layout}>
          {!designTool && header}
          <AdminNavigation
            path={path}
            master={identity.user.role === "MASTER"}
            operational={!designTool}
            close={() => setOpen(false)}
            id="admin-navigation"
          />
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
        {open && (
          <AdminDrawer
            label="Administration navigation"
            pending={false}
            close={() => setOpen(false)}
            className={styles.sidebarDialog}
          >
            <button
              className={styles.sidebarClose}
              onClick={() => setOpen(false)}
            >
              Close navigation
            </button>
            <AdminNavigation
              path={path}
              master={identity.user.role === "MASTER"}
              operational={!designTool}
              close={() => setOpen(false)}
              id="admin-navigation-mobile"
            />
          </AdminDrawer>
        )}
      </div>
    </Identity.Provider>
  );
}
