/** Minor units → "₹1,250" (no decimals); falls back to a plain number for unknown currencies. */
export function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${Math.round(minor / 100)}`;
  }
}
