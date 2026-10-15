/**
 * Currency formatting utility. Never assumes a currency - every caller
 * must pass the currency code that actually came from the backend
 * (Account.currency). If it's not available yet (e.g. still loading,
 * or the account isn't one we have detail for), amounts are shown as a
 * plain number with no invented symbol, per the "don't fake data" rule.
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
}

export function getCurrencySymbol(currencyCode?: string | null): string {
  if (!currencyCode) return ''
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] ?? `${currencyCode.toUpperCase()} `
}

export function formatCurrency(amount: number, currencyCode?: string | null): string {
  const formattedAmount = amount.toFixed(2)

  if (!currencyCode) {
    // No currency info available for this amount - show the raw number
    // rather than guessing a symbol.
    return formattedAmount
  }

  const symbol = getCurrencySymbol(currencyCode)
  return `${symbol}${formattedAmount}`
}

/** Build a quick accountId -> currency lookup from a list of accounts. */
export function buildCurrencyMap(accounts: { _id: string; currency: string }[]): Map<string, string> {
  return new Map(accounts.map((a) => [a._id, a.currency]))
}
