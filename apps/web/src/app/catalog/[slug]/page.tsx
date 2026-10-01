import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { Loading } from "@/components/states";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <Catalog slug={slug} />
    </Suspense>
  );
}
