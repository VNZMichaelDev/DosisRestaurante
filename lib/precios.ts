// Tasa de cambio: los precios se guardan en USD en el panel y los
// clientes los ven en bolívares según la tasa configurable esta clave.
export const TASA_KEY = "tasa_bs";
export const DEFAULT_RATE = 6;

// Recargo de entrega: se configura en USD en el panel.
export const ENVIO_COSTO_KEY = "envio_costo";
export const ENVIO_GRATIS_KEY = "envio_gratis";

// Datos del Pago Móvil que ve el cliente en el checkout.
export const PM_PHONE_KEY = "pm_phone";
export const PM_BANK_KEY = "pm_bank";
export const PM_HOLDER_KEY = "pm_holder";
export const PM_CI_KEY = "pm_ci";

export function usdToBs(usd: number, rate: number): number {
  const r = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RATE;
  return Math.round(usd * r * 100) / 100;
}