"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const KEYS = [
  "hero_image_url",
  "hero_eyebrow",
  "hero_title",
  "hero_accent",
  "hero_text",
];

export default function BannerManager() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      setLoading(false);
      setError("Falta configurar Supabase.");
      return;
    }
    const { data, error: fetchError } = await supabase
      .from("settings")
      .select("key, value");
    setLoading(false);
    if (fetchError) {
      setError(`Error cargando ajustes: ${fetchError.message}`);
      return;
    }
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value ?? "";
    setValues(map);
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
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

    // Guardamos solo los campos con contenido; los vacíos se eliminan
    // para que el hero vuelva a su diseño por defecto.
    for (const key of KEYS) {
      const value = values[key]?.trim() ?? "";
      if (value) {
        const { error: upErr } = await supabase
          .from("settings")
          .upsert({ key, value });
        if (upErr) {
          setSaving(false);
          setError(`No se pudo guardar ${key}: ${upErr.message}`);
          return;
        }
      } else {
        const { error: delErr } = await supabase
          .from("settings")
          .delete()
          .eq("key", key);
        if (delErr) {
          setSaving(false);
          setError(`No se pudo limpiar ${key}: ${delErr.message}`);
          return;
        }
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const hasCustom =
    !!values.hero_image_url?.trim() ||
    !!values.hero_eyebrow?.trim() ||
    !!values.hero_title?.trim() ||
    !!values.hero_accent?.trim() ||
    !!values.hero_text?.trim();

  return (
    <main className="admin-main">
      <div className="admin-head">
        <h1>Banner principal</h1>
      </div>

      <div className="am-form card-form">
        {error && <div className="auth-error">{error}</div>}
        {saved && (
          <div className="auth-info">Banner guardado. ¡Mira la tienda!</div>
        )}

        {loading ? (
          <div className="loading-screen">
            <div className="spinner" /> Cargando…
          </div>
        ) : (
          <>
            <div className="am-grid">
              <label className="am-field am-field-full">
                <span>Foto de fondo (URL)</span>
                <input
                  className="input"
                  placeholder="https://tuservidor.com/banner.jpg"
                  value={values.hero_image_url ?? ""}
                  onChange={set("hero_image_url")}
                />
                {values.hero_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="am-preview am-preview-wide" src={values.hero_image_url} alt="" />
                )}
              </label>
              <label className="am-field">
                <span>Texto superior (eyebrow)</span>
                <input
                  className="input"
                  placeholder="Ej: Recién hecho"
                  value={values.hero_eyebrow ?? ""}
                  onChange={set("hero_eyebrow")}
                />
              </label>
              <label className="am-field">
                <span>Texto que destaca (accent)</span>
                <input
                  className="input"
                  placeholder="Ej: A TU DOSIS."
                  value={values.hero_accent ?? ""}
                  onChange={set("hero_accent")}
                />
              </label>
              <label className="am-field am-field-full">
                <span>Título principal (puedes usar &lt;br/&gt; para saltar línea)</span>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Ej: DORADA.<br/>RELLENA."
                  value={values.hero_title ?? ""}
                  onChange={set("hero_title")}
                />
              </label>
              <label className="am-field am-field-full">
                <span>Descripción</span>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Ej: Cachapas, burgers y parrilla hechas al momento."
                  value={values.hero_text ?? ""}
                  onChange={set("hero_text")}
                />
              </label>
            </div>

            <div className="am-actions">
              <button className="btn btn-primary" disabled={saving} onClick={save}>
                {saving ? "Guardando…" : "Guardar banner"}
              </button>
            </div>

            <p className="am-hint">
              {hasCustom
                ? "Tu banner personalizado está activo en la tienda."
                : "Banner con diseño por defecto (ilustración + carrusel). Configura un campo para personalizarlo."}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
