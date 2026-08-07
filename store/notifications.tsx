"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Order } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { setupPush } from "@/lib/push";
import { useToast } from "@/store/toast";
import { formatBs, shortId } from "@/lib/format";
import { statusShort } from "@/lib/status";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  emoji: string;
  ts: number;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  clear: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

const STORAGE_KEY = "dosis-notifications";
const MAX_ITEMS = 50;

function beep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    setTimeout(() => ctx.close(), 700);
  } catch {
    // Sin soporte de audio
  }
}

function readStored(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { show } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>(
    readStored
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications]);

  const push = useCallback(
    (title: string, body: string, emoji: string) => {
      const n: AppNotification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        body,
        emoji,
        ts: Date.now(),
        read: false,
      };
      setNotifications((prev) => [n, ...prev].slice(0, MAX_ITEMS));
      beep();
      show(`${emoji} ${title}`);
    },
    [show]
  );

  // Escucha en tiempo real: los clientes reciben cambios de sus pedidos;
  // el admin recibe cada pedido nuevo.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let supabase: ReturnType<typeof createClient> | null = null;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;

    const timer = setTimeout(async () => {
      try {
        supabase = createClient();
      } catch {
        // Sin variables de entorno
      }
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      // Web Push: registra la suscripción para que las notificaciones
      // lleguen aunque la página esté cerrada.
      setupPush(user.id);

      let isAdmin = false;
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = profile?.is_admin ?? false;

      channel = supabase.channel("app-notifications");

      if (isAdmin) {
        channel.on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            if (cancelled) return;
            const order = payload.new as Order;
            push(
              "Nuevo pedido",
              `#${shortId(order.id)} · ${formatBs(order.total)}`,
              "🛎️"
            );
          }
        );
      } else {
        channel
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "orders",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (cancelled) return;
              const order = payload.new as Order;
              push(
                "Pedido enviado",
                `#${shortId(order.id)} · pendiente de verificar`,
                "✅"
              );
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "orders",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (cancelled) return;
              const order = payload.new as Order;
              push(
                "Pedido actualizado",
                `#${shortId(order.id)} · ${statusShort(order.status)}`,
                "📦"
              );
            }
          );
      }

      channel.subscribe();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) supabase?.removeChannel(channel);
    };
  }, [push]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.read ? n : { ...n, read: true }))
    );
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllRead, clear }),
    [notifications, unreadCount, markAllRead, clear]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error("useNotifications debe usarse dentro de <NotificationsProvider>");
  return ctx;
}
