import type { MenuItem, CategoryId } from "@/types";

export default function ProductIcon({
  icon,
  size = 78,
}: {
  icon: MenuItem["icon"];
  size?: number;
}) {
  switch (icon) {
    case "cachapa":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <ellipse cx="50" cy="70" rx="34" ry="10" fill="#EDE4CF" />
          <path
            d="M22 66 C18 40 34 18 52 16 C70 14 84 32 83 54 C82 64 74 68 64 68 Z"
            fill="#F4B400"
          />
          <path
            d="M36 62 C40 48 48 38 58 36 C68 38 74 48 76 62 C64 70 46 70 36 62 Z"
            fill="#FFF8E4"
          />
          <circle cx="60" cy="52" r="2.6" fill="#1D5A3A" />
          <circle cx="52" cy="46" r="2.2" fill="#1D5A3A" />
        </svg>
      );
    case "burger":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <ellipse cx="50" cy="35" rx="28" ry="14" fill="#E3A857" />
          <rect x="24" y="46" width="52" height="8" fill="#6B8E4E" />
          <rect x="24" y="56" width="52" height="10" fill="#8C5A2B" />
          <ellipse cx="50" cy="75" rx="28" ry="10" fill="#E3A857" />
        </svg>
      );
    case "hotdog":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <rect x="14" y="40" width="72" height="24" rx="12" fill="#EED9A8" />
          <rect x="20" y="45" width="60" height="14" rx="7" fill="#B5502E" />
          <path
            d="M22 46 Q50 40 78 46"
            stroke="#F4B400"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M24 56 Q50 62 76 56"
            stroke="#C4241E"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      );
    case "papas":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <rect
            x="24"
            y="34"
            width="12"
            height="42"
            rx="6"
            fill="#F4B400"
            transform="rotate(-18 30 55)"
          />
          <rect
            x="44"
            y="28"
            width="12"
            height="48"
            rx="6"
            fill="#FFD84D"
            transform="rotate(6 50 52)"
          />
          <rect
            x="62"
            y="30"
            width="12"
            height="46"
            rx="6"
            fill="#F4B400"
            transform="rotate(-8 68 53)"
          />
          <rect
            x="14"
            y="70"
            width="72"
            height="10"
            rx="5"
            fill="#C4241E"
          />
        </svg>
      );
    case "parrilla":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <rect x="14" y="60" width="72" height="8" rx="4" fill="#4A4A4A" />
          <rect x="14" y="74" width="72" height="8" rx="4" fill="#4A4A4A" />
          <ellipse cx="35" cy="48" rx="16" ry="11" fill="#8C5A2B" />
          <ellipse cx="65" cy="52" rx="18" ry="12" fill="#B5502E" />
          <ellipse cx="50" cy="34" rx="14" ry="10" fill="#D19458" />
        </svg>
      );
    case "bebida":
      return (
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <path d="M28 22 L38 90 a4 4 0 0 0 4 3 h16 a4 4 0 0 0 4-3 L72 22 Z" fill="#C4241E" />
          <rect x="26" y="22" width="48" height="12" rx="5" fill="#8C1712" />
          <path d="M44 30 L48 70 M56 30 L52 70" stroke="#FFD84D" strokeWidth="3" fill="none" />
          <path d="M50 12 L70 6" stroke="#1D5A3A" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}

export const categoryEmoji = (id: CategoryId): string => {
  switch (id) {
    case "cachapas":
      return "🌽";
    case "burgers":
      return "🍔";
    case "perros":
      return "🌭";
    case "parrilla":
      return "🥩";
    case "bebidas":
      return "🥤";
  }
};
