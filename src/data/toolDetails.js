import { formatInputsSummary, getVisibleFields } from './actionInputs'
import { formatCachePeriod } from './cacheSettings'
import { formatInvocationCost } from './invocationCostSettings'
import { formatRateLimitSummary } from './rateLimitSettings'

function inputHint(fields, values) {
  const visible = getVisibleFields(fields, values)
  for (const field of visible) {
    const value = values[field.id]
    if (!value || (Array.isArray(value) && !value.length)) continue
    if (field.type === 'lookup') {
      const label = String(value).replace(/^#/, '')
      return { field: field.label, value: label }
    }
    if (field.type === 'select') {
      const match = (field.options || []).find(o => o.id === value)
      return { field: field.label, value: match?.label || value }
    }
    if (field.type !== 'blocks') {
      const text = String(value).trim()
      if (text) return { field: field.label, value: text.length > 40 ? `${text.slice(0, 40)}…` : text }
    }
  }
  return null
}

export function generateToolDetails({
  app,
  action,
  connection,
  useRuntimeConnection,
  inputFields,
  inputValues,
  requireApproval,
  rateLimitEnabled,
  rateLimitConfig,
  reuseResponses,
  cacheConfig,
  governance,
  invocationCost,
}) {
  const appName = app?.name || 'the app'
  const actionName = action?.name || 'this action'
  const hint = inputHint(inputFields, inputValues)

  let name = `${appName}: ${actionName}`
  if (hint?.value) {
    const shortHint = hint.value.startsWith('#') ? hint.value : hint.value
    name = `${actionName} — ${shortHint}`
  }

  const descriptionParts = []
  if (action?.desc) descriptionParts.push(action.desc)
  else descriptionParts.push(`Performs "${actionName}" using ${appName}.`)

  descriptionParts.push(
    `Use when the agent needs to ${actionName.toLowerCase()} through ${appName}.`,
  )

  if (connection?.name) {
    descriptionParts.push(`Runs using the ${connection.name} connection.`)
  } else if (useRuntimeConnection) {
    descriptionParts.push('Uses the connection selected at runtime.')
  }

  const inputsSummary = formatInputsSummary(inputFields, inputValues)
  if (inputsSummary) descriptionParts.push(`Pre-configured inputs: ${inputsSummary}.`)

  const policies = []
  if (requireApproval) policies.push('asks for approval before each run')
  if (rateLimitEnabled && rateLimitConfig) {
    policies.push(`is rate-limited to ${formatRateLimitSummary(rateLimitConfig).toLowerCase()}`)
  }
  if (reuseResponses && cacheConfig) {
    policies.push(`caches responses for ${formatCachePeriod(cacheConfig.ttlValue, cacheConfig.ttlUnit)}`)
  }
  if (governance) policies.push('follows governance rules')
  const costLabel = formatInvocationCost(invocationCost)
  if (costLabel) policies.push(`costs ${costLabel} per invocation`)
  if (policies.length) {
    descriptionParts.push(`This tool ${policies.join(', ')}.`)
  }

  return {
    name,
    description: descriptionParts.join(' '),
  }
}

export function autofillToolDetails(context) {
  return new Promise(resolve => {
    window.setTimeout(() => resolve(generateToolDetails(context)), 900)
  })
}
