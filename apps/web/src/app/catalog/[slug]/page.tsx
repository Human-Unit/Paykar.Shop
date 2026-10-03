import { ensureEntity } from "@/lib/server-api";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { Loading } from "@/components/states";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await ensureEntity(`/categories/${encodeURIComponent(slug)}`);
  return (
    <Suspense fallback={<Loading />}>
      <Catalog slug={slug} />
    </Suspense>
  );
}
