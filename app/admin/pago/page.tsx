import AdminHeader from "@/components/admin/AdminHeader";
import PayManager from "@/components/admin/PayManager";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export default async function AdminPagoPage() {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminHeader />
      <PayManager />
    </div>
  );
}