import AdminHeader from "@/components/admin/AdminHeader";
import RateManager from "@/components/admin/RateManager";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export default async function AdminPreciosPage() {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminHeader />
      <RateManager />
    </div>
  );
}