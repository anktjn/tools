import {
  IconBuilding,
  IconKey,
  IconLink,
  IconLock,
  IconPlugConnected,
  IconShieldLock,
  IconUser,
} from '@tabler/icons-react'

export const AUTH_TYPE_CONFIG = {
  oauth: {
    label: 'OAuth',
    bg: '#f0f5ff',
    color: '#3b7dd8',
    icon: IconLink,
  },
  oauth_client_credentials: {
    label: 'OAuth with client credentials',
    bg: '#f0f5ff',
    color: '#3b7dd8',
    icon: IconLink,
  },
  auth_token: {
    label: 'Auth token',
    bg: '#fef6e8',
    color: '#b07a1a',
    icon: IconKey,
  },
  scim_token: {
    label: 'SCIM token',
    bg: '#edf7f2',
    color: '#1a7a52',
    icon: IconShieldLock,
  },
  jwt_token: {
    label: 'JWT token',
    bg: '#f3f0fe',
    color: '#6b5fd4',
    icon: IconLock,
  },
}

export function getAuthTypeConfig(authType) {
  return AUTH_TYPE_CONFIG[authType] || AUTH_TYPE_CONFIG.oauth
}

export function ConnectionDisconnectedBadge({ size = 34 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: '#fdf0f0', color: '#c03a3a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconPlugConnected size={16} stroke={1.75} aria-hidden />
    </span>
  )
}

export function ConnectionAuthBadge({ authType, size = 34 }) {
  const config = getAuthTypeConfig(authType)
  const Icon = config.icon

  return (
    <span style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: config.bg, color: config.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={16} stroke={1.75} aria-hidden />
    </span>
  )
}

export function AuthTypeChip({ authType }) {
  const config = getAuthTypeConfig(authType)
  return (
    <span style={{
      fontSize: 12, color: '#9a917f', lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  )
}

export function ConnectionCreatorMeta({ creator }) {
  const isSystem = creator?.type === 'system'
  const Icon = isSystem ? IconBuilding : IconUser
  const label = isSystem ? 'System' : creator?.name

  if (!label) return null

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <Icon size={12} stroke={1.75} color="#b4b2a9" aria-hidden style={{ flexShrink: 0 }} />
      <span style={{
        fontSize: 12, color: '#9a917f', lineHeight: 1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
    </span>
  )
}
