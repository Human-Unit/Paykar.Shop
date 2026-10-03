"use client";
import { usePresentation } from "@/context/presentation";
import Link from "next/link";
export function Breadcrumbs({
  items,
}: {
  items: {
    label: string;
    href?: string;
  }[];
}) {
  const { t } = usePresentation();
  return (
    <nav className="breadcrumb" aria-label={t("Хлебные крошки")}>
      <ol>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href}>{t(item.label)}</Link>
            ) : (
              <span aria-current="page">{t(item.label)}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
