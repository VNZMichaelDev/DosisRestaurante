import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Verifica que hay sesión y que el usuario es administrador.
// Si no, redirige. Devuelve el cliente server ya listo.
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/");
  }

  return supabase;
}
