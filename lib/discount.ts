// Shared between client (checkout/popup/newsletter) and server (orders API)
export const DISCOUNT_STORAGE_KEY = "avh_discount_code";
export const OFFER_DONE_KEY = "avh_offer_done";
export const WELCOME_CODE = "WELCOME10";
export const WELCOME_RATE = 0.1;

export function discountFor(code: string | undefined | null, subtotal: number): number {
  if (!code || code.trim().toUpperCase() !== WELCOME_CODE) return 0;
  return Math.round(subtotal * WELCOME_RATE * 100) / 100;
}
