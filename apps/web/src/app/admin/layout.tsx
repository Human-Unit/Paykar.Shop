import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <Suspense fallback={<p role="status">Loading workspace…</p>}>
        {children}
      </Suspense>
    </AdminShell>
  );
}
