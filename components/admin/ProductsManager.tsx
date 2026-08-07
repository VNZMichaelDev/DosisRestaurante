"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProductRow } from "@/lib/products";

const CATEGORIES = [
  { id: "cachapas", label: "Cachapas" },
  { id: "burgers", label: "Burgers" },
  { id: "perros", label: "Perros" },
  { id: "parrilla", label: "Parrilla" },
  { id: "bebidas", label: "Bebidas" },
];

const ICONS = [
  { id: "cachapa", label: "Cachapa" },
  { id: "burger", label: "Burger" },
  { id: "hotdog", label: "Perro" },
  { id: "parrilla", label: "Parrilla" },
  { id: "bebida", label: "Bebida" },
];

const TAGS = [
  { id: "", label: "Sin etiqueta" },
  { id: "best", label: "Estrella (best)" },
  { id: "popular", label: "Popular" },
  { id: "save", label: "Ahorro (save)" },
  { id: "new", label: "Nuevo (new)" },
];

const EMPTY = {
  name: "",
  desc: "",
  price: "",
  category: "cachapas",
  icon: "cachapa",
  image_url: "",
  tag: "",
  tag_label: "",
  rating: "4.5",
  reviews: "0",
  active: true,
  sort: "0",
};

type FormState = typeof EMPTY & { id: string | null };

export default function ProductsManager() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      .from("products")
      .select("*")
      .order("sort", { ascending: true });
    setLoading(false);
    if (fetchError) {
      setError(`Error cargando productos: ${fetchError.message}`);
      return;
    }
    setProducts((data as ProductRow[]) ?? []);
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    const price = parseFloat(editing.price);
    if (isNaN(price) || price < 0) {
      setError("El precio debe ser un número válido.");
      return;
    }

    setSaving(true);
    setError(null);
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      setSaving(false);
      setError("Falta configurar Supabase.");
      return;
    }

    const payload = {
      name: editing.name.trim(),
      description: editing.desc.trim() || null,
      price,
      category: editing.category,
      icon: editing.icon,
      image_url: editing.image_url.trim() || null,
      tag: editing.tag || null,
      tag_label: editing.tag_label.trim() || null,
      rating: parseFloat(editing.rating) || 4.5,
      reviews: editing.reviews.trim() || "0",
      active: editing.active,
      sort: parseInt(editing.sort, 10) || 0,
    };

    const { error: saveError } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (saveError) {
      setError(`No se pudo guardar: ${saveError.message}`);
      return;
    }

    setEditing(null);
    setLoading(true);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este producto del menú?")) return;
    setDeletingId(id);
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      setDeletingId(null);
      return;
    }
    const { error: delError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    setDeletingId(null);
    if (delError) {
      alert(`No se pudo eliminar: ${delError.message}`);
      return;
    }
    await load();
  };

  const startEdit = (p?: ProductRow) => {
    setError(null);
    setEditing(
      p
        ? {
            id: p.id,
            name: p.name,
            desc: p.description ?? "",
            price: String(p.price),
            category: p.category,
            icon: p.icon,
            image_url: p.image_url ?? "",
            tag: p.tag ?? "",
            tag_label: p.tag_label ?? "",
            rating: String(p.rating ?? 4.5),
            reviews: p.reviews ?? "0",
            active: p.active,
            sort: String(p.sort ?? 0),
          }
        : { ...EMPTY, id: null }
    );
  };

  return (
    <main className="admin-main">
      <div className="admin-head">
        <h1>Productos</h1>
        <button className="btn btn-primary" onClick={() => startEdit()}>
          + Nuevo producto
        </button>
      </div>

      {editing ? (
        <div className="am-form card-form">
          <div className="am-form-head">
            <h2>{editing.id ? "Editar producto" : "Nuevo producto"}</h2>
            <button className="link-btn" onClick={() => setEditing(null)}>
              ← Volver
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="am-grid">
            <label className="am-field">
              <span>Nombre *</span>
              <input
                className="input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>
            <label className="am-field">
              <span>Precio (USD) *</span>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={editing.price}
                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
              />
            </label>
            <label className="am-field am-field-full">
              <span>Descripción</span>
              <input
                className="input"
                value={editing.desc}
                onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
              />
            </label>
            <label className="am-field am-field-full">
              <span>Foto (URL)</span>
              <input
                className="input"
                placeholder="https://tuservidor.com/foto.jpg"
                value={editing.image_url}
                onChange={(e) =>
                  setEditing({ ...editing, image_url: e.target.value })
                }
              />
              {editing.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="am-preview" src={editing.image_url} alt="" />
              )}
            </label>
            <label className="am-field">
              <span>Categoría</span>
              <select
                className="input"
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="am-field">
              <span>Icono (respaldo)</span>
              <select
                className="input"
                value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
              >
                {ICONS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="am-field">
              <span>Etiqueta</span>
              <select
                className="input"
                value={editing.tag}
                onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
              >
                {TAGS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="am-field">
              <span>Texto de la etiqueta</span>
              <input
                className="input"
                placeholder="Ej: Estrella"
                value={editing.tag_label}
                onChange={(e) =>
                  setEditing({ ...editing, tag_label: e.target.value })
                }
              />
            </label>
            <label className="am-field">
              <span>Puntuación</span>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={editing.rating}
                onChange={(e) => setEditing({ ...editing, rating: e.target.value })}
              />
            </label>
            <label className="am-field">
              <span>Reseñas</span>
              <input
                className="input"
                value={editing.reviews}
                onChange={(e) =>
                  setEditing({ ...editing, reviews: e.target.value })
                }
              />
            </label>
            <label className="am-field">
              <span>Orden (sort)</span>
              <input
                className="input"
                type="number"
                value={editing.sort}
                onChange={(e) => setEditing({ ...editing, sort: e.target.value })}
              />
            </label>
            <label className="am-field am-check">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.checked })
                }
              />
              <span>Visible en el menú</span>
            </label>
          </div>

          <div className="am-actions">
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={save}
            >
              {saving ? "Guardando…" : editing.id ? "Guardar cambios" : "Crear producto"}
            </button>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="loading-screen">
              <div className="spinner" /> Cargando productos…
            </div>
          ) : error ? (
            <div className="admin-orders-empty">
              <span className="emoji">⚠️</span>
              <b>{error}</b>
            </div>
          ) : (
            <div className="am-list">
              {products.map((p) => (
                <div className="am-item" key={p.id}>
                  <div className="am-thumb">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" />
                    ) : (
                      <span className="am-emoji">{ICONS.find((i) => i.id === p.icon)?.label ?? "🍽️"}</span>
                    )}
                  </div>
                  <div className="am-info">
                    <b>
                      {p.name}
                      {!p.active && <em className="am-hidden"> (oculto)</em>}
                    </b>
                    <span>
                      {p.category} · Bs {p.price}
                    </span>
                  </div>
                  <div className="am-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-ghost btn-sm am-danger"
                      disabled={deletingId === p.id}
                      onClick={() => remove(p.id)}
                    >
                      {deletingId === p.id ? "…" : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="admin-orders-empty">
                  <span className="emoji">📭</span>
                  <b>No hay productos.</b>
                  <p>Crea tu primer producto para que aparezca en el menú.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
