export const LOOKUPS = {
  'slack.channels': [
    { id: 'C001', label: 'general' },
    { id: 'C002', label: 'product-updates' },
    { id: 'C003', label: 'support' },
    { id: 'C004', label: 'engineering' },
    { id: 'C005', label: 'sales' },
    { id: 'C006', label: 'random' },
    { id: 'C007', label: 'announcements' },
    { id: 'C008', label: 'customer-feedback' },
  ],
}

export const ACTION_INPUT_FIELDS = {
  'slack:edit-message': [
    {
      id: 'channel',
      label: 'Select channel',
      type: 'lookup',
      lookup: 'slack.channels',
      required: true,
      placeholder: 'Select channel to edit message',
      helper: 'Select from available channels. If not found, you may click on enter custom value to enter channel ID.',
    },
    {
      id: 'messageTimestamp',
      label: 'Message timestamp',
      type: 'text',
      required: true,
      placeholder: 'Paste the timestamp of the message to edit',
      helper: 'Provide the timestamp of the message to be edited.',
    },
    {
      id: 'messageText',
      label: 'Message text',
      type: 'textarea',
      required: false,
      placeholder: 'Enter the updated message text',
      helper: 'Specify the new message text.',
    },
    {
      id: 'blockInputType',
      label: 'Block input type',
      type: 'select',
      required: false,
      defaultValue: 'block-list',
      options: [
        { id: 'block-list', label: 'Block list' },
        { id: 'block-json', label: 'Block JSON' },
      ],
      placeholder: 'Choose how to add blocks',
      helper: 'Choose how to provide blocks. Block list lets you build blocks using a structured form. Block JSON lets you paste raw Block Kit JSON directly.',
    },
    {
      id: 'messageBlocks',
      label: 'Message blocks',
      type: 'blocks',
      required: false,
      helper: 'Add blocks to the message.',
      showWhen: { field: 'blockInputType', value: 'block-list' },
    },
    {
      id: 'messageBlocksJson',
      label: 'Message blocks',
      type: 'textarea',
      required: false,
      placeholder: 'Paste Block Kit JSON for the edited message',
      helper: 'Add blocks to the message.',
      showWhen: { field: 'blockInputType', value: 'block-json' },
    },
  ],
}

export function getFieldsForAction(appId, actionId) {
  if (!appId || !actionId) return []
  return ACTION_INPUT_FIELDS[`${appId}:${actionId}`] || []
}

export function getVisibleFields(fields, values) {
  return fields.filter(field => {
    if (!field.showWhen) return true
    return values[field.showWhen.field] === field.showWhen.value
  })
}

export function getDefaultInputValues(fields) {
  const values = {}
  for (const field of fields) {
    if (field.type === 'blocks') values[field.id] = []
    else if (field.defaultValue !== undefined) values[field.id] = field.defaultValue
    else values[field.id] = ''
  }
  return values
}

export function getLookupOptions(lookupId, query = '') {
  const items = LOOKUPS[lookupId] || []
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(item => item.label.toLowerCase().includes(q))
}

export function areInputsValid(fields, values) {
  const visible = getVisibleFields(fields, values)
  if (!visible.length) return true
  return visible.every(field => {
    if (!field.required) return true
    if (field.type === 'blocks') return Array.isArray(values[field.id]) && values[field.id].length > 0
    return String(values[field.id] || '').trim()
  })
}

function labelForSelect(field, value) {
  const match = (field.options || []).find(o => o.id === value)
  return match?.label || value
}

export function formatInputsSummary(fields, values) {
  const visible = getVisibleFields(fields, values)
  if (!visible.length) return ''
  return visible
    .filter(field => {
      if (field.type === 'blocks') return Array.isArray(values[field.id]) && values[field.id].length > 0
      return String(values[field.id] || '').trim()
    })
    .map(field => {
      if (field.type === 'lookup') {
        const match = (LOOKUPS[field.lookup] || []).find(item => item.id === values[field.id])
        return match ? `${field.label}: #${match.label}` : `${field.label}: ${values[field.id]}`
      }
      if (field.type === 'select') {
        return `${field.label}: ${labelForSelect(field, values[field.id])}`
      }
      if (field.type === 'blocks') {
        const count = values[field.id].length
        return `${field.label}: ${count} block${count === 1 ? '' : 's'}`
      }
      const text = String(values[field.id] || '').trim()
      const short = text.length > 28 ? `${text.slice(0, 28)}…` : text
      return `${field.label}: ${short}`
    })
    .join(', ')
}
