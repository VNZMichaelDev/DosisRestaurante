"use client";

import { useEffect, useState } from "react";

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("dosis_welcomed")) return;
    const timer = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    try {
      localStorage.setItem("dosis_welcomed", "1");
    } catch {
      // Sin acceso a localStorage
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="welcome-overlay" onClick={close}>
      <div
        className="welcome-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="welcome-logo">
          <img
            src="/banner logo principal.png"
            alt="Dosis — Cachapas, Burgers & Parrilla"
          />
        </div>
        <h2>¡Bienvenido a Dosis!</h2>
        <p>
          Pide tus cachapas, burgers y parrilla favoritas en segundos, paga con
          pago móvil y recíbelas donde estés.
        </p>
        <button className="btn btn-primary btn-block" onClick={close}>
          ¡A comer! 🍔
        </button>
      </div>
    </div>
  );
}
