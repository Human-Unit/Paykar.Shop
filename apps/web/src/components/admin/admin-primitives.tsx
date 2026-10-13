import type { ReactNode } from "react";
import { statusPresentation } from "@/lib/admin-presentation";
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
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 tabIndex={-1}>{title}</h1>
      </div>
      {children}
    </header>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = statusPresentation(status);
  return (
    <span
      className={`${styles.status} ${tone === "neutral" ? "" : styles[tone]}`}
      title={
        label === "Low stock"
          ? "Stock sufficient for five minimum purchase quantities or fewer."
          : undefined
      }
    >
      {label}
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
      <table className={styles.table} role="table">
        {children}
      </table>
    </div>
  );
}
export function FilterBar({
  children,
  onSubmit,
  compact = false,
}: {
  children: ReactNode;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  compact?: boolean;
}) {
  return (
    <form
      className={`${styles.toolbar} ${compact ? styles.compactToolbar : ""}`}
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

export function AdminSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.adminSection}>
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className={styles.formSection}>
      <legend>{title}</legend>
      {description && <p>{description}</p>}
      <div className={styles.fieldGrid}>{children}</div>
    </fieldset>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}
export function TableLoading() {
  return (
    <div
      className={styles.tableLoading}
      role="status"
      aria-label="Loading records"
    >
      <span className="sr-only">Loading records…</span>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
