"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/types";
import { formatBs, formatDate, shortId } from "@/lib/format";
import { statusLabel } from "@/lib/status";
import { createClient } from "@/lib/supabase/client";

const STEPS: { status: OrderStatus; label: string; hint: string; emoji: string }[] = [
  {
    status: "pendiente",
    label: "Pendiente por verificar",
    hint: "Confirmamos tu pago móvil",
    emoji: "⏳",
  },
  {
    status: "en_preparacion",
    label: "En preparación",
    hint: "Nuestro equipo cocina tu pedido",
    emoji: "🍳",
  },
  {
    status: "en_camino",
    label: "En camino",
    hint: "Tu pedido va rumbo a ti",
    emoji: "🛵",
  },
  {
    status: "entregado",
    label: "Entregado",
    hint: "¡Disfruta tu comida!",
    emoji: "✅",
  },
];

export default function OrderTracker({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError(
          "Falta configurar Supabase. Revisa tus variables de entorno y vuelve a intentarlo."
        );
        return;
      }

      const load = async () => {
        const { data, error: fetchError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (cancelled) return;

        if (fetchError) {
          setError("No pudimos cargar tu pedido.");
          return;
        }
        if (!data) {
          setError("Pedido no encontrado.");
          return;
        }
        setOrder(data as Order);
      };

      load();

      channel = supabase
        .channel(`order-track-${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (!cancelled) setOrder(payload.new as Order);
          }
        )
        .subscribe();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) supabase?.removeChannel(channel);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="page-pad">
        <div className="view-card">
          <div className="empty-state">
            <span className="emoji">📦</span>
            <h3>{error}</h3>
            <p>
              Asegúrate de haber iniciado sesión con la cuenta con la que
              hiciste el pedido.
            </p>
            <Link href="/" className="btn btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Cargando tu pedido…
      </div>
    );
  }

  const canceled = order.status === "cancelado";
  const currentIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="page-pad">
      <div className="section-head" style={{ padding: "0 0 12px" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 20 }}>
            Pedido #{shortId(order.id)}
          </h1>
          <p className="page-sub" style={{ margin: "4px 0 0" }}>
            Hecho el {formatDate(order.created_at)}
          </p>
        </div>
        <span className={`status-badge status-${order.status}`}>
          {statusLabel(order.status)}
        </span>
      </div>

      {canceled && (
        <div className="auth-error" style={{ marginBottom: 14 }}>
          Este pedido fue cancelado. Si crees que es un error, contáctanos por
          WhatsApp.
        </div>
      )}

      <div className="view-card">
        {!canceled ? (
          <div className="timeline">
            {STEPS.map((step, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex;
              return (
                <div
                  key={step.status}
                  className={`tl-step ${done ? "done" : ""} ${
                    current ? "current" : ""
                  }`}
                >
                  <div className="tl-dot">{done ? "✓" : step.emoji}</div>
                  <div className="tl-body">
                    <b>{step.label}</b>
                    <span>{step.hint}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span className="emoji">❌</span>
            <h3>Pedido cancelado</h3>
            <p>El estado cambió a cancelado.</p>
          </div>
        )}
      </div>

      <div style={{ height: 14 }} />

      <div className="view-card">
        <div className="section-head" style={{ padding: "0 0 8px" }}>
          <h3 style={{ fontSize: 15 }}>Detalle del pedido</h3>
        </div>
        {order.items.map((item, i) => (
          <div className="oc-item" key={`${item.id}-${i}`}>
            <span>
              <span className="q">{item.qty}×</span> {item.name}
            </span>
            <span className="s">{formatBs(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="oc-total">
          <span>Total</span>
          <span>{formatBs(order.total)}</span>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="view-card">
        <div className="section-head" style={{ padding: "0 0 8px" }}>
          <h3 style={{ fontSize: 15 }}>
            {order.delivery_type === "retiro"
              ? "Dónde recibirlo"
              : "Datos de entrega"}
          </h3>
        </div>
        <div className="order-meta">
          <div className="meta-cell">
            <b>Modalidad</b>
            <span>
              {order.delivery_type === "retiro"
                ? "🏪 Retiro en el local"
                : "🛵 Entrega a domicilio"}
            </span>
          </div>
          {order.delivery_type !== "retiro" && (
            <div className="meta-cell meta-cell-full">
              <b>Dirección</b>
              <span>{order.delivery_address || "—"}</span>
            </div>
          )}
          {order.delivery_reference && (
            <div className="meta-cell meta-cell-full">
              <b>Punto de referencia</b>
              <span>{order.delivery_reference}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="view-card">
        <div className="section-head" style={{ padding: "0 0 8px" }}>
          <h3 style={{ fontSize: 15 }}>Datos del pago</h3>
        </div>
        <div className="order-meta">
          <div className="meta-cell">
            <b>Teléfono emisor</b>
            <span>{order.payment_phone}</span>
          </div>
          <div className="meta-cell">
            <b>Referencia</b>
            <span>•••• {order.payment_reference}</span>
          </div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <p
        style={{
          textAlign: "center",
          fontSize: 12.5,
          color: "var(--ink-soft)",
          fontWeight: 600,
        }}
      >
        El estado se actualiza en tiempo real. Mantén esta página abierta para
        ver los cambios de tu pedido. 🟢
      </p>

      <div style={{ height: 8 }} />

      <Link href="/" className="btn btn-ghost btn-block btn-sm">
        Seguir viendo el menú
      </Link>
    </div>
  );
}
