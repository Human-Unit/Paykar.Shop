import { OrderConfirmation } from "@/components/order-confirmation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderConfirmation id={id} />;
}
