const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const pct = new Intl.NumberFormat('en-IN', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatINR(value: number): string {
  return inr.format(value)
}

export function formatPct(value: number): string {
  return pct.format(value / 100)
}
