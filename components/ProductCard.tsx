"use client";

import { useState } from "react";
import type { MenuItem } from "@/types";
import ProductIcon from "@/components/ProductIcon";
import { formatBs } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";

const tagClass: Record<string, string> = {
  best: "best",
  popular: "popular",
  save: "save",
  new: "new",
};

export default function ProductCard({ product }: { product: MenuItem }) {
  const { addItem } = useCart();
  const { show } = useToast();
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);
  const [pulse, setPulse] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 700);
    show(`${product.name} añadido al carrito`);
  };

  const handleFav = () => {
    setFav((f) => !f);
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
  };

  return (
    <div className="card">
      <div className="card-media">
        {product.tag && (
          <span className={`tag ${tagClass[product.tag]}`}>
            {product.tagLabel}
          </span>
        )}
        <button
          className={`fav-btn ${fav ? "active" : ""} ${pulse ? "pulse" : ""}`}
          aria-label="Favorito"
          onClick={handleFav}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 21s-7-4.35-9.5-8.6C.5 8.5 3 4.5 7 4.5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 7.9C19 16.65 12 21 12 21Z" />
          </svg>
        </button>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="product-photo"
            src={product.image_url}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <ProductIcon icon={product.icon} />
        )}
      </div>
      <div className="card-body">
        <h4>{product.name}</h4>
        <p className="desc">{product.desc}</p>
        <div className="rating">
          <span className="star">★</span> {product.rating} ({product.reviews}+)
        </div>
        <div className="price-row">
          <span className="price">{formatBs(product.price)}</span>
          <button
            className={`add-btn ${added ? "added" : ""}`}
            aria-label="Añadir"
            onClick={handleAdd}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
