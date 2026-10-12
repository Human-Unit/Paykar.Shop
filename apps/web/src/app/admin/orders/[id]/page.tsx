import { AdminWorkspace } from "@/components/admin/admin-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminWorkspace kind="orders" orderId={id} />;
}
