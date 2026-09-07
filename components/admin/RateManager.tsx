"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TASA_KEY,
  ENVIO_COSTO_KEY,
  ENVIO_GRATIS_KEY,
  DEFAULT_RATE,
} from "@/lib/precios";
import { formatBs } from "@/lib/format";

export default function RateManager() {
  const [rate, setRate] = useState<string>(String(DEFAULT_RATE));
  const [costo, setCosto] = useState<string>("");
  const [gratis, setGratis] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      let supabase: ReturnType<typeof createClient> | null = null;
      try {
        supabase = createClient();
      } catch {
        setLoading(false);
        setError("Falta configurar Supabase.");
        return;
      }
      const { data } = await supabase.from("settings").select("key, value");
      setLoading(false);
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      if (map[TASA_KEY]) setRate(map[TASA_KEY]);
      if (map[ENVIO_COSTO_KEY]) setCosto(map[ENVIO_COSTO_KEY]);
      if (map[ENVIO_GRATIS_KEY]) setGratis(map[ENVIO_GRATIS_KEY]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const save = async () => {
    const n = parseFloat(rate);
    if (isNaN(n) || n <= 0) {
      setError("La tasa debe ser un número mayor que 0.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      setSaving(false);
      setError("Falta configurar Supabase.");
      return;
    }

    const entries: { key: string; value: string }[] = [
      { key: TASA_KEY, value: rate.trim() },
    ];
    const newCosto = parseFloat(costo);
    if (Number.isFinite(newCosto) && newCosto >= 0) {
      entries.push({ key: ENVIO_COSTO_KEY, value: newCosto.toFixed(2) });
    }
    const newGratis = parseFloat(gratis);
    if (Number.isFinite(newGratis) && newGratis > 0) {
      entries.push({ key: ENVIO_GRATIS_KEY, value: newGratis.toFixed(2) });
    }

    for (const e of entries) {
      const { error: upErr } = await supabase.from("settings").upsert(e);
      if (upErr) {
        setSaving(false);
        setError(`No se pudo guardar ${e.key}: ${upErr.message}`);
        return;
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const current = parseFloat(rate);
  const costoNum = parseFloat(costo);

  return (
    <main className="admin-main">
      <div className="admin-head">
        <h1>Tasa de cambio y entrega</h1>
      </div>

      <div className="view-card" style={{ maxWidth: 480 }}>
        <div className="pay-hero">
          <p className="pay-title">💱 Bolívares por dólar</p>
          <p className="pay-sub">
            Los precios se guardan en dólares. El cliente ve el total en
            bolívares usando esta tasa.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {saved && <div className="auth-info">✅ ¡Guardado! Recarga la tienda para verlo.</div>}

        <div className="field">
          <label htmlFor="tasa">
            Tasa · 1 USD ={" "}
            <b>
              {Number.isFinite(current)
                ? current.toLocaleString("es-VE")
                : "—"}{" "}
              Bs
            </b>
          </label>
          <input
            id="tasa"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            disabled={loading}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="costo">
            Recargo por delivery (USD){" "}
            {Number.isFinite(costoNum) && Number.isFinite(current) ? (
              <span className="hint">≈ {formatBs(costoNum * current)}</span>
            ) : null}
          </label>
          <input
            id="costo"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.10"
            min="0"
            disabled={loading}
            placeholder="Ej: 1.00"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="gratis">
            Delivery gratis desde (USD){" "}
            <span className="hint">(vacío = siempre se cobra)</span>
          </label>
          <input
            id="gratis"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.10"
            min="0"
            disabled={loading}
            placeholder="Ej: 8.00"
            value={gratis}
            onChange={(e) => setGratis(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          disabled={saving || loading}
          onClick={save}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </main>
  );
}