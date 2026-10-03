import { ensureEntity } from "@/lib/server-api";
export const dynamic = "force-dynamic";
import { ProductDetail } from "@/components/product-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await ensureEntity(`/products/${encodeURIComponent(slug)}`);
  return <ProductDetail slug={slug} />;
}
