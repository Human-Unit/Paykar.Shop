import { ShoppingTemplateDetail } from "@/components/my-shopping";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShoppingTemplateDetail id={id} />;
}
