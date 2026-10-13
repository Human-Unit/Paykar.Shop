import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ resource: string; record: string }>;
}) {
  const { resource, record } = await params;
  if (
    !["products", "promotions", "stores"].includes(resource) ||
    (record !== "new" && !/^[1-9]\d*$/.test(record)) ||
    (resource === "stores" && record === "new")
  )
    notFound();
  return (
    <AdminWorkspace
      key={`${resource}:${record}`}
      kind={resource as "products" | "promotions" | "stores"}
      recordId={record}
    />
  );
}
