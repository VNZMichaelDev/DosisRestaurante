"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/banner", label: "Banner" },
  { href: "/admin/precios", label: "Tasa" },
  { href: "/admin/pago", label: "Pago Móvil" },
];

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="admin-topbar">
      <div className="admin-brand">
        <span className="dot">D</span>
        <span>Panel Dosis</span>
      </div>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`admin-tab ${pathname === t.href ? "active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="right">
        <Link className="link-btn" href="/">
          Ver tienda
        </Link>
        <button className="link-btn logout" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
