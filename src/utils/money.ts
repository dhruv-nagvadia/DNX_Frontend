const wholeFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const paiseFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "₹1,250" for whole rupees, "₹12.50" when there are paise. Amounts are minor units (paise). */
export function formatMoney(minor: number): string {
  const value = minor / 100;
  return Number.isInteger(value) ? wholeFmt.format(value) : paiseFmt.format(value);
}

/** 1000 → "10", 750 → "7.5". Commission rates are stored as basis points (100 = 1%). */
export function bpsToPercentText(bps: number): string {
  return String(bps / 100);
}

/** "7.5" → 750. Returns null for anything that isn't a number between 0 and `maxPercent`. */
export function percentTextToBps(text: string, maxPercent = 100): number | null {
  const n = Number(text);
  if (text.trim() === '' || !Number.isFinite(n) || n < 0 || n > maxPercent) return null;
  return Math.round(n * 100);
}

/** "12.5" → 1250 paise. Returns null for blank / negative / non-numeric input. */
export function rupeesTextToMinor(text: string): number | null {
  const n = Number(text);
  if (text.trim() === '' || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** 1250 → "12.5" for editing in an input. */
export function minorToRupeesText(minor: number): string {
  return String(minor / 100);
}
