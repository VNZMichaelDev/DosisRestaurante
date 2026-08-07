import AdminHeader from "@/components/admin/AdminHeader";
import BannerManager from "@/components/admin/BannerManager";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export default async function AdminBannerPage() {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminHeader />
      <BannerManager />
    </div>
  );
}
