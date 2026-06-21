// Currency-aware money formatting.
//
// The audit is now multi-country, so we must never hardcode "$" or en-US grouping.
// India in particular groups by lakh/crore (1,50,000), which only the en-IN locale
// renders correctly. Every money string in the UI/report should go through here.

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
}

const FALLBACK = CURRENCIES.USD

// Accepts a currency object, an ISO code string, or null → always returns a usable
// { code, symbol, locale } shape so callers never have to null-check.
export function resolveCurrency(currency) {
  if (!currency) return FALLBACK
  if (typeof currency === 'string') {
    return CURRENCIES[currency.toUpperCase()] || { code: currency, symbol: '', locale: 'en-US' }
  }
  return currency
}

export function formatMoney(amount, currency, { decimals = 0 } = {}) {
  const cur = resolveCurrency(currency)
  const n = Number(amount) || 0
  return `${cur.symbol}${n.toLocaleString(cur.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}
