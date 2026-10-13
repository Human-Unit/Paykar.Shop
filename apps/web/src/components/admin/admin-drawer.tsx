"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./admin.module.css";
export function AdminDrawer({
  children,
  close,
  pending,
  label,
  className = "",
}: {
  children: ReactNode;
  close: () => void;
  pending: boolean;
  label: string;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    const returnFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    node?.showModal();
    return () => {
      node?.close();
      // React removes the dialog before native close can restore focus reliably.
      queueMicrotask(() => {
        if (returnFocus?.isConnected) returnFocus.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`${styles.panel} ${styles.quickDrawer} ${className}`}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) close();
      }}
    >
      {children}
    </dialog>
  );
}
