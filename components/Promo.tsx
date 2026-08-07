"use client";

import { useCart } from "@/store/cart";
import { useToast } from "@/store/toast";

export default function Promo() {
  const { addItem } = useCart();
  const { show } = useToast();

  const handleClaim = () => {
    addItem({
      id: "burger-combo",
      name: "Combo Burger 20% OFF",
      desc: "",
      price: 8.9,
      rating: 0,
      reviews: "",
      icon: "burger",
      category: "burgers",
    });
    show("Combo Burger añadido al carrito");
  };

  return (
    <div className="promo-wrap">
      <div className="promo">
        <div className="promo-text">
          <div className="promo-eyebrow">Oferta exclusiva</div>
          <h3>Hasta 20% OFF</h3>
          <p>En combos seleccionados</p>
          <button className="promo-cta" onClick={handleClaim}>
            Pedir ahora
            <svg
              width="12"
              height="12"
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
        <div className="promo-badge">
          <b>20%</b>
          <span>OFF</span>
        </div>
      </div>
    </div>
  );
}
