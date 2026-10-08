"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/lib/api";
import { usePresentation } from "@/context/presentation";
import { ProductImage } from "./product-card";

// A presentation-only row identity shared by the template editor, picker and preview.
export function ShoppingProductIdentity({
  product,
  name,
  children,
}: {
  product?: Pick<Product, "name" | "slug" | "image_url"> | null;
  name?: string;
  children?: ReactNode;
}) {
  const { t } = usePresentation();
  return (
    <div className="product-identity">
      <span className="product-thumbnail" aria-hidden="true">
        {product ? <ProductImage product={product} /> : <Package size={24} />}
      </span>
      <div className="product-identity-copy">
        {product ? (
          <Link href={`/product/${product.slug}`}>{t(product.name)}</Link>
        ) : (
          <span>{t(name || "Больше не продаётся")}</span>
        )}
        {children}
      </div>
    </div>
  );
}
