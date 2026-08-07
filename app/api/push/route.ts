import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { statusLabel } from "@/lib/status";
import type { OrderStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject =
    process.env.VAPID_SUBJECT || "mailto:admin@dosis.com";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta configurar el servidor (service_role key o llaves VAPID).",
      },
      { status: 500 }
    );
  }

  let body: { action?: string; orderId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { action, orderId } = body;
  if (!orderId || (action !== "new_order" && action !== "order_status")) {
    return NextResponse.json(
      { ok: false, error: "Acción o pedido inválido" },
      { status: 400 }
    );
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  // Cliente con la service_role key: ignora RLS para leer/enviar.
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total, user_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ ok: false, error: "Pedido no encontrado" }, { status: 404 });
  }

  let userIds: string[] = [];
  if (action === "new_order") {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_admin", true);
    userIds = (admins ?? []).map((a) => a.id);
  } else {
    userIds = [order.user_id as string];
  }

  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);

  const subscriptions = (subs ?? []) as PushSubscriptionRow[];
  if (subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const short = String(order.id).slice(0, 8).toUpperCase();
  const payload = JSON.stringify({
    title:
      action === "new_order" ? "🛎️ Nuevo pedido en Dosis" : "📦 Tu pedido fue actualizado",
    body:
      action === "new_order"
        ? `Pedido #${short} · total ${order.total} Bs`
        : `Pedido #${short} · ${statusLabel(order.status as OrderStatus)}`,
    url: action === "new_order" ? "/admin" : `/pedido/${order.id}`,
  });

  const results = await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 3600 }
        );
        return { ok: true };
      } catch (err) {
        const e = err as { statusCode?: number };
        // La suscripción ya no existe: la eliminamos de la base.
        if (e.statusCode === 404 || e.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
        return { ok: false };
      }
    })
  );

  return NextResponse.json({
    ok: true,
    sent: results.filter((r) => r.ok).length,
  });
}
