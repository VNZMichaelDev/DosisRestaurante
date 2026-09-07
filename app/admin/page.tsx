import AdminHeader from "@/components/admin/AdminHeader";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminHeader />
      <AdminDashboard />
    </div>
  );
}
