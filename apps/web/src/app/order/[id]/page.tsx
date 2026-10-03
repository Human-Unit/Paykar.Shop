import { ensureEntity } from "@/lib/server-api";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import { OrderConfirmation } from "@/components/order-confirmation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  await ensureEntity(`/orders/${encodeURIComponent(id)}`);
  return <OrderConfirmation id={id} />;
}
