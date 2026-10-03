"use client";

import {
  Apple,
  Milk,
  Croissant,
  GlassWater,
  Candy,
  SprayCan,
  Grid2X2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { usePresentation } from "@/context/presentation";

const icons: Record<string, LucideIcon> = {
  produce: Apple,
  fruit: Apple,
  dairy: Milk,
  bakery: Croissant,
  drinks: GlassWater,
  sweets: Candy,
  household: SprayCan,
};

export function CategoryLabel({ slug, name }: { slug?: string; name: string }) {
  const { t } = usePresentation();
  const Icon = (slug && icons[slug]) || Grid2X2;
  return (
    <>
      <Icon className="category-icon" size={18} aria-hidden="true" />
      <span>{t(name)}</span>
      <ChevronRight className="category-chevron" size={14} aria-hidden="true" />
    </>
  );
}
