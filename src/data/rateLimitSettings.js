export const RATE_LIMIT_SCOPES = [
  { id: 'agent', label: 'Agent', desc: 'Total limit across all users' },
  { id: 'user', label: 'User', desc: 'Individual limit per user' },
]

export const RATE_LIMIT_UNITS = [
  { id: 'minutes', label: 'Minutes' },
  { id: 'hours', label: 'Hours' },
  { id: 'days', label: 'Days' },
]

export const DEFAULT_RATE_LIMIT_CONFIG = {
  scope: 'agent',
  parameter: '2',
  maxCalls: 100,
  periodValue: 1,
  periodUnit: 'hours',
}

export function formatRateLimitPeriod(value, unitId) {
  const label = RATE_LIMIT_UNITS.find(u => u.id === unitId)?.label?.toLowerCase() || unitId
  if (value === 1) {
    const singular = label.endsWith('s') ? label.slice(0, -1) : label
    return `1 ${singular}`
  }
  return `${value} ${label}`
}

export function formatRateLimitSummary(config) {
  const scope = RATE_LIMIT_SCOPES.find(s => s.id === config.scope)?.label || config.scope
  const unitLabel = RATE_LIMIT_UNITS.find(u => u.id === config.periodUnit)?.label?.toLowerCase() || config.periodUnit
  const period = config.periodValue === 1 ? unitLabel.replace(/s$/, '') : `${config.periodValue} ${unitLabel}`
  return `${config.maxCalls} per ${period} · ${scope}`
}

export function formatRateLimitSummaryTitle(config) {
  const unit = RATE_LIMIT_UNITS.find(u => u.id === config.periodUnit)?.label || config.periodUnit
  const period = config.periodValue === 1 ? unit.replace(/s$/i, '') : `${config.periodValue} ${unit}`
  return `${config.maxCalls} Per ${period} Rate Limit`
}

export function formatRateLimitSummarySubtitle(config) {
  if (config.parameter?.trim()) {
    return `Rate increment by ${config.parameter.trim()}`
  }
  return RATE_LIMIT_SCOPES.find(s => s.id === config.scope)?.desc || ''
}
