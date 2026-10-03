import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { storePages } from "@/lib/store-content";
import { PublicPage } from "@/components/store-pages";
import { DeliveryPage } from "@/components/delivery-page";
export function generateStaticParams() {
  return storePages.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = storePages.find((item) => item.slug === slug);
  if (!page) notFound();
  return { title: `${page.title} · Пайкар`, description: page.description };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = storePages.find((item) => item.slug === slug);
  if (!page) notFound();
  return page.slug === "delivery" ? (
    <DeliveryPage />
  ) : (
    <PublicPage page={page} />
  );
}
