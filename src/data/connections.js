const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatConnectionDate(iso) {
  const d = new Date(iso)
  return `Created on ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
}

export function formatConnectionShortDate(iso) {
  const d = new Date(iso)
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export function formatLastUsedLabel(iso) {
  if (!iso) return null
  return `Last used ${formatConnectionShortDate(iso)}`
}

export const CONNECTED_CONNECTIONS_LIMIT = 3
export const DISCONNECTED_CONNECTIONS_LIMIT = 1

export function sortConnections(list) {
  return [...list].sort((a, b) => {
    const aDisc = a.status === 'disconnected' ? 1 : 0
    const bDisc = b.status === 'disconnected' ? 1 : 0
    if (aDisc !== bDisc) return aDisc - bDisc
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (b.useCount !== a.useCount) return b.useCount - a.useCount
    const lastDiff = new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
    if (lastDiff !== 0) return lastDiff
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

export function getConnectionHints(conn, allConnections) {
  if (conn.status === 'disconnected') return []

  const hints = []
  const connected = allConnections.filter(c => c.status !== 'disconnected')
  const maxUse = Math.max(...connected.map(c => c.useCount), 0)
  const mostRecent = connected.reduce((best, c) =>
    new Date(c.lastUsedAt) > new Date(best.lastUsedAt) ? c : best, connected[0])

  if (conn.useCount === maxUse && maxUse > 1) hints.push('Most used')
  if (mostRecent && conn.id === mostRecent.id) hints.push('Recently used')
  if (conn.toolsCount > 0) {
    hints.push(conn.toolsCount === 1 ? '1 tool' : `${conn.toolsCount} tools`)
  }

  return [...new Set(hints)].slice(0, 2)
}

export function formatConnectionHintLabel(conn, allConnections) {
  const hints = getConnectionHints(conn, allConnections)
  const label = hints[0]
  if (!label) return null
  if (label === 'Most used') return { label, variant: 'featured' }
  if (label === 'Recently used') return { label, variant: 'recent' }
  return { label, variant: 'count' }
}

export function formatToolsCount(count) {
  if (!count) return null
  return count === 1 ? '1 tool' : `${count} tools`
}

export function formatConnectionToolsTooltip(count) {
  if (!count) return null
  return count === 1
    ? 'This connection is used in 1 tool'
    : `This connection is used in ${count} tools`
}

export function getVisibleConnections(connections, { showAll, query, selectedId, limit = CONNECTED_CONNECTIONS_LIMIT }) {
  if (query.trim() || showAll || connections.length <= limit) return connections

  const top = connections.slice(0, limit)
  if (selectedId && !top.some(c => c.id === selectedId)) {
    const selected = connections.find(c => c.id === selectedId)
    if (selected) return [...top.slice(0, limit - 1), selected]
  }
  return top
}

export function getHiddenConnectionCount(connections, visible) {
  return Math.max(0, connections.length - visible.length)
}

export const CONNECTIONS = {
  slack: [
    { id: 'test_shikha', name: 'Product workspace', createdAt: '2026-06-03', lastUsedAt: '2026-06-05', useCount: 48, toolsCount: 12, featured: true, status: 'connected', authType: 'oauth', creator: { type: 'user', name: 'Ankit' } },
    { id: 'try_slack', name: 'Sales enablement', createdAt: '2026-06-02', lastUsedAt: '2026-06-04', useCount: 31, toolsCount: 8, featured: true, status: 'connected', authType: 'oauth', creator: { type: 'user', name: 'Priya' } },
    { id: 'ops_alerts', name: 'Ops alerts', createdAt: '2026-05-18', lastUsedAt: '2026-06-04', useCount: 29, toolsCount: 6, status: 'connected', authType: 'auth_token', creator: { type: 'system' } },
    { id: 'virtusa_alerts', name: 'Virtusa alerts', createdAt: '2025-03-19', lastUsedAt: '2026-05-28', useCount: 22, toolsCount: 10, status: 'connected', authType: 'auth_token', creator: { type: 'user', name: 'Rahul' } },
    { id: 'virtusa_support', name: 'Virtusa support', createdAt: '2025-03-19', lastUsedAt: '2026-05-12', useCount: 14, toolsCount: 6, status: 'connected', authType: 'oauth_client_credentials', creator: { type: 'system' } },
    { id: 'virtusa_slack', name: 'Virtusa slack', createdAt: '2025-03-19', lastUsedAt: '2026-04-20', useCount: 9, toolsCount: 4, status: 'connected', authType: 'scim_token', creator: { type: 'system' } },
    { id: 'virtusa_test', name: 'Virtusa-test', createdAt: '2025-03-19', lastUsedAt: '2026-03-08', useCount: 5, toolsCount: 2, status: 'connected', authType: 'jwt_token', creator: { type: 'user', name: 'Ankit' } },
    { id: 'vx', name: 'vX', createdAt: '2025-03-19', lastUsedAt: '2026-02-14', useCount: 3, toolsCount: 1, status: 'connected', authType: 'oauth', creator: { type: 'user', name: 'Ankit' } },
    { id: 'virtusa_marketing', name: 'Virtusa marketing', createdAt: '2025-03-19', lastUsedAt: '2026-01-10', useCount: 0, toolsCount: 2, status: 'disconnected', authType: 'oauth' },
    { id: 'virtusa_engineering', name: 'Virtusa engineering', createdAt: '2025-03-19', lastUsedAt: '2025-12-04', useCount: 0, toolsCount: 1, status: 'disconnected', authType: 'oauth' },
  ],
  gmail: [
    { id: 'gmail_work', name: 'Work inbox', createdAt: '2026-05-10', lastUsedAt: '2026-06-05', useCount: 36, toolsCount: 9, featured: true, status: 'connected', authType: 'oauth', creator: { type: 'user', name: 'Ankit' } },
    { id: 'gmail_ops', name: 'Ops notifications', createdAt: '2026-01-15', lastUsedAt: '2026-06-01', useCount: 12, toolsCount: 3, status: 'connected', authType: 'auth_token', creator: { type: 'system' } },
  ],
  zendesk: [
    { id: 'zd_prod', name: 'Production support', createdAt: '2025-11-02', lastUsedAt: '2026-06-04', useCount: 27, toolsCount: 7, featured: true, status: 'connected', authType: 'oauth', creator: { type: 'user', name: 'Priya' } },
    { id: 'zd_sandbox', name: 'Sandbox', createdAt: '2025-08-20', lastUsedAt: '2026-03-22', useCount: 4, toolsCount: 1, status: 'connected', authType: 'auth_token', creator: { type: 'system' } },
  ],
}

export function getDefaultConnection(appId) {
  return getConnectionsForApp(appId).find(c => c.status === 'connected') ?? null
}

export function getDefaultConnectionId(appId) {
  return getDefaultConnection(appId)?.id ?? null
}

export function getConnectionsForApp(appId) {
  const list = CONNECTIONS[appId]
  if (list?.length) return sortConnections(list)
  return sortConnections([{
    id: `${appId}_default`,
    name: 'Default connection',
    createdAt: '2026-01-01',
    lastUsedAt: '2026-06-01',
    useCount: 1,
    toolsCount: 0,
    featured: true,
    status: 'connected',
    authType: 'oauth',
    creator: { type: 'system' },
  }])
}
