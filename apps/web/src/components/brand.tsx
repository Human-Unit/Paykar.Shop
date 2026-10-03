"use client";

import Image from "next/image";
import Link from "next/link";
import { usePresentation } from "@/context/presentation";

export function Brand() {
  const { t } = usePresentation();
  return (
    <Link
      href="/"
      className="brand paykar-brand"
      aria-label={t("Пайкар, главная")}
    >
      <Image
        className="brand-image"
        src="/images/paykar/logo.png"
        alt="Пайкар"
        width={5234}
        height={1454}
        unoptimized
      />
    </Link>
  );
}
