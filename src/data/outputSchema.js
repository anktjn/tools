const SLACK_POST_MESSAGE_FIELDS = [
  { id: 'ok', label: 'Success status', type: 'boolean', example: 'true', defaultSelected: true },
  { id: 'channel', label: 'Channel ID', type: 'string', example: 'C024BE91L', defaultSelected: true },
  { id: 'ts', label: 'Message timestamp', type: 'string', example: '1403051575.000407', defaultSelected: true },
  { id: 'message.text', label: 'Message text', type: 'string', example: 'Updated message text', defaultSelected: true },
  { id: 'message.user', label: 'User ID', type: 'string', example: 'U024BE7LH', defaultSelected: false },
  { id: 'message.type', label: 'Message type', type: 'string', example: 'message', defaultSelected: false },
  { id: 'message.subtype', label: 'Message subtype', type: 'string', example: 'bot_message', defaultSelected: false },
  { id: 'message.reply_count', label: 'Reply count', type: 'number', example: '3', defaultSelected: false },
  { id: 'message.edited.user', label: 'Edited by user', type: 'string', example: 'U024BE7LH', defaultSelected: false },
  { id: 'message.edited.ts', label: 'Edit timestamp', type: 'string', example: '1403051575.000407', defaultSelected: false },
  { id: 'response_metadata.next_cursor', label: 'Pagination cursor', type: 'string', example: 'dXNlcjpVMDYxTkZUVDI=', defaultSelected: false },
]

const SLACK_GET_USER_FIELDS = [
  { id: 'ok', label: 'Success status', type: 'boolean', example: 'true', defaultSelected: true },
  { id: 'user.id', label: 'User ID', type: 'string', example: 'U024BE7LH', defaultSelected: true },
  { id: 'user.name', label: 'Username', type: 'string', example: 'ankit', defaultSelected: true },
  { id: 'user.real_name', label: 'Display name', type: 'string', example: 'Ankit Jain', defaultSelected: true },
  { id: 'user.profile.email', label: 'Email', type: 'string', example: 'ankit@company.com', defaultSelected: true },
  { id: 'user.profile.title', label: 'Job title', type: 'string', example: 'Product Manager', defaultSelected: false },
  { id: 'user.profile.phone', label: 'Phone', type: 'string', example: '+1 555-0100', defaultSelected: false },
  { id: 'user.is_admin', label: 'Is admin', type: 'boolean', example: 'false', defaultSelected: false },
  { id: 'user.is_bot', label: 'Is bot', type: 'boolean', example: 'false', defaultSelected: false },
  { id: 'user.updated', label: 'Last updated', type: 'number', example: '1403051575', defaultSelected: false },
]

const SLACK_LIST_FIELDS = [
  { id: 'ok', label: 'Success status', type: 'boolean', example: 'true', defaultSelected: true },
  { id: 'channels', label: 'Channel list', type: 'array', example: '[{ id, name, … }]', defaultSelected: true },
  { id: 'messages', label: 'Message list', type: 'array', example: '[{ text, user, ts, … }]', defaultSelected: true },
  { id: 'members', label: 'Member list', type: 'array', example: '["U024BE7LH", …]', defaultSelected: true },
  { id: 'users', label: 'User list', type: 'array', example: '[{ id, name, … }]', defaultSelected: true },
  { id: 'has_more', label: 'Has more results', type: 'boolean', example: 'false', defaultSelected: false },
  { id: 'response_metadata.next_cursor', label: 'Pagination cursor', type: 'string', example: 'dXNlcjpVMDYxTkZUVDI=', defaultSelected: false },
]

const GENERIC_FIELDS = [
  { id: 'ok', label: 'Success status', type: 'boolean', example: 'true', defaultSelected: true },
  { id: 'data', label: 'Response payload', type: 'object', example: '{ … }', defaultSelected: true },
  { id: 'error', label: 'Error message', type: 'string', example: 'null', defaultSelected: false },
  { id: 'metadata', label: 'Response metadata', type: 'object', example: '{ request_id, … }', defaultSelected: false },
]

const OUTPUT_SCHEMAS = {
  slack: {
    'post-message': SLACK_POST_MESSAGE_FIELDS,
    'post-message-blockkit': SLACK_POST_MESSAGE_FIELDS,
    'edit-message': SLACK_POST_MESSAGE_FIELDS,
    'delete-message': SLACK_POST_MESSAGE_FIELDS,
    'get-user-info': SLACK_GET_USER_FIELDS,
    'get-user-by-id': SLACK_GET_USER_FIELDS,
    'get-user-by-email': SLACK_GET_USER_FIELDS,
    'get-user-by-name': SLACK_GET_USER_FIELDS,
    'list-conversations': SLACK_LIST_FIELDS,
    'list-conversation-history': SLACK_LIST_FIELDS,
    'list-users': SLACK_LIST_FIELDS,
    'list-user-conversations': SLACK_LIST_FIELDS,
    'list-user-group-members': SLACK_LIST_FIELDS,
  },
}

export function getOutputFieldsForAction(appId, actionId) {
  const appSchemas = OUTPUT_SCHEMAS[appId]
  if (appSchemas?.[actionId]) return appSchemas[actionId]
  return GENERIC_FIELDS
}

export function getDefaultSelectedOutputFields(fields) {
  return fields.filter(f => f.defaultSelected !== false).map(f => f.id)
}

export function buildOutputFieldTree(fields) {
  const root = { key: '', children: new Map(), field: null }
  for (const field of fields) {
    const parts = field.id.split('.')
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!node.children.has(part)) {
        node.children.set(part, { key: part, children: new Map(), field: null })
      }
      node = node.children.get(part)
      if (i === parts.length - 1) node.field = field
    }
  }
  return root
}

export function formatOutputTreeKey(key) {
  if (!key) return ''
  if (/^\d+$/.test(key)) return key
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function getOutputFieldExample(field) {
  if (field.example != null) return String(field.example)
  switch (field.type) {
    case 'boolean': return 'true'
    case 'number': return '0'
    case 'array': return '[]'
    case 'object': return '{}'
    default: return '—'
  }
}

export function formatOutputFilterSummary(mode, fields, selectedIds) {
  if (mode === 'all') return 'Full tool response is received'
  const count = selectedIds.length
  const total = fields.length
  return `${count} of ${total} detail${total === 1 ? '' : 's'} included`
}
