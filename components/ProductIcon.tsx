// eslint-disable-next-line @next/next/no-img-element
import type { MenuItem, CategoryId } from "@/types";

const ICON_IMAGES: Record<string, string> = {
  cachapa: "/cachapa.png",
  burger: "/hamburguesa.jpeg",
  hotdog: "/perro.png",
  parrilla: "/parrilla.png",
  bebida: "/bebidas.png",
};

export default function ProductIcon({
  icon,
  size = 78,
}: {
  icon: MenuItem["icon"];
  size?: number;
}) {
  const src = ICON_IMAGES[icon];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={icon}
        width={size}
        height={size}
        style={{ objectFit: "contain" }}
      />
    );
  }

  return null;
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
