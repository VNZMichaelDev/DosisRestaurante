// Convierte la llave VAPID (base64url) al formato que espera PushManager.
export function urlBase64ToUint8Array(
  base64: string
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64url);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array;
}

function arrayToBase64(key: ArrayBuffer | null): string {
  if (!key) return "";
  const bytes = new Uint8Array(key);
  return btoa(String.fromCharCode(...bytes));
}

// Registra el service worker, pide permiso y guarda la suscripción
// en la tabla push_subscriptions para que le lleguen push al usuario.
export async function setupPush(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;

    const reg = await navigator.serviceWorker.register("/sw.js");
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) return;
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: arrayToBase64(subscription.getKey("p256dh")),
        auth: arrayToBase64(subscription.getKey("auth")),
      },
      { onConflict: "endpoint" }
    );
  } catch (err) {
    console.error("No se pudo activar las notificaciones push:", err);
  }
}
