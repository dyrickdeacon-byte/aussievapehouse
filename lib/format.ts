const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "";
  return aud.format(value);
}

export function formatPriceRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min == null) return "";
  if (max == null || max === min) return aud.format(min);
  return `${aud.format(min)} – ${aud.format(max)}`;
}
