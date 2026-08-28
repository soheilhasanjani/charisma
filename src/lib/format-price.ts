const priceFormatter = new Intl.NumberFormat("fa-IR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric price for display with the `fa-IR` locale
 * (e.g. `"۱۲٫۳۴"`).
 *
 * @param value - Price to format
 */
export function formatPrice(value: number) {
  return priceFormatter.format(value);
}
