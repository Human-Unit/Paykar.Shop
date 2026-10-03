import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles } from "@/lib/store-content";
import { BlogArticle } from "@/components/store-pages";
export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  return { title: `${article.title} · Пайкар`, description: article.excerpt };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  return <BlogArticle article={article} />;
}
