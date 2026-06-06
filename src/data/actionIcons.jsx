import {
  IconArchive,
  IconClick,
  IconDownload,
  IconEdit,
  IconFile,
  IconFileUpload,
  IconHistory,
  IconLayout,
  IconLink,
  IconList,
  IconMessageCircle,
  IconMoodSmile,
  IconPlayerPlay,
  IconPlus,
  IconSend,
  IconTag,
  IconTrash,
  IconUser,
  IconUserMinus,
  IconUserPlus,
  IconUsers,
  IconVideo,
} from '@tabler/icons-react'

export const ACTION_ICON_STYLES = {
  read: { bg: '#f0f5ff', color: '#3b7dd8' },
  write: { bg: '#edf7f2', color: '#1a7a52' },
  update: { bg: '#fef6e8', color: '#b07a1a' },
  delete: { bg: '#fdf0f0', color: '#c03a3a' },
  run: { bg: '#f3f0fe', color: '#6b5fd4' },
  download: { bg: '#f0f5ff', color: '#3b7dd8' },
  send: { bg: '#edf7f2', color: '#1a7a52' },
  manage: { bg: '#fef6e8', color: '#b07a1a' },
}

const ICON_MAP = {
  'message-circle': IconMessageCircle,
  user: IconUser,
  link: IconLink,
  list: IconList,
  users: IconUsers,
  history: IconHistory,
  download: IconDownload,
  send: IconSend,
  edit: IconEdit,
  trash: IconTrash,
  plus: IconPlus,
  archive: IconArchive,
  'user-plus': IconUserPlus,
  'user-minus': IconUserMinus,
  'mood-smile': IconMoodSmile,
  'file-upload': IconFileUpload,
  tag: IconTag,
  file: IconFile,
  layout: IconLayout,
  click: IconClick,
  video: IconVideo,
  run: IconPlayerPlay,
}

function resolveActionIcon(action) {
  const id = action?.id || ''
  const key = `${id} ${action?.name || ''}`.toLowerCase()

  if (id === 'get-conversation') return { icon: 'message-circle', style: 'read' }
  if (/get user|user info/.test(key)) return { icon: 'user', style: 'read' }
  if (/permalink|link/.test(key)) return { icon: 'link', style: 'read' }
  if (/list conversation/.test(key) && !/history|user/.test(key)) return { icon: 'list', style: 'read' }
  if (/list users|list user group|list user conversation/.test(key)) return { icon: 'users', style: 'read' }
  if (/history/.test(key)) return { icon: 'history', style: 'read' }
  if (/download/.test(key)) return { icon: 'download', style: 'download' }
  if (/get file|file details/.test(key)) return { icon: 'file', style: 'read' }
  if (/huddle|video/.test(key)) return { icon: 'video', style: 'read' }
  if (/list|find|search|query|get /.test(key) && action?.category === 'get') return { icon: 'list', style: 'read' }

  if (/post message|send email/.test(key)) return { icon: 'send', style: 'send' }
  if (/send file|file in channel/.test(key)) return { icon: 'file-upload', style: 'send' }
  if (id === 'edit-message' || /edit message/.test(key)) return { icon: 'edit', style: 'update' }
  if (/delete message|delete record/.test(key) || (id === 'delete' && action?.category === 'do')) return { icon: 'trash', style: 'delete' }
  if (/kick/.test(key)) return { icon: 'user-minus', style: 'delete' }
  if (/create conversation|create record|create page|create issue|create event|create ticket|create user/.test(key)) return { icon: 'plus', style: 'write' }
  if (/archive/.test(key) && !/unarchive/.test(key)) return { icon: 'archive', style: 'manage' }
  if (/invite/.test(key)) return { icon: 'user-plus', style: 'write' }
  if (/reaction/.test(key) && !/remove/.test(key)) return { icon: 'mood-smile', style: 'write' }
  if (/topic|purpose|label/.test(key)) return { icon: 'tag', style: 'manage' }
  if (/open view|view/.test(key)) return { icon: 'layout', style: 'run' }
  if (/button|respond/.test(key)) return { icon: 'click', style: 'run' }
  if (/unarchive/.test(key)) return { icon: 'archive', style: 'write' }
  if (/remove reaction|update|comment|draft/.test(key)) return { icon: 'edit', style: 'update' }
  if (/open mpim|conversation/.test(key)) return { icon: 'message-circle', style: 'write' }

  if (action?.category === 'get') return { icon: 'list', style: 'read' }
  if (/send/.test(key)) return { icon: 'send', style: 'send' }
  if (/create|add/.test(key)) return { icon: 'plus', style: 'write' }

  return { icon: 'run', style: 'run' }
}

export function getActionIconMeta(action) {
  return resolveActionIcon(action)
}

export function ActionIconBadge({ action, size = 34 }) {
  const { icon, style: styleKey } = resolveActionIcon(action)
  const style = ACTION_ICON_STYLES[styleKey] || ACTION_ICON_STYLES.read
  const Icon = ICON_MAP[icon] || IconPlayerPlay

  return (
    <span style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: style.bg, color: style.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={16} stroke={1.75} aria-hidden />
    </span>
  )
}
