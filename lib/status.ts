import type { OrderStatus } from "@/types";

export const ORDER_STATUSES: {
  value: OrderStatus;
  label: string;
  short: string;
}[] = [
  { value: "pendiente", label: "Pendiente por verificar", short: "Pendiente" },
  { value: "en_preparacion", label: "En preparación", short: "Preparando" },
  { value: "en_camino", label: "En camino", short: "En camino" },
  { value: "entregado", label: "Entregado", short: "Entregado" },
  { value: "cancelado", label: "Cancelado", short: "Cancelado" },
];

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusShort(status: OrderStatus): string {
  return ORDER_STATUSES.find((s) => s.value === status)?.short ?? status;
}
