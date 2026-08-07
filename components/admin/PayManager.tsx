"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PM_PHONE_KEY,
  PM_BANK_KEY,
  PM_HOLDER_KEY,
  PM_CI_KEY,
} from "@/lib/precios";

const FIELDS = [
  { key: PM_PHONE_KEY, label: "Número de Pago Móvil", placeholder: "0424 1234567" },
  { key: PM_BANK_KEY, label: "Banco", placeholder: "Ej: VENEZUELA" },
  { key: PM_HOLDER_KEY, label: "Titular de la cuenta", placeholder: "Nombre y apellido" },
  { key: PM_CI_KEY, label: "Cédula / RIF", placeholder: "V-12.345.678 o J-..." },
];

export default function PayManager() {
  const [values, setValues] = useState<Record<string, string>>({});
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
      const next: Record<string, string> = {};
      for (const f of FIELDS) next[f.key] = map[f.key] || "";
      setValues(next);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const save = async () => {
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
    for (const f of FIELDS) {
      const value = (values[f.key] || "").trim();
      if (value) {
        const { error: upErr } = await supabase
          .from("settings")
          .upsert({ key: f.key, value });
        if (upErr) {
          setSaving(false);
          setError(`No se pudo guardar ${f.label}: ${upErr.message}`);
          return;
        }
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="admin-main">
      <div className="admin-head">
        <h1>Pago Móvil</h1>
      </div>

      <div className="view-card" style={{ maxWidth: 480 }}>
        <div className="pay-hero">
          <p className="pay-title">💳 Datos que ve el cliente al pagar</p>
          <p className="pay-sub">
            Aquí pones a dónde debe ir el pago. El cliente los verá directo en
            el checkout junto a su total en bolívares.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {saved && <div className="auth-info">✅ ¡Guardado!</div>}

        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            <input
              id={f.key}
              className="input"
              type="text"
              placeholder={f.placeholder}
              disabled={loading}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: e.target.value }))
              }
            />
          </div>
        ))}

        <button
          className="btn btn-primary btn-block"
          disabled={saving || loading}
          onClick={save}
        >
          {saving ? "Guardando…" : "Guardar datos de pago"}
        </button>
      </div>
    </main>
  );
}