import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import { statusLabel } from "@/lib/status";
import { formatBs, formatDate, shortId } from "@/lib/format";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/pedidos");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (error ? [] : (data as Order[])) ?? [];

  return (
    <AppShell>
      <div className="page-pad">
        <h1 className="page-title">Mis pedidos</h1>
        <p className="page-sub">
          {orders.length === 0
            ? "Todavía no has hecho pedidos."
            : `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"} en tu historial.`}
        </p>

        {orders.length === 0 ? (
          <div className="view-card">
            <div className="empty-state">
              <span className="emoji">📦</span>
              <h3>Sin pedidos aún</h3>
              <p>Cuando hagas tu primer pedido, aparecerá aquí para que lo sigas.</p>
              <Link href="/" className="btn btn-primary">
                Explorar el menú
              </Link>
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/pedido/${order.id}`}
                className="order-list-card"
              >
                <div className="ol-head">
                  <div>
                    <b>#{shortId(order.id)}</b>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <span className={`status-badge status-${order.status}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>
                <div className="ol-body">
                  <span>
                    {order.items.reduce((n, i) => n + i.qty, 0)} producto
                    {order.items.reduce((n, i) => n + i.qty, 0) === 1 ? "" : "s"}
                  </span>
                  <b>{formatBs(order.total)}</b>
                </div>
                <div className="ol-foot">Seguir pedido →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
