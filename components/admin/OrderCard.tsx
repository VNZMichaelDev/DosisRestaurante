"use client";

import type { Order, OrderStatus } from "@/types";
import { formatBs, formatDate, shortId } from "@/lib/format";
import { ORDER_STATUSES, statusLabel } from "@/lib/status";
import { branchEmoji, branchName } from "@/lib/branches";

interface OrderCardProps {
  order: Order & {
    profiles?: {
      email?: string | null;
      full_name?: string | null;
      cedula?: string | null;
    } | null;
  };
  updating: boolean;
  onChangeStatus: (id: string, status: OrderStatus) => void;
}

export default function OrderCard({
  order,
  updating,
  onChangeStatus,
}: OrderCardProps) {
  const clientName =
    order.profiles?.full_name || order.profiles?.email || "Cliente";

  return (
    <article className="order-card">
      <div className="oc-head">
        <div>
          <div className="oc-id">
            #{shortId(order.id)}
            {order.branch && (
              <span className="branch-badge">
                {branchEmoji(order.branch)} {branchName(order.branch)}
              </span>
            )}
          </div>
          <div className="oc-time">{formatDate(order.created_at)}</div>
        </div>
        <span className={`status-badge status-${order.status}`}>
          {statusLabel(order.status)}
        </span>
      </div>

      <div className="oc-body">
        <div className="oc-client">
          👤 {clientName}
          {order.profiles?.cedula && (
            <span className="oc-cedula">🪪 {order.profiles.cedula}</span>
          )}
        </div>

        <div className="oc-items">
          {order.items.map((item, i) => (
            <div className="oc-item" key={`${item.id}-${i}`}>
              <span>
                <span className="q">{item.qty}×</span> {item.name}
              </span>
              <span className="s">{formatBs(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="oc-total">
          <span>Total</span>
          <span>{formatBs(order.total)}</span>
        </div>

        <div className="oc-pay">
          <div className="pay-title">💳 Pago móvil</div>
          <div className="pay-line">
            <span>Teléfono emisor</span>
            <b>{order.payment_phone}</b>
          </div>
          <div className="pay-line">
            <span>Referencia</span>
            <b>•••• {order.payment_reference}</b>
          </div>
        </div>

        <div className={`oc-delivery ${order.delivery_type === "retiro" ? "retiro" : ""}`}>
          {order.delivery_type === "retiro" ? (
            <>
              <b>🏪 Retiro en el local</b>
              <p>El cliente recogerá su pedido.</p>
            </>
          ) : (
            <>
              <b>🛵 Entrega a domicilio</b>
              <p className="addr">{order.delivery_address || "Sin dirección"}</p>
              {order.delivery_reference && (
                <p className="ref">📍 {order.delivery_reference}</p>
              )}
            </>
          )}
          {order.lat != null && order.lng != null && (
            <a
              className="oc-map"
              href={`https://www.google.com/maps?q=${order.lat},${order.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              🗺️ Ver ubicación del cliente en Google Maps
            </a>
          )}
        </div>
      </div>

      <div className="oc-footer">
        <div className="oc-status">
          Estado:
          <select
            className="select"
            value={order.status}
            disabled={updating}
            onChange={(e) =>
              onChangeStatus(order.id, e.target.value as OrderStatus)
            }
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {updating && (
          <span className="spinner" style={{ width: 18, height: 18 }} />
        )}
      </div>
    </article>
  );
}
