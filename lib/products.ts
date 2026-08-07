import type { CategoryId, MenuItem, TagKind } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { products as fallbackProducts } from "@/lib/menu";
import { TASA_KEY, DEFAULT_RATE, usdToBs } from "@/lib/precios";

export async function getTasa(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", TASA_KEY)
      .maybeSingle();
    const n = parseFloat(data?.value ?? "");
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_RATE;
  } catch {
    return DEFAULT_RATE;
  }
}

export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  icon: string;
  tag: string | null;
  tag_label: string | null;
  rating: number;
  reviews: string | null;
  active: boolean;
  sort: number;
}

const CATEGORIES: CategoryId[] = [
  "cachapas",
  "burgers",
  "perros",
  "parrilla",
  "bebidas",
];

const ICONS: MenuItem["icon"][] = [
  "cachapa",
  "burger",
  "hotdog",
  "papas",
  "parrilla",
  "bebida",
];

const TAGS: TagKind[] = ["best", "popular", "save", "new"];

export function rowToMenuItem(row: ProductRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    desc: row.description ?? "",
    price: Number(row.price),
    rating: Number(row.rating ?? 4.5),
    reviews: row.reviews ?? "0",
    icon: (ICONS.includes(row.icon as MenuItem["icon"])
      ? row.icon
      : "cachapa") as MenuItem["icon"],
    category: (CATEGORIES.includes(row.category as CategoryId)
      ? row.category
      : "cachapas") as CategoryId,
    tag: (TAGS.includes(row.tag as TagKind) ? row.tag : undefined) as
      | TagKind
      | undefined,
    tagLabel: row.tag_label ?? undefined,
    image_url: row.image_url ?? undefined,
  };
}

// Menú desde la base de datos. Si hay un error o no hay configuración,
// usa el menú local (lib/menu.ts) para que la tienda nunca se rompa.
// Si la base existe pero no tiene productos, devuelve vacío: así el dueño
// añade sus productos uno a uno desde el panel.
// Los precios se guardan en USD en el panel y aquí se convierten a
// bolívares según la tasa configurada, que es lo que ve el cliente.
export async function getProducts(): Promise<MenuItem[]> {
  try {
    const supabase = await createClient();
    const tasa = await getTasa();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort", { ascending: true });

    if (error) {
      return fallbackProducts.map((p) => ({
        ...p,
        price: usdToBs(p.price, tasa),
      }));
    }
    if (!data || data.length === 0) {
      return [];
    }
    return (data as ProductRow[]).map((row) => {
      const item = rowToMenuItem(row);
      return { ...item, price: usdToBs(item.price, tasa) };
    });
  } catch {
    return fallbackProducts.map((p) => ({
      ...p,
      price: usdToBs(p.price, DEFAULT_RATE),
    }));
  }
}

export interface HeroSettings {
  image_url?: string | null;
  eyebrow?: string | null;
  title?: string | null;
  accent?: string | null;
  text?: string | null;
}

// Ajustes del banner. Devuelve solo los que el dueño haya guardado.
export async function getSettings(): Promise<HeroSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error || !data) return {};

    const map: Record<string, string> = {};
    for (const row of data) map[row.key] = row.value;

    return {
      image_url: map.hero_image_url || null,
      eyebrow: map.hero_eyebrow || null,
      title: map.hero_title || null,
      accent: map.hero_accent || null,
      text: map.hero_text || null,
    };
  } catch {
    return {};
  }
}
