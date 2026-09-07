import AdminHeader from "@/components/admin/AdminHeader";
import ProductsManager from "@/components/admin/ProductsManager";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminHeader />
      <ProductsManager />
    </div>
  );
}
