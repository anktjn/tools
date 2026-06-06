export const INVOCATION_COST_UNITS = [
  { id: 'dollars', label: 'Dollars' },
  { id: 'credits', label: 'Credits' },
]

export const DEFAULT_INVOCATION_COST = {
  value: '',
  unit: 'dollars',
}

export function formatInvocationCost(config) {
  const value = String(config?.value ?? '').trim()
  if (!value || value === '0' || value === '0.00') return null
  if (config?.unit === 'credits') {
    const n = Number(value)
    return `${n} credit${n === 1 ? '' : 's'}`
  }
  return `$${value}`
}

export function normalizeInvocationCost(config) {
  const unit = config?.unit === 'credits' ? 'credits' : 'dollars'
  const raw = String(config?.value ?? '').trim()
  if (!raw) return { value: unit === 'dollars' ? '0.00' : '0', unit }
  return { value: raw, unit }
}
