import type { ReactNode } from "react";
import styles from "./admin.module.css";

export function AdminHeader({
  title,
  eyebrow = "Store operations",
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {children}
    </header>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const positive = [
    "Published",
    "PUBLISHED",
    "Active",
    "MASTER",
    "Delivered",
  ].includes(status);
  const warning = [
    "DRAFT",
    "Draft saved",
    "Unsaved changes",
    "Out of stock",
    "Disabled",
  ].includes(status);
  return (
    <span
      className={`${styles.status} ${positive ? styles.positive : warning ? styles.warning : ""}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
export function DataTable({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className={styles.tableWrap}
      tabIndex={0}
      role="region"
      aria-label={label}
      onPointerUp={(event) => {
        if (
          event.pointerType !== "mouse" ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          window.getSelection()?.toString()
        )
          return;
        const target = event.target;
        if (
          !(target instanceof Element) ||
          target.closest("a,button,input,select,textarea,label")
        )
          return;
        target
          .closest("tbody tr")
          ?.querySelector<HTMLAnchorElement | HTMLButtonElement>("a,button")
          ?.click();
      }}
    >
      <table className={styles.table}>{children}</table>
    </div>
  );
}
export function FilterBar({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form
      className={styles.toolbar}
      onSubmit={onSubmit}
      aria-label="Resource filters"
    >
      {children}
    </form>
  );
}
export function SaveBar({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.actions} ${styles.saveBar}`}>{children}</div>
  );
}
