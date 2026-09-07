"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useNotifications, type AppNotification } from "@/store/notifications";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

function dayGroup(ts: number): string | null {
  const d = new Date(ts);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round(
    (startToday.getTime() - startDay.getTime()) / (1000 * 3600 * 24)
  );
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return "Esta semana";
  return "Antes";
}

export default function NotificacionesPage() {
  const { notifications, unreadCount, markAllRead, clear } =
    useNotifications();

  const groups = useMemo(() => {
    const order = ["Hoy", "Ayer", "Esta semana", "Antes"];
    const map = new Map<string, AppNotification[]>();
    for (const n of notifications) {
      const g = dayGroup(n.ts) ?? "Antes";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    }
    const result: { label: string; items: AppNotification[] }[] = [];
    for (const label of order) {
      if (map.has(label)) result.push({ label, items: map.get(label)! });
    }
    return result;
  }, [notifications]);

  return (
    <AppShell>
      <div className="page-pad">
        <h1 className="page-title">Notificaciones</h1>
        <p className="page-sub">
          {unreadCount > 0 ? `${unreadCount} sin leer.` : "Todo al día."}
        </p>

        <div className="notif-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            ✓ Marcar leídas
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={clear}
            disabled={notifications.length === 0}
          >
            🗑 Borrar todas
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="view-card">
            <div className="empty-state">
              <span className="emoji">🔔</span>
              <h3>Todo tranquilo</h3>
              <p>
                Cuando hagas un pedido o cambie de estado, te avisaremos aquí.
              </p>
              <Link href="/" className="btn btn-primary">
                Explorar el menú
              </Link>
            </div>
          </div>
        ) : (
          <div className="notif-list">
            {groups.map((g) => (
              <div className="notif-group" key={g.label}>
                <div className="notif-day">{g.label}</div>
                {g.items.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${n.read ? "" : "unread"}`}
                  >
                    <div className="notif-emoji">{n.emoji}</div>
                    <div className="notif-body">
                      <b>{n.title}</b>
                      <span>{n.body}</span>
                    </div>
                    <div className="notif-time">{timeAgo(n.ts)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
