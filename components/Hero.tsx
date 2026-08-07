"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";
import type { MenuItem } from "@/types";
import type { HeroSettings } from "@/lib/products";

const heroCopy = [
  {
    eyebrow: "Recién hecho",
    title: "DORADA.<br/>RELLENA.",
    accent: "A TU DOSIS.",
    text: "Cachapas, burgers y parrilla hechas al momento, todos los días.",
  },
  {
    eyebrow: "Combos",
    title: "BURGERS<br/>JUGOSAS.",
    accent: "A LA PARRILLA.",
    text: "Doble carne, cheddar y tocineta en cada bocado.",
  },
  {
    eyebrow: "Acompaña",
    title: "PAPAS<br/>CRUJIENTES.",
    accent: "SABOR DOSIS.",
    text: "Ideales para compartir con tu combo favorito.",
  },
  {
    eyebrow: "No te olvides",
    title: "BEBIDAS<br/>BIEN FRÍAS.",
    accent: "PARA EL CALOR.",
    text: "Refrescos, jugos naturales y malta bien fría.",
  },
];

const FALLBACK_FEATURED: MenuItem = {
  id: "cachapa-dosis",
  name: "Cachapa Dosis",
  desc: "Cachapa rellena de queso de mano y carne mechada",
  price: 8.5,
  rating: 4.9,
  reviews: "3.2K",
  icon: "cachapa",
  category: "cachapas",
};

export default function Hero({
  settings = {},
  featured = null,
}: {
  settings?: HeroSettings;
  featured?: MenuItem | null;
}) {
  const { addItem } = useCart();
  const { show } = useToast();
  const [index, setIndex] = useState(0);

  // Banner personalizado configurado desde el panel (foto + textos).
  const custom =
    !!settings.image_url ||
    !!settings.eyebrow ||
    !!settings.title ||
    !!settings.accent ||
    !!settings.text;

  useEffect(() => {
    if (custom) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % heroCopy.length),
      3200
    );
    return () => clearInterval(timer);
  }, [custom]);

  const current = custom
    ? {
        eyebrow: settings.eyebrow || heroCopy[0].eyebrow,
        title: settings.title || heroCopy[0].title,
        accent: settings.accent || heroCopy[0].accent,
        text: settings.text || heroCopy[0].text,
      }
    : heroCopy[index];

  const handleOrderNow = () => {
    const item = featured ?? FALLBACK_FEATURED;
    addItem(item);
    show(`${item.name} añadido al carrito`);
  };

  const heroStyle =
    custom && settings.image_url
      ? {
          backgroundImage: `linear-gradient(rgba(10, 32, 21, 0.55), rgba(10, 32, 21, 0.55)), url("${settings.image_url}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : undefined;

  return (
    <div className="hero-wrap">
      <div className={`hero ${custom ? "photo" : ""}`} style={heroStyle}>
        <div className="hero-inner">
          <div className="hero-eyebrow">{current.eyebrow}</div>
          <h2
            dangerouslySetInnerHTML={{
              __html: `${current.title}<span class="accent">${current.accent}</span>`,
            }}
          />
          <p>{current.text}</p>
          <button className="hero-cta" onClick={handleOrderNow}>
            Pedir ahora
            <span className="circle">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        </div>

        <svg
          className="steam s1"
          width="14"
          height="30"
          viewBox="0 0 14 30"
        >
          <path
            d="M7 30C2 22 12 18 7 10"
            stroke="white"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="steam s2"
          width="14"
          height="30"
          viewBox="0 0 14 30"
        >
          <path
            d="M7 30C2 22 12 18 7 10"
            stroke="white"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="steam s3"
          width="14"
          height="30"
          viewBox="0 0 14 30"
        >
          <path
            d="M7 30C2 22 12 18 7 10"
            stroke="white"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Ilustración firma: cachapa doblada con queso */}
        <svg
          className="cachapa-illustration"
          viewBox="0 0 220 220"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grain"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1.2" cy="1.2" r="1" fill="rgba(120,70,10,0.22)" />
            </pattern>
            <linearGradient id="plateShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#EDE4CF" />
            </linearGradient>
          </defs>
          <ellipse cx="110" cy="185" rx="86" ry="16" fill="#0B2417" opacity="0.28" />
          <ellipse cx="110" cy="170" rx="90" ry="30" fill="url(#plateShade)" />
          <ellipse cx="110" cy="166" rx="76" ry="24" fill="#F7F2E4" />
          <path
            d="M45 150 C40 95 75 55 112 52 C150 49 178 82 176 122 C175 140 160 150 140 150 Z"
            fill="#F4B400"
          />
          <path
            d="M45 150 C40 95 75 55 112 52 C150 49 178 82 176 122"
            fill="none"
            stroke="#C98A00"
            strokeWidth="3"
            opacity="0.4"
          />
          <path
            d="M45 150 C40 95 75 55 112 52 C150 49 178 82 176 122 C175 140 160 150 140 150 Z"
            fill="url(#grain)"
          />
          <path
            d="M78 140 C86 118 100 104 118 100 C136 104 148 120 152 140 C130 152 98 152 78 140 Z"
            fill="#FFF8E4"
          />
          <path
            d="M78 140 C86 118 100 104 118 100 C136 104 148 120 152 140"
            fill="none"
            stroke="#F4B400"
            strokeWidth="3"
          />
          <path
            d="M58 128 C90 92 132 88 168 116"
            fill="none"
            stroke="#C98A00"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="130" cy="128" r="4" fill="#1D5A3A" />
          <circle cx="118" cy="120" r="3.4" fill="#1D5A3A" />
          <circle cx="140" cy="118" r="3" fill="#1D5A3A" />
        </svg>

        {!custom && (
          <div className="hero-dots">
            {heroCopy.map((_, i) => (
              <span
                key={i}
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
