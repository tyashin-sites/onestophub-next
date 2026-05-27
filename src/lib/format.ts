/**
 * Prices on the Tyashin API are stored in the smallest currency unit
 * (paise for INR, cents for USD). Format consistently with the Lovable site
 * — `en-IN` locale + `Intl.NumberFormat` with the project currency.
 */
export function formatPrice(amountInSmallestUnit: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(
      amountInSmallestUnit / 100,
    );
  } catch {
    // Unknown currency — fall back to a raw display.
    return `${currency} ${(amountInSmallestUnit / 100).toFixed(2)}`;
  }
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
