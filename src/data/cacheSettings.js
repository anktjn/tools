export const TTL_UNITS = [
  { id: 'seconds', label: 'Seconds' },
  { id: 'minutes', label: 'Minutes' },
  { id: 'hours', label: 'Hours' },
]

export const CONDITION_OPERATORS = [
  { id: 'equals', label: 'Equals to' },
  { id: 'not_equals', label: 'Not equals to' },
  { id: 'contains', label: 'Contains' },
]

export const CACHE_WHEN_MODES = [
  { id: 'always', label: 'Always', desc: 'Cache whenever this tool runs.' },
  { id: 'conditional', label: 'Add conditions', desc: 'Only cache when specific rules are met.' },
]

export const DEFAULT_CACHE_CONFIG = {
  ttlValue: 60,
  ttlUnit: 'seconds',
  keyFields: [],
  cacheOnErrorsOnly: false,
  cacheWhen: 'always',
  conditions: [],
}

export function getCacheWhenMode(config) {
  return config.cacheWhen ?? (config.conditions?.length > 0 ? 'conditional' : 'always')
}

export function formatCachePeriod(value, unitId) {
  const label = TTL_UNITS.find(u => u.id === unitId)?.label?.toLowerCase() || unitId
  if (value === 1) {
    const singular = label.endsWith('s') ? label.slice(0, -1) : label
    return `1 ${singular}`
  }
  return `${value} ${label}`
}

export function formatCacheSummary(config) {
  const unitLabel = TTL_UNITS.find(u => u.id === config.ttlUnit)?.label?.toLowerCase() || config.ttlUnit
  const condCount = config.conditions?.filter(c => c.field?.trim() || c.value?.trim()).length || 0
  const cond = getCacheWhenMode(config) === 'always'
    ? 'Always'
    : condCount
      ? `${condCount} condition${condCount === 1 ? '' : 's'}`
      : 'Conditions'
  return `${config.ttlValue} ${unitLabel} · ${cond}`
}

export function formatCacheSummaryTitle(config) {
  const period = formatCachePeriod(config.ttlValue, config.ttlUnit)
  return `${period.charAt(0).toUpperCase() + period.slice(1)} cache`
}

export function formatCacheSummarySubtitle(config) {
  return formatCacheExtrasSummary(config)
}

export function formatCacheExtrasSummary(config) {
  const parts = []
  const condCount = config.conditions?.filter(c => c.field?.trim() || c.value?.trim()).length || 0
  parts.push(
    getCacheWhenMode(config) === 'always'
      ? 'Always'
      : condCount
        ? `${condCount} condition${condCount === 1 ? '' : 's'}`
        : 'Conditions',
  )
  if (config.keyFields?.length) {
    parts.push(`${config.keyFields.length} key field${config.keyFields.length === 1 ? '' : 's'}`)
  }
  if (config.cacheOnErrorsOnly) parts.push('Errors only')
  return parts.join(' · ')
}

export function newCacheCondition() {
  return { id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '' }
}
