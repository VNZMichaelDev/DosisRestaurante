"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { useNotifications } from "@/store/notifications";
import { useMounted } from "@/lib/useMounted";

export default function Header() {
  const { count } = useCart();
  const { unreadCount } = useNotifications();
  const mounted = useMounted();

  return (
    <header className="top">
      <div className="header-icons">
        <Link
          href="/carrito"
          className="icon-btn is-link"
          aria-label="Carrito"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {mounted && count > 0 && <span className="badge">{count}</span>}
        </Link>
      </div>
      <div className="brandblock">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="DOSIS" className="logo-img" />
        <div className="tagline">
          Cachapas, burgers y parrilla al momento.
        </div>
      </div>
      <div className="header-icons">
        <Link
          href="/notificaciones"
          className="icon-btn is-link"
          aria-label="Notificaciones"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {mounted && unreadCount > 0 && (
            <span className="badge">{unreadCount}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
