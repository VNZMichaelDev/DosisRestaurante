import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  TASA_KEY,
  ENVIO_COSTO_KEY,
  ENVIO_GRATIS_KEY,
  DEFAULT_RATE,
} from "@/lib/precios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseNum(v: string | null | undefined): number {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Falta configurar el servidor." },
      { status: 500 }
    );
  }

  const supabase = createClient(url, serviceKey);
  const { data } = await supabase.from("settings").select("key, value");
  if (!data) {
    return NextResponse.json({ ok: false, error: "Sin ajustes." }, { status: 500 });
  }

  const map: Record<string, string> = {};
  for (const row of data) map[row.key] = row.value;

  const tasa =
    parseFloat(map[TASA_KEY]) > 0 ? parseFloat(map[TASA_KEY]) : DEFAULT_RATE;
  const costoUsd = parseNum(map[ENVIO_COSTO_KEY]);
  const gratisUsd = parseNum(map[ENVIO_GRATIS_KEY]);

  return NextResponse.json({
    ok: true,
    tasa,
    costo_usd: costoUsd,
    costo_bs: Math.round(costoUsd * tasa * 100) / 100,
    gratis_bs:
      gratisUsd > 0 ? Math.round(gratisUsd * tasa * 100) / 100 : null,
  });
}