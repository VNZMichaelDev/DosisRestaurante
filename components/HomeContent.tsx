"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryRow from "@/components/CategoryRow";
import ProductCard from "@/components/ProductCard";
import Promo from "@/components/Promo";
import Reveal from "@/components/Reveal";
import type { MenuItem } from "@/types";
import type { HeroSettings } from "@/lib/products";

export default function HomeContent({
  products,
  settings,
}: {
  products: MenuItem[];
  settings: HeroSettings;
}) {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const inCategory = category === "all" || p.category === category;
      const inSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q);
      return inCategory && inSearch;
    });
  }, [category, search, products]);

  const featured = products.find((p) => p.tag === "best") ?? products[0] ?? null;

  const scrollToMenu = () => {
    document
      .getElementById("menu")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppShell>
      <Header />

      <div className="search-row">
        <label className="search-box">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Busca tu antojo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button className="filter-btn" aria-label="Ir al menú" onClick={scrollToMenu}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
        </button>
      </div>

      <Reveal>
        <Hero settings={settings} featured={featured} />
      </Reveal>

      <Reveal>
        <CategoryRow active={category} onChange={setCategory} />
      </Reveal>

      <Reveal>
        <div className="section-head" id="menu">
          <h3>{category === "all" ? "Los más pedidos" : "Menú"}</h3>
          <button className="view-all">
            Ver todo
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
          </button>
        </div>
      </Reveal>

      <div className="combo-scroll">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {visible.length === 0 && (
          <div className="empty-state" style={{ width: "100%" }}>
            <span className="emoji">🔍</span>
            <h3>Sin resultados</h3>
            <p>No encontramos nada con esa búsqueda.</p>
          </div>
        )}
      </div>

      <Reveal>
        <Promo />
      </Reveal>
    </AppShell>
  );
}
