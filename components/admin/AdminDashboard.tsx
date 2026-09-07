"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { ORDER_STATUSES, statusShort } from "@/lib/status";
import OrderCard from "@/components/admin/OrderCard";
import { BRANCHES } from "@/lib/branches";
import type { BranchId } from "@/lib/branches";

type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
};

type OrderWithClient = Order & {
  profiles?: Profile | null;
};

type Filter = "todas" | OrderStatus;
type BranchFilter = "todas" | BranchId;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "todas", label: "Todas" },
  ...ORDER_STATUSES.map((s) => ({ id: s.value as Filter, label: s.short })),
];

const BRANCH_FILTERS: { id: BranchFilter; label: string }[] = [
  { id: "todas", label: "Todas las sedes" },
  ...BRANCHES.map((b) => ({ id: b.id as BranchFilter, label: `${b.emoji} ${b.name}` })),
];

// Une los pedidos con su perfil (email/nombre del cliente).
function attachProfiles(orders: Order[], profiles: Profile[]): OrderWithClient[] {
  const map = new Map(profiles.map((p) => [p.id, p]));
  return orders.map((o) => ({ ...o, profiles: map.get(o.user_id) ?? null }));
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("todas");
  const [branchFilter, setBranchFilter] = useState<BranchFilter>("todas");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof createClient> | null = null;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;

    try {
      supabase = createClient();
    } catch {
      // Sin variables de entorno configuradas
    }

    // Diferimos la carga para no llamar setState de forma síncrona.
    const timer = setTimeout(() => {
      if (!supabase) {
        setLoading(false);
        setConfigError(
          "Falta configurar Supabase. Revisa tus variables de entorno y vuelve a intentarlo."
        );
        return;
      }

      const load = async () => {
        const [{ data: ordersData }, { data: profilesData }] =
          await Promise.all([
            supabase
              .from("orders")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase.from("profiles").select("id, email, full_name, cedula"),
          ]);

        if (cancelled) return;
        setLoading(false);

        if (ordersData) {
          setOrders(
            attachProfiles(
              ordersData as Order[],
              (profilesData as Profile[]) ?? []
            )
          );
        } else {
          console.error(
            "Error cargando pedidos",
            ordersData,
            profilesData
          );
        }
      };

      load();

      // Realtime: nuevos pedidos y cambios de estado en vivo
      channel = supabase
        .channel("admin-orders-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          async (payload) => {
            const newOrder = payload.new as Order;
            const [{ data: orderData }, { data: profileData }] =
              await Promise.all([
                supabase
                  .from("orders")
                  .select("*")
                  .eq("id", newOrder.id)
                  .maybeSingle(),
                supabase
                  .from("profiles")
                  .select("id, email, full_name, cedula")
                  .eq("id", newOrder.user_id)
                  .maybeSingle(),
              ]);
            if (cancelled) return;
            if (orderData) {
              setOrders((prev) => [
                {
                  ...(orderData as Order),
                  profiles: (profileData as Profile) ?? null,
                },
                ...prev.filter((o) => o.id !== orderData.id),
              ]);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders" },
          (payload) => {
            if (cancelled) return;
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === updated.id ? ({ ...o, ...updated } as OrderWithClient) : o
              )
            );
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "orders" },
          (payload) => {
            if (cancelled) return;
            const deleted = payload.old as Order;
            setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
          }
        )
        .subscribe();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    setUpdatingId(null);

    if (error) {
      console.error("Error actualizando estado", error);
      alert("No se pudo actualizar el estado. ¿Tienes permisos de admin?");
      return;
    }

    // Notifica al cliente por push (fire-and-forget).
    fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "order_status", orderId }),
    }).catch(() => {});
  };

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([["todas", orders.length]]);
    for (const s of ORDER_STATUSES) {
      map.set(
        s.value,
        orders.filter((o) => o.status === s.value).length
      );
    }
    return map;
  }, [orders]);

  const visible = useMemo(() => {
    const byStatus =
      filter === "todas" ? orders : orders.filter((o) => o.status === filter);
    return branchFilter === "todas"
      ? byStatus
      : byStatus.filter((o) => o.branch === branchFilter);
  }, [orders, filter, branchFilter]);

  return (
    <main className="admin-main">
      <div className="admin-head">
        <h1>Pedidos en tiempo real</h1>
        <span className="live">
          <span className="pulse-dot" /> EN VIVO
        </span>
      </div>

        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-tab ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span className="count">{counts.get(f.id) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="filter-tabs branch-tabs">
          {BRANCH_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-tab ${branchFilter === f.id ? "active" : ""}`}
              onClick={() => setBranchFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            Cargando pedidos…
          </div>
        ) : configError ? (
          <div className="admin-orders-empty">
            <span className="emoji">⚠️</span>
            <b>{configError}</b>
          </div>
        ) : (
          <div className="orders-grid">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updatingId === order.id}
                onChangeStatus={changeStatus}
              />
            ))}
            {visible.length === 0 && (
              <div className="admin-orders-empty">
                <span className="emoji">📭</span>
                <b>No hay pedidos aquí todavía.</b>
                <p>
                  {filter === "todas"
                    ? "Cuando un cliente haga un pedido, aparecerá en tiempo real."
                    : `No hay pedidos con el estado "${statusShort(filter)}".`}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
  );
}
