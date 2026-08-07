"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProductIcon from "@/components/ProductIcon";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import { formatBs } from "@/lib/format";
import { useMounted } from "@/lib/useMounted";
import { createClient } from "@/lib/supabase/client";
import type { SavedAddress } from "@/types";

export default function CarritoPage() {
  const router = useRouter();
  const { items, total, updateQty, removeItem, clear } = useCart();
  const { show } = useToast();

  const mounted = useMounted();
  const [checkout, setCheckout] = useState(false);
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "retiro">(
    "delivery"
  );
  const [address, setAddress] = useState("");
  const [deliveryRef, setDeliveryRef] = useState("");
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [saveNew, setSaveNew] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locLat, setLocLat] = useState<number | null>(null);
  const [locLng, setLocLng] = useState<number | null>(null);
  const [locatingLoc, setLocatingLoc] = useState(false);
  const [locErr, setLocErr] = useState<string | null>(null);

  // Recargo de entrega (en Bs) configurado en el panel.
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [gratisEnvio, setGratisEnvio] = useState<number | null>(null);
  // Datos del Pago Móvil configurados por el dueño.
  const [pm, setPm] = useState<{
    bank: string;
    phone: string;
    holder: string;
    ci: string;
  }>({ bank: "", phone: "", holder: "", ci: "" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/delivery")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.ok) return;
        setCostoEnvio(d.costo_bs ?? 0);
        setGratisEnvio(d.gratis_bs ?? null);
      })
      .catch(() => {});
    fetch("/api/pago")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.ok) return;
        setPm({
          phone: d.phone ?? "",
          bank: d.bank ?? "",
          holder: d.holder ?? "",
          ci: d.ci ?? "",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      // Sin configuración
    }
    if (!supabase) return () => {};
    (async () => {
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase!
        .from("saved_addresses")
        .select("*")
        .order("created_at", { ascending: false });
      if (!cancelled && data) setSaved(data as SavedAddress[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const phoneValid = /^04\d{9}$/.test(phone.replace(/\s/g, ""));
  const refValid = /^\d{6}$/.test(reference);
  const addressValid = address.trim().length >= 5;

  // Dirección efectiva: la guardada seleccionada, o la que escribe ahora.
  const chosen = saved.find((s) => s.id === chosenId) ?? null;
  const effAddress = chosen ? chosen.address : address.trim();
  const effRef = chosen ? (chosen.reference ?? "") : deliveryRef.trim();
  const effAddressValid = chosen ? true : effAddress.length >= 5;

  const canPay =
    phoneValid &&
    refValid &&
    (deliveryType === "retiro" || effAddressValid);

  // Total: productos + recargo de delivery (si aplica).
  const gratisAplica =
    gratisEnvio != null && total >= gratisEnvio;
  const envio =
    deliveryType === "delivery" && !gratisAplica ? costoEnvio : 0;
  const grandTotal = Math.round((total + envio) * 100) / 100;

  const shareLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocErr("Tu navegador no soporta compartir ubicación.");
      return;
    }
    setLocatingLoc(true);
    setLocErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocLat(pos.coords.latitude);
        setLocLng(pos.coords.longitude);
        setLocatingLoc(false);
      },
      () => {
        setLocatingLoc(false);
        setLocErr(
          "No pudimos obtener tu ubicación. Permite el acceso al GPS e intenta de nuevo."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const placeOrder = async () => {
    if (!canPay) return;
    setError(null);
    setLoading(true);

    let supabase;
    try {
      supabase = createClient();
    } catch {
      setError(
        "Falta configurar Supabase. Revisa tus variables de entorno y vuelve a intentarlo."
      );
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth?next=/carrito");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        total: grandTotal,
        payment_phone: phone.replace(/\s/g, ""),
        payment_reference: reference,
        delivery_type: deliveryType,
        delivery_address:
          deliveryType === "delivery" ? effAddress || null : null,
        delivery_reference:
          deliveryType === "delivery" ? effRef || null : null,
        lat: locLat ?? null,
        lng: locLng ?? null,
        status: "pendiente",
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(
        `No se pudo crear el pedido: ${
          insertError.message === "Database error saving new record"
            ? "revisa que las políticas RLS y el esquema de Supabase estén aplicados."
            : insertError.message
        }`
      );
      return;
    }

    // Si pidió guardar esta dirección nueva, la registramos para su cuenta.
    if (
      deliveryType === "delivery" &&
      !chosen &&
      saveNew &&
      effAddress.length >= 5
    ) {
      const label = saveLabel.trim() || "Mi dirección";
      await supabase.from("saved_addresses").insert({
        user_id: user.id,
        label,
        address: effAddress,
        reference: effRef || null,
      });
    }

    clear();
    show("Pedido enviado");

    // Notifica al admin por push (fire-and-forget, no bloquea al cliente).
    fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "new_order", orderId: data.id }),
    }).catch(() => {});

    router.push(`/pedido/${data.id}`);
  };

  if (mounted && items.length === 0 && !checkout) {
    return (
      <AppShell>
        <div className="page-pad">
          <h1 className="page-title">Tu carrito</h1>
          <p className="page-sub">Revisa lo que llevas antes de pagar.</p>
          <div className="view-card">
            <div className="empty-state">
              <span className="emoji">🛒</span>
              <h3>Tu carrito está vacío</h3>
              <p>Agrega tus cachapas, burgers y papas favoritas.</p>
              <Link href="/" className="btn btn-primary">
                Explorar el menú
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-pad">
        <h1 className="page-title">Tu carrito</h1>
        <p className="page-sub">
          {checkout
            ? "Completa tu pago móvil para confirmar el pedido."
            : `${items.length} ${items.length === 1 ? "producto" : "productos"} en tu carrito.`}
        </p>

        {!checkout ? (
          <>
            <div className="view-card">
              {items.map((item) => (
                <div className="cart-line" key={item.id}>
                  <div className="thumb">
                    <ProductIcon icon={item.icon} size={32} />
                  </div>
                  <div className="info">
                    <h4>{item.name}</h4>
                    <div className="price">{formatBs(item.price)}</div>
                  </div>
                  <div className="qty">
                    <button onClick={() => updateQty(item.id, item.qty - 1)}>
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    className="cart-remove"
                    aria-label="Quitar"
                    onClick={() => removeItem(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />

            <div className="deliver-type">
              <button
                type="button"
                className={deliveryType === "delivery" ? "active" : ""}
                onClick={() => setDeliveryType("delivery")}
              >
                🛵 Delivery
              </button>
              <button
                type="button"
                className={deliveryType === "retiro" ? "active" : ""}
                onClick={() => setDeliveryType("retiro")}
              >
                🏪 Retiro en el local
              </button>
            </div>

            <div className="cart-summary">
              <div className="row">
                <span>Subtotal</span>
                <span>{formatBs(total)}</span>
              </div>
              <div className="row">
                <span>Envío</span>
                <span>
                  {deliveryType === "delivery"
                    ? gratisAplica
                      ? "Gratis 🎉"
                      : formatBs(envio)
                    : "—"}
                </span>
              </div>
              <div className="row total">
                <span>Total a pagar</span>
                <span>{formatBs(grandTotal)}</span>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={() => setCheckout(true)}
              >
                Continuar al pago
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="view-card">
              <div className="pm-card">
                <div className="pm-top">
                  <p className="pay-title">💳 Pago Móvil</p>
                  <p className="pay-sub">Paga ahora mismo desde tu banca.</p>
                </div>

                <div className="pm-total">
                  <span>Total a pagar</span>
                  <b>{formatBs(grandTotal)}</b>
                </div>

                {(pm.phone || pm.bank) && (
                  <div className="pm-grid">
                    {pm.bank && (
                      <div className="pm-cell">
                        <span>Banco</span>
                        <b>{pm.bank}</b>
                      </div>
                    )}
                    {pm.phone && (
                      <div className="pm-cell">
                        <span>Número</span>
                        <b className="pm-phone">{pm.phone}</b>
                      </div>
                    )}
                    {pm.holder && (
                      <div className="pm-cell">
                        <span>Titular</span>
                        <b>{pm.holder}</b>
                      </div>
                    )}
                    {pm.ci && (
                      <div className="pm-cell">
                        <span>Cédula / RIF</span>
                        <b>{pm.ci}</b>
                      </div>
                    )}
                  </div>
                )}

                {pm.phone && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-block btn-sm"
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText(pm.phone)
                        .then(() => show("Número copiado"))
                        .catch(() => {})
                    }
                  >
                    📋 Copiar número
                  </button>
                )}
              </div>

              <div className="pay-instructions">
                <b>¿Cómo pagar?</b>
                <br />1. Abre tu app bancaria y elige <b>Pago Móvil</b>.
                <br />2. Transfiere el <b>total a pagar</b> a los datos de
                arriba.
                <br />3. Escribe aquí tu número y los <b>últimos 6 dígitos</b>{" "}
                de la referencia para confirmar.
              </div>

              {error && <div className="auth-error">{error}</div>}

              {deliveryType === "delivery" && (
                <>
                  {saved.length > 0 && (
                    <div className="saved-addr">
                      <div className="saved-addr-title">
                        Tus direcciones guardadas
                      </div>
                      {saved.map((sa) => (
                        <label
                          key={sa.id}
                          className={`addr-chip ${
                            chosenId === sa.id ? "active" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="addr"
                            checked={chosenId === sa.id}
                            onChange={() => setChosenId(sa.id)}
                          />
                          <span className="addr-labels">
                            <b>{sa.label}</b>
                            <span>{sa.address}</span>
                          </span>
                        </label>
                      ))}
                      <button
                        type="button"
                        className={`btn btn-ghost btn-sm ${
                          chosenId ? "" : "selected"
                        }`}
                        onClick={() => setChosenId(null)}
                      >
                        {chosenId ? "+ Usar otra dirección" : "✏️ Escribir otra"}
                      </button>
                    </div>
                  )}

                  {!chosenId && (
                    <>
                      <div className="field">
                        <label htmlFor="address">Dirección de entrega</label>
                        <textarea
                          id="address"
                          className="input"
                          rows={2}
                          placeholder="Ej: Av. Las Palmas, Res. Sol, Edif. 2, apto 4, Sector La Florida"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                        {address.length > 0 && !addressValid && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#c4241e",
                              fontWeight: 700,
                            }}
                          >
                            Escribe una dirección más completa.
                          </span>
                        )}
                      </div>
                      <div className="field">
                        <label htmlFor="dref">
                          Punto de referencia (opcional)
                        </label>
                        <input
                          id="dref"
                          className="input"
                          type="text"
                          placeholder="Ej: frente al abasto, casa amarilla"
                          value={deliveryRef}
                          onChange={(e) => setDeliveryRef(e.target.value)}
                        />
                      </div>
                      {addressValid && (
                        <label className="save-new">
                          <input
                            type="checkbox"
                            checked={saveNew}
                            onChange={(e) => setSaveNew(e.target.checked)}
                          />
                          <span>
                            Guardar esta dirección para la próxima vez
                          </span>
                        </label>
                      )}
                      {saveNew && (
                        <div className="field">
                          <label htmlFor="alabel">Nombre</label>
                          <input
                            id="alabel"
                            className="input"
                            type="text"
                            placeholder="Ej: Mi casa"
                            value={saveLabel}
                            onChange={(e) => setSaveLabel(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div style={{ height: 12 }} />
              <button
                type="button"
                className={`loc-btn ${locLat != null ? "done" : ""}`}
                onClick={shareLocation}
                disabled={locatingLoc}
              >
                {locatingLoc
                  ? "⏳ Obteniendo ubicación…"
                  : locLat != null
                    ? "✓ Ubicación compartida"
                    : "📍 Compartir mi ubicación (opcional)"}
              </button>
              {locLat != null && (
                <div className="loc-ok">
                  ✅ El repartidor verá tu pin exacto
                  <a
                    href={`https://www.google.com/maps?q=${locLat},${locLng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver en mapa
                  </a>
                </div>
              )}
              {locErr && <div className="loc-err">{locErr}</div>}

              <div className="field">
                <label htmlFor="phone">Número de teléfono emisor</label>
                <input
                  id="phone"
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="0412 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {phone.length > 0 && !phoneValid && (
                  <span style={{ fontSize: 11, color: "#c4241e", fontWeight: 700 }}>
                    Debe ser un número venezolano (04XX-XXXXXXX)
                  </span>
                )}
              </div>

              <div className="field">
                <label htmlFor="reference">
                  Últimos 6 dígitos de la referencia
                </label>
                <input
                  id="reference"
                  className="input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Ej: 482913"
                  value={reference}
                  onChange={(e) =>
                    setReference(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                disabled={!canPay || loading}
                onClick={placeOrder}
              >
                {loading ? "Enviando pedido…" : `Confirmar pedido · ${formatBs(grandTotal)}`}
              </button>

              <div style={{ height: 10 }} />
              <button
                className="btn btn-ghost btn-block btn-sm"
                onClick={() => setCheckout(false)}
              >
                ← Volver al carrito
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
