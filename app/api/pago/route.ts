import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PM_PHONE_KEY,
  PM_BANK_KEY,
  PM_HOLDER_KEY,
  PM_CI_KEY,
} from "@/lib/precios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);
  const { data } = await supabase.from("settings").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;

  return NextResponse.json({
    ok: true,
    phone: map[PM_PHONE_KEY] || "",
    bank: map[PM_BANK_KEY] || "",
    holder: map[PM_HOLDER_KEY] || "",
    ci: map[PM_CI_KEY] || "",
  });
}