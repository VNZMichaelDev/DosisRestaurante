"use client";

import { categories } from "@/lib/menu";

export default function CategoryRow({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="cat-row" id="menu">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`cat-item ${active === cat.id ? "active" : ""}`}
          onClick={() => onChange(cat.id)}
        >
          <div className="cat-circle">
            {cat.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.image} alt={cat.label} className="cat-img" />
            ) : (
              cat.emoji
            )}
          </div>
          <div className="cat-label">{cat.label}</div>
        </button>
      ))}
    </div>
  );
}
