import { useEffect, useMemo, useRef, useState } from 'react'
import {
  IconAdjustmentsHorizontal, IconApi, IconBooks, IconBraces, IconCalculator, IconChartBar,
  IconDatabase, IconFilePencil, IconFilePlus, IconFileText, IconFileTypePdf, IconGauge,
  IconList, IconMoodSmile, IconPlayerPlay, IconPlugConnected,
  IconRefresh, IconRegex, IconScan, IconSearch, IconSparkles, IconTable, IconTerminal2,
  IconUserPlus, IconUsers, IconVector, IconWorldWww, IconX,
} from '@tabler/icons-react'
import { SLACK_ACTIONS, SLACK_ACTION_GROUPS } from '../data/appActions'
import {
  formatInputsSummary, getDefaultInputValues, getFieldsForAction,
  getLookupOptions, getVisibleFields,
} from '../data/actionInputs'
import {
  CACHE_WHEN_MODES, CONDITION_OPERATORS, DEFAULT_CACHE_CONFIG,
  formatCacheSummarySubtitle, formatCacheSummaryTitle,
  getCacheWhenMode, newCacheCondition, TTL_UNITS,
} from '../data/cacheSettings'
import {
  DEFAULT_INVOCATION_COST, INVOCATION_COST_UNITS, normalizeInvocationCost,
} from '../data/invocationCostSettings'
import {
  DEFAULT_RATE_LIMIT_CONFIG, formatRateLimitSummarySubtitle, formatRateLimitSummaryTitle,
  RATE_LIMIT_SCOPES, RATE_LIMIT_UNITS,
} from '../data/rateLimitSettings'
import {
  buildOutputFieldTree, formatOutputTreeKey,
  getDefaultSelectedOutputFields, getOutputFieldsForAction,
} from '../data/outputSchema'
import {
  AuthTypeChip,
} from '../data/connectionAuth'
import {
  CONNECTED_CONNECTIONS_LIMIT, DISCONNECTED_CONNECTIONS_LIMIT,
  formatConnectionShortDate, getDefaultConnectionId,
  getConnectionsForApp, getVisibleConnections,
} from '../data/connections'

const sectionLabelStyle = {
  padding: '0 2px', fontSize: 13, fontWeight: 600, color: '#5b5547', lineHeight: 1.3,
}

const tablerToolProps = { stroke: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
const TOOL_ICON_COLOR = '#8a7648'

/* ── real brand logos via Simple Icons CDN, with graceful fallbacks ── */
function ToolGlyph({ slug, name, size = 22, icon = null }) {
  const [err, setErr] = useState(false)
  if (slug === '__builtin') {
    if (typeof icon === 'function') {
      const Icon = icon
      return <Icon size={size} color={TOOL_ICON_COLOR} {...tablerToolProps} aria-hidden style={{ display: 'block' }} />
    }
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ display: 'block' }}>
        {icon || <path d="M12.5 2.5a4 4 0 00-4.7 5.2l-4.9 4.9a1.6 1.6 0 102.3 2.3l4.9-4.9A4 4 0 1012.5 2.5z" stroke="#8a7648" strokeWidth="1.5" strokeLinejoin="round" />}
      </svg>
    )
  }
  if (slug === 'salesforce') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <path d="M10 7.1a3.4 3.4 0 016.1-1.3 3 3 0 011.5-.4 3.05 3.05 0 011.6 5.6 2.7 2.7 0 01-1.3 5.1 2.7 2.7 0 01-1-.2 3.1 3.1 0 01-5.6.4 3.5 3.5 0 01-1.5.3A3.6 3.6 0 016 17a3.2 3.2 0 01.6-6.3 3.6 3.6 0 013.4-3.6z" fill="#00A1E0" />
      </svg>
    )
  }
  if (slug === 'slack') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <path d="M5.04 15.17a2.53 2.53 0 11-2.52-2.53h2.52v2.53zm1.27 0a2.53 2.53 0 015.05 0v6.31a2.53 2.53 0 01-5.05 0v-6.31z" fill="#E01E5A" />
        <path d="M8.83 5.04a2.53 2.53 0 112.53-2.52v2.52H8.83zm0 1.28a2.53 2.53 0 010 5.05H2.52a2.53 2.53 0 010-5.05h6.31z" fill="#36C5F0" />
        <path d="M18.96 8.83a2.53 2.53 0 112.52 2.53h-2.52V8.83zm-1.28 0a2.53 2.53 0 01-5.04 0V2.52a2.53 2.53 0 015.04 0v6.31z" fill="#2EB67D" />
        <path d="M15.16 18.96a2.53 2.53 0 11-2.52 2.52v-2.52h2.52zm0-1.28a2.53 2.53 0 010-5.04h6.32a2.53 2.53 0 010 5.04h-6.32z" fill="#ECB22E" />
      </svg>
    )
  }
  if (err || !slug) {
    const letter = (name || '?').charAt(0).toUpperCase()
    return <span style={{ width: size, height: size, borderRadius: 5, background: '#eee7da', color: '#7a6f5c', fontSize: size * 0.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{letter}</span>
  }
  return <img src={`https://cdn.simpleicons.org/${slug}`} width={size} height={size} alt="" onError={() => setErr(true)} style={{ display: 'block', objectFit: 'contain' }} />
}

/* ── Built-in tools (no connection / no config — added instantly) ── */
const TOOLS = [
  { id: 'web-search', name: 'Web Search', desc: 'Search the web for live information', Icon: IconSearch },
  { id: 'fetch-url', name: 'Fetch URL', desc: 'Read the contents of a web page', Icon: IconWorldWww },
  { id: 'pdf-read', name: 'PDF Reader', desc: 'Extract text and tables from PDFs', Icon: IconFileTypePdf },
  { id: 'pdf-create', name: 'PDF Creator', desc: 'Generate a polished PDF document', Icon: IconFilePlus },
  { id: 'doc-read', name: 'Document Reader', desc: 'Read Word, text, and rich docs', Icon: IconFileText },
  { id: 'sheet-read', name: 'Spreadsheet Reader', desc: 'Read Excel and CSV data', Icon: IconTable },
  { id: 'csv', name: 'CSV Parser', desc: 'Parse and transform CSV files', Icon: IconTable },
  { id: 'code', name: 'Code Interpreter', desc: 'Run Python to compute and analyze', Icon: IconTerminal2 },
  { id: 'calc', name: 'Calculator', desc: 'Evaluate math expressions', Icon: IconCalculator },
  { id: 'ocr', name: 'Image Reader (OCR)', desc: 'Extract text from images', Icon: IconScan },
  { id: 'img-gen', name: 'Image Generator', desc: 'Create images from a prompt', Icon: IconSparkles },
  { id: 'summarize', name: 'Summarizer', desc: 'Condense long text into a brief', Icon: IconList },
  { id: 'sentiment', name: 'Sentiment Analyzer', desc: 'Gauge tone and sentiment in text', Icon: IconMoodSmile },
  { id: 'json', name: 'JSON Formatter', desc: 'Parse, query, and format JSON', Icon: IconBraces },
  { id: 'regex', name: 'Regex Extractor', desc: 'Extract patterns from text', Icon: IconRegex },
  { id: 'kb-search', name: 'Knowledge Search', desc: 'Search your knowledge base (RAG)', Icon: IconBooks },
  { id: 'vector', name: 'Vector Search', desc: 'Semantic similarity search', Icon: IconVector },
  { id: 'file-write', name: 'File Writer', desc: 'Create and save output files', Icon: IconFilePencil },
  { id: 'http', name: 'HTTP Request', desc: 'Call an external REST API', Icon: IconApi },
  { id: 'chart', name: 'Chart Generator', desc: 'Render charts from data', Icon: IconChartBar },
]

const APPS = [
  { id: 'slack', name: 'Slack', slug: 'slack', desc: 'Send messages and manage channels' },
  { id: 'gmail', name: 'Gmail', slug: 'gmail', desc: 'Send, read, and search email' },
  { id: 'discord', name: 'Discord', slug: 'discord', desc: 'Post and manage messages' },
  { id: 'telegram', name: 'Telegram', slug: 'telegram', desc: 'Send and receive messages' },
  { id: 'hubspot', name: 'HubSpot', slug: 'hubspot', desc: 'Manage contacts, deals, and marketing' },
  { id: 'pipedrive', name: 'Pipedrive', slug: 'pipedrive', desc: 'Read and update CRM records' },
  { id: 'notion', name: 'Notion', slug: 'notion', desc: 'Read and write pages and databases' },
  { id: 'jira', name: 'Jira', slug: 'jira', desc: 'Manage issues and sprints' },
  { id: 'confluence', name: 'Confluence', slug: 'confluence', desc: 'Read and update wiki pages' },
  { id: 'zendesk', name: 'Zendesk', slug: 'zendesk', desc: 'Create and update support tickets' },
  { id: 'intercom', name: 'Intercom', slug: 'intercom', desc: 'Message and support customers' },
  { id: 'calendly', name: 'Calendly', slug: 'calendly', desc: 'Schedule and manage meetings' },
  { id: 'gdrive', name: 'Google Drive', slug: 'googledrive', desc: 'Find, read, and manage files' },
  { id: 'gcal', name: 'Google Calendar', slug: 'googlecalendar', desc: 'Create and read events' },
  { id: 'gdocs', name: 'Google Docs', slug: 'googledocs', desc: 'Read and edit documents' },
  { id: 'gsheets', name: 'Google Sheets', slug: 'googlesheets', desc: 'Read and write spreadsheet data' },
  { id: 'github', name: 'GitHub', slug: 'github', desc: 'Manage repos, issues, and PRs' },
  { id: 'gitlab', name: 'GitLab', slug: 'gitlab', desc: 'Manage repos and merge requests' },
  { id: 'linear', name: 'Linear', slug: 'linear', desc: 'Create and track issues' },
  { id: 'asana', name: 'Asana', slug: 'asana', desc: 'Manage tasks and projects' },
  { id: 'trello', name: 'Trello', slug: 'trello', desc: 'Manage cards and boards' },
  { id: 'clickup', name: 'ClickUp', slug: 'clickup', desc: 'Manage tasks and docs' },
  { id: 'figma', name: 'Figma', slug: 'figma', desc: 'Read files, comments, and frames' },
  { id: 'dropbox', name: 'Dropbox', slug: 'dropbox', desc: 'Find and share files' },
  { id: 'stripe', name: 'Stripe', slug: 'stripe', desc: 'Read payments and customers' },
  { id: 'zoom', name: 'Zoom', slug: 'zoom', desc: 'Schedule meetings and fetch recordings' },
  { id: 'airtable', name: 'Airtable', slug: 'airtable', desc: 'Read and write base records' },
  { id: 'shopify', name: 'Shopify', slug: 'shopify', desc: 'Manage orders and products' },
  { id: 'mailchimp', name: 'Mailchimp', slug: 'mailchimp', desc: 'Manage campaigns and audiences' },
]

const GENERIC_ACTIONS = [
  { id: 'create', name: 'Create record', desc: 'Add a new item' },
  { id: 'update', name: 'Update record', desc: 'Modify an existing item' },
  { id: 'find', name: 'Find records', desc: 'Search items by criteria' },
  { id: 'delete', name: 'Delete record', desc: 'Remove an item' },
]
const ACTIONS = {
  slack: SLACK_ACTIONS,
  gmail: [
    { id: 'send', name: 'Send email', desc: 'Compose and send a new email' },
    { id: 'draft', name: 'Create draft', desc: 'Save a draft without sending' },
    { id: 'search', name: 'Search emails', desc: 'Find emails matching a query' },
    { id: 'label', name: 'Add label', desc: 'Apply a label to a thread' },
  ],
  zendesk: [
    { id: 'create', name: 'Create ticket', desc: 'Open a new support ticket' },
    { id: 'update', name: 'Update ticket', desc: 'Change status or fields' },
    { id: 'comment', name: 'Add comment', desc: 'Reply on an existing ticket' },
    { id: 'search', name: 'Search tickets', desc: 'Find tickets by query' },
  ],
  notion: [
    { id: 'create_page', name: 'Create page', desc: 'Add a new page to a workspace' },
    { id: 'update_page', name: 'Update page', desc: 'Edit an existing page' },
    { id: 'query_db', name: 'Query database', desc: 'Filter and read database rows' },
  ],
  jira: [
    { id: 'create_issue', name: 'Create issue', desc: 'Open a new issue or task' },
    { id: 'update_issue', name: 'Update issue', desc: 'Change status or assignee' },
    { id: 'search_issue', name: 'Search issues', desc: 'Find issues with JQL' },
  ],
  github: [
    { id: 'create_issue', name: 'Create issue', desc: 'Open a new issue' },
    { id: 'comment_pr', name: 'Comment on PR', desc: 'Add a review comment' },
    { id: 'search_repo', name: 'Search code', desc: 'Find code across repos' },
  ],
  gcal: [
    { id: 'create_event', name: 'Create event', desc: 'Add an event to a calendar' },
    { id: 'find_event', name: 'Find events', desc: 'List events in a range' },
    { id: 'free_busy', name: 'Check availability', desc: 'Find free/busy time' },
  ],
}

const inputStyle = { width: '100%', height: 40, border: '1px solid #e6ddca', borderRadius: 10, padding: '0 12px', fontSize: 13.5, color: '#3a3a36', background: '#fff', outline: 'none' }

const APP_STEPS = [
  { id: 'app', label: 'Select App', short: 'App' },
  { id: 'action', label: 'Select Action', short: 'Action' },
  { id: 'connection', label: 'Select Connection', short: 'Connection' },
  { id: 'inputs', label: 'Define Inputs', short: 'Inputs' },
  { id: 'settings', label: 'Settings', short: 'Settings' },
  { id: 'context', label: 'Agent context', short: 'Agent context' },
]

const CONFIGURE_STEPS = [
  { id: 'inputs', label: 'Input', icon: IconTerminal2 },
  { id: 'settings', label: 'Controls', icon: IconAdjustmentsHorizontal },
  { id: 'context', label: 'Context', icon: IconFileText },
]

function ConfigureStepper({ currentStep, onStepClick }) {
  const currentIndex = CONFIGURE_STEPS.findIndex(s => s.id === currentStep)

  return (
    <div style={{
      margin: '-16px -20px 4px', padding: '14px 20px',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'stretch', gap: 4, height: 40,
        background: '#f7f5f3', borderRadius: 12, padding: 4,
      }}>
        {CONFIGURE_STEPS.map((s, i) => {
          const active = i === currentIndex
          const clickable = Boolean(onStepClick) && !active
          const Icon = s.icon
          return (
            <button
              key={s.id}
              type="button"
              title={s.label}
              onClick={clickable ? () => onStepClick(s.id) : undefined}
              style={{
                flex: 1, minWidth: 72, height: 32, boxSizing: 'border-box',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '0 12px', borderRadius: 8,
                border: active ? '1px solid #f1efed' : '1px solid transparent',
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0px 1px 2px 0px rgba(16,24,40,0.05)' : 'none',
                cursor: clickable ? 'pointer' : 'default',
                fontSize: 14, lineHeight: '20px', whiteSpace: 'nowrap',
                color: active ? '#060503' : '#57534e',
                fontWeight: 500,
                transition: 'background .15s, color .15s, box-shadow .15s',
              }}
              onMouseOver={clickable ? e => { e.currentTarget.style.background = 'rgba(255,255,255,0.55)' } : undefined}
              onMouseOut={clickable ? e => { e.currentTarget.style.background = 'transparent' } : undefined}
            >
              <Icon size={14} stroke={1.75} aria-hidden />
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SummaryFieldLabel({ label, required }) {
  return (
    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 8 }}>
      {label}
      {required && <span style={{ color: '#b45309', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function ConnectionRadio({ checked }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      border: '1.5px solid', borderColor: checked ? '#16341f' : '#d4cfc4',
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .12s',
    }}>
      {checked && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16341f' }} />
      )}
    </span>
  )
}

function ConnectionInfo({ conn }) {
  const isDisconnected = conn.status === 'disconnected'

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 13.5, fontWeight: 600, color: '#2a2620', lineHeight: 1.35,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {conn.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap', rowGap: 3 }}>
        {isDisconnected ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d98a8a', flexShrink: 0 }} aria-hidden />
            <span style={{ fontSize: 12, color: '#c87070', lineHeight: 1.2 }}>Re-authentication required</span>
          </span>
        ) : (
          <>
            <AuthTypeChip authType={conn.authType} />
            <ConnectionMetaDot />
            <span style={{ fontSize: 12, color: '#9a917f', lineHeight: 1.2 }}>
              {formatConnectionShortDate(conn.createdAt)}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function ConnectionListRow({ conn, selected, isLast, onSelect }) {
  const isDisconnected = conn.status === 'disconnected'

  return (
    <div
      onClick={isDisconnected ? undefined : () => onSelect(conn.id)}
      onMouseOver={e => { if (!isDisconnected && !selected) e.currentTarget.style.background = '#faf7f0' }}
      onMouseOut={e => { e.currentTarget.style.background = selected ? '#f4f9f5' : '#fff' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
        cursor: isDisconnected ? 'default' : 'pointer',
        background: selected ? '#f4f9f5' : '#fff',
        borderBottom: !isLast ? '1px solid #f4eee2' : 'none', transition: 'background .12s',
      }}
    >
      <ConnectionInfo conn={conn} />

      {isDisconnected ? (
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          onMouseOver={e => { e.currentTarget.style.color = '#1d4228' }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--green-btn)' }}
          style={{
            height: 30, padding: '0 4px', flexShrink: 0,
            background: 'none', color: 'var(--green-btn)',
            border: 'none', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'color .15s',
          }}
        >
          Connect
        </button>
      ) : (
        <ConnectionRadio checked={selected} />
      )}
    </div>
  )
}

function ConnectionCategoryList({
  connected, disconnected, connectionId, onSelectConnection,
  selectedConnection, useRuntimeConnection, onUseRuntimeConnectionChange,
}) {
  const listStyle = {
    border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden',
    background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)',
  }

  const items = [...connected, ...disconnected]

  const listItems = selectedConnection && !useRuntimeConnection
    ? items.filter(c => c.id !== selectedConnection.id)
    : items

  return (
    <div style={listStyle}>
      <div style={{
        borderBottom: listItems.length ? '1px solid #f4eee2' : 'none',
        background: selectedConnection && !useRuntimeConnection ? '#f4f9f5' : '#fff',
      }}>
        {selectedConnection && !useRuntimeConnection && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 0' }}>
            <ConnectionInfo conn={selectedConnection} />
            <ConnectionRadio checked />
          </div>
        )}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: selectedConnection && !useRuntimeConnection ? '8px 12px 12px' : '12px 12px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={useRuntimeConnection}
            onChange={e => onUseRuntimeConnectionChange(e.target.checked)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <ConnectionCheckbox checked={useRuntimeConnection} />
          <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.4 }}>
            Use end user&apos;s connection at runtime for this tool
          </span>
        </label>
      </div>

      {listItems.length > 0 ? listItems.map((conn, i) => (
        <ConnectionListRow
          key={conn.id}
          conn={conn}
          selected={connectionId === conn.id}
          isLast={i === listItems.length - 1}
          onSelect={onSelectConnection}
        />
      )) : (
        <div style={{ padding: '28px 20px', textAlign: 'center', fontSize: 13, color: '#9a917f', lineHeight: 1.45 }}>
          No connections found. Try a different search, or create a new connection.
        </div>
      )}
    </div>
  )
}

function ToolSetupSummary({
  app, connectionId, onSelectConnection, query, onQueryChange,
  useRuntimeConnection, onUseRuntimeConnectionChange,
}) {
  const allConnections = useMemo(() => getConnectionsForApp(app.id), [app.id])
  const selectedConnection = useMemo(
    () => (connectionId ? allConnections.find(c => c.id === connectionId) : null),
    [allConnections, connectionId],
  )

  const { connected, disconnected } = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) {
      const filtered = allConnections.filter(c => c.name.toLowerCase().includes(q))
      return {
        connected: filtered.filter(c => c.status === 'connected'),
        disconnected: filtered.filter(c => c.status === 'disconnected'),
      }
    }
    return {
      connected: getVisibleConnections(
        allConnections.filter(c => c.status === 'connected'),
        { showAll: false, query: '', selectedId: connectionId, limit: CONNECTED_CONNECTIONS_LIMIT },
      ),
      disconnected: getVisibleConnections(
        allConnections.filter(c => c.status === 'disconnected'),
        { showAll: false, query: '', selectedId: connectionId, limit: DISCONNECTED_CONNECTIONS_LIMIT },
      ),
    }
  }, [allConnections, query, connectionId])

  const handleSelectConnection = (id) => {
    onUseRuntimeConnectionChange(false)
    onSelectConnection(id)
  }

  const handleRuntimeConnectionChange = (checked) => {
    onUseRuntimeConnectionChange(checked)
    if (checked) onSelectConnection(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{
            position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
          }}>
            <circle cx="7" cy="7" r="4.5" stroke="#a89e88" strokeWidth="1.4" />
            <path d="M11 11l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="Search connections"
            style={{
              width: '100%', height: 36, border: '1px solid #f0ebe3', borderRadius: 11,
              padding: '0 14px 0 36px', fontSize: 13.5, color: '#3a3a36', background: '#faf7f0', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#16341f'}
            onBlur={e => e.target.style.borderColor = '#f0ebe3'}
          />
        </div>
        <button
          type="button"
          onMouseOver={e => { e.currentTarget.style.background = '#f4f8f5' }}
          onMouseOut={e => { e.currentTarget.style.background = '#fff' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            height: 36, padding: '0 14px',
            background: '#fff', color: 'var(--green-btn)',
            border: '1px solid var(--green-btn)', borderRadius: 11,
            fontSize: 13.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'background .15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          New
        </button>
      </div>

      <ConnectionCategoryList
        connected={connected}
        disconnected={disconnected}
        connectionId={connectionId}
        onSelectConnection={handleSelectConnection}
        selectedConnection={selectedConnection}
        useRuntimeConnection={useRuntimeConnection}
        onUseRuntimeConnectionChange={handleRuntimeConnectionChange}
      />
    </div>
  )
}

function ActionRow({ item, onSelect, isLast = false }) {
  return (
    <div
      onClick={() => onSelect(item)}
      onMouseOver={e => { e.currentTarget.style.background = '#faf7f0' }}
      onMouseOut={e => { e.currentTarget.style.background = '#fff' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px',
        cursor: 'pointer', background: '#fff',
        borderBottom: isLast ? 'none' : '1px solid #f4eee2', transition: 'background .12s',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{item.name}</div>
        {item.desc && (
          <div style={{ fontSize: 12.5, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
        )}
      </div>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M6 3.5L10.5 8 6 12.5" stroke="#d4cdc0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function ActionCategoryList({ actions, onSelect, groupDefs = null }) {
  const hasGroups = Boolean(groupDefs?.length) && actions.some(a => a.group)

  if (!actions.length) {
    return (
      <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No matches found.</div>
    )
  }

  const listStyle = { border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }

  if (!hasGroups) {
    return (
      <div style={listStyle}>
        {actions.map((item, i) => (
          <ActionRow key={item.id} item={item} onSelect={onSelect} isLast={i === actions.length - 1} />
        ))}
      </div>
    )
  }

  const groups = groupDefs
    .map(def => ({ ...def, items: actions.filter(a => a.group === def.id) }))
    .filter(g => g.items.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {groups.map(group => (
        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={sectionLabelStyle}>{group.label}</div>
          <div style={listStyle}>
            {group.items.map((item, i) => (
              <ActionRow
                key={item.id}
                item={item}
                onSelect={onSelect}
                isLast={i === group.items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ConnectionCheckbox({ checked, indeterminate }) {
  const active = checked || indeterminate
  return (
    <span style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      border: '1.5px solid', borderColor: active ? '#16341f' : '#d4cfc4',
      background: active ? '#16341f' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .12s',
    }}>
      {checked && (
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7.2l3 3L11.5 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {!checked && indeterminate && (
        <span style={{ width: 7, height: 1.8, borderRadius: 1, background: '#fff' }} />
      )}
    </span>
  )
}

function ConnectionMetaDot() {
  return <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#d8d4ca', flexShrink: 0 }} aria-hidden />
}

const inputFieldStyle = {
  width: '100%', height: 42, border: '1px solid #e6ddca', borderRadius: 10,
  padding: '0 12px', fontSize: 13.5, fontWeight: 400, fontFamily: 'inherit',
  color: '#3a3a36', background: '#fff', outline: 'none',
}

function NumberStepChevron({ up = false, size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden style={{
      display: 'block',
      transform: up ? 'rotate(180deg)' : 'none',
    }}>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NumberInput({ value, onChange, min = 1, width = 72, height = 38, embedded = false }) {
  const [focused, setFocused] = useState(false)

  const commit = (next) => onChange(Math.max(min, Number(next) || min))
  const step = (delta) => commit(value + delta)

  const stepBtn = (dir, disabled) => (
    <button
      type="button"
      aria-label={dir === 'up' ? 'Increase value' : 'Decrease value'}
      disabled={disabled}
      onClick={() => step(dir === 'up' ? 1 : -1)}
      style={{
        width: 14, height: 10, border: 'none', background: 'none', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: disabled ? '#d4cfc4' : '#8a8378', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 0.85, transition: 'opacity .12s',
        lineHeight: 0,
      }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
      onMouseOut={e => { if (!disabled) e.currentTarget.style.opacity = '0.85' }}
    >
      <NumberStepChevron up={dir === 'up'} />
    </button>
  )

  const dividerColor = focused ? '#d8e3dc' : '#ece5d7'

  return (
    <div style={{
      position: 'relative', width, flexShrink: 0,
      borderRight: embedded ? `1px solid ${dividerColor}` : 'none',
      background: embedded && focused ? '#f6f9f7' : embedded ? '#fff' : 'transparent',
      transition: 'background .12s',
    }}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => {
          const raw = e.target.value.replace(/[^\d]/g, '')
          if (raw === '') return onChange(min)
          commit(Number(raw))
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputFieldStyle,
          width: '100%',
          height,
          paddingRight: 22,
          border: embedded ? 'none' : `1px solid ${focused ? '#16341f' : '#e6ddca'}`,
          borderRadius: embedded ? 0 : 10,
          borderColor: embedded ? 'transparent' : (focused ? '#16341f' : '#e6ddca'),
          background: embedded ? 'transparent' : '#fff',
        }}
      />
      <div style={{
        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 20, pointerEvents: 'none',
      }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {stepBtn('up', false)}
          {stepBtn('down', value <= min)}
        </div>
      </div>
    </div>
  )
}

const settingsBoxStyle = {
  border: '1px solid #eee7da', borderRadius: 14,
  background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)',
}

const settingsStackStyle = {
  display: 'flex', flexDirection: 'column', gap: 12,
}

const settingsRowPadding = '16px 18px'
const settingsRowTitleStyle = { fontSize: 14, fontWeight: 600, color: '#2a2620', lineHeight: 1.35 }
const settingsRowDescStyle = { fontSize: 12.5, color: '#9a917f', marginTop: 4, lineHeight: 1.45 }

function FieldHelpTooltip() {
  return null
}

function HelpSectionBadge({ children, variant = 'neutral' }) {
  const isWhen = variant === 'when'
  return (
    <div style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, marginBottom: 8,
      background: isWhen ? '#fef3e2' : '#f4f0e6',
      color: isWhen ? '#b45309' : '#7a7568',
    }}>
      {children}
    </div>
  )
}

function HelpExampleRow({ badge, children }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
        color: '#4a4438', background: '#f6f2ea', border: '1px solid #ebe4d6',
        borderRadius: 6, padding: '2px 7px', lineHeight: 1.35, whiteSpace: 'nowrap',
      }}>
        {badge}
      </span>
      <span style={{ fontSize: 12.5, color: '#5b5547', lineHeight: 1.45, paddingTop: 1 }}>
        {children}
      </span>
    </div>
  )
}

function InvocationCostHelpContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.25 }}>
          Tool Cost Expression
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#3a3a36', marginBottom: 5 }}>What is this?</div>
        <div style={{ fontSize: 12.5, color: '#6b6453', lineHeight: 1.5 }}>
          Calculates how much money or credits each tool execution costs. Use a fixed value or tool output to calculate tool invocation cost for Agent Budgeting. Defaults to 0.
        </div>
      </div>

      <div>
        <HelpSectionBadge variant="when">Why?</HelpSectionBadge>
        <div style={{ fontSize: 12.5, color: '#6b6453', lineHeight: 1.5 }}>
          Track API costs and monitor expensive tools
        </div>
      </div>
    </div>
  )
}

function RateLimitParameterHelpContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, lineHeight: 1.25 }}>
          Rate Limiting Parameter
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#3a3a36', marginBottom: 5 }}>What is this?</div>
        <div style={{ fontSize: 12.5, color: '#6b6453', lineHeight: 1.5 }}>
          The &ldquo;weight&rdquo; or &ldquo;cost&rdquo; of running this tool. Tells the system how many quota units to deduct each time the tool runs. Use a fixed value or tool output for calculation. Defaults to 1.
        </div>
      </div>

      <div>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#7a7568', marginBottom: 6,
        }}>
          Quick math
        </div>
        <div style={{
          fontSize: 12.5, color: '#4a4438', lineHeight: 1.45,
          fontFamily: 'var(--mono)', background: '#faf7f0', borderRadius: 8,
          padding: '8px 10px', border: '1px solid #f0ebe3',
        }}>
          Rate Limit: 100 per hour / Parameter: 2 = 50 runs per hour
        </div>
      </div>

      <div>
        <HelpSectionBadge>Examples</HelpSectionBadge>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <HelpExampleRow badge="1">Default: 1 unit per execution</HelpExampleRow>
          <HelpExampleRow badge="5">Fixed: 5 units per execution</HelpExampleRow>
          <HelpExampleRow badge="±1 Users">100 users = 100 units per execution</HelpExampleRow>
          <HelpExampleRow badge="(x) = ±1 3 Users +5">10 users + 5 = 15 units per execution</HelpExampleRow>
        </div>
      </div>

      <div>
        <HelpSectionBadge variant="when">When?</HelpSectionBadge>
        <div style={{ fontSize: 12.5, color: '#6b6453', lineHeight: 1.5 }}>
          Different executions should &ldquo;cost&rdquo; different quota amounts
        </div>
      </div>
    </div>
  )
}

function RichFieldHelpTooltip() {
  return null
}

function DisabledHoverTooltip({ show: showTip, text, children }) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const [tipPos, setTipPos] = useState(null)

  const place = () => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const maxW = 260
    const pad = 12
    const top = r.top - 8

    let left = r.left + r.width / 2
    let transform = 'translate(-50%, -100%)'

    const half = maxW / 2
    if (left + half > window.innerWidth - pad) {
      left = Math.min(r.right, window.innerWidth - pad)
      transform = 'translate(-100%, -100%)'
    }
    if (left - (transform === 'translate(-100%, -100%)' ? maxW : half) < pad) {
      left = Math.max(r.left, pad)
      transform = 'translate(0, -100%)'
    }

    setTipPos({ top, left, transform })
  }

  return (
    <>
      <span
        ref={anchorRef}
        style={{ display: 'inline-flex' }}
        onMouseEnter={() => { if (showTip && text) { place(); setOpen(true) } }}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </span>
      {showTip && open && tipPos && text && (
        <span
          role="tooltip"
          style={{
            position: 'fixed', top: tipPos.top, left: tipPos.left,
            transform: tipPos.transform,
            width: 'max-content', maxWidth: 260, padding: '6px 10px', borderRadius: 6,
            background: '#fff', color: '#6b6453', fontSize: 13, lineHeight: 1.4,
            border: '1px solid #e8e1d2', boxShadow: '0 4px 12px rgba(40,32,18,0.1)', fontWeight: 400,
            zIndex: 200, pointerEvents: 'none', textAlign: 'center', whiteSpace: 'normal',
          }}
        >
          {text}
        </span>
      )}
    </>
  )
}

function InputFieldLabel({ label, required, helper, richHelper }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547' }}>
        {label}
        {required && <span style={{ color: '#b45309', marginLeft: 2 }}>*</span>}
      </label>
      {richHelper
        ? <RichFieldHelpTooltip>{richHelper}</RichFieldHelpTooltip>
        : <FieldHelpTooltip text={helper} />
      }
    </div>
  )
}

function TextInputField({ field, value, onChange }) {
  return (
    <div>
      <InputFieldLabel label={field.label} required={field.required} helper={field.helper} />
      <input
        className="action-input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        style={inputFieldStyle}
        onFocus={e => { e.target.style.borderColor = '#16341f' }}
        onBlur={e => { e.target.style.borderColor = '#e6ddca' }}
      />
    </div>
  )
}

function TextareaInputField({ field, value, onChange }) {
  return (
    <div>
      <InputFieldLabel label={field.label} required={field.required} helper={field.helper} />
      <textarea
        className="action-input-field"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows || 4}
        style={{
          ...inputFieldStyle, height: 'auto', minHeight: 96, padding: '10px 12px',
          resize: 'vertical',
        }}
        onFocus={e => { e.target.style.borderColor = '#16341f' }}
        onBlur={e => { e.target.style.borderColor = '#e6ddca' }}
      />
    </div>
  )
}

function SelectInputField({ field, value, onChange }) {
  const [open, setOpen] = useState(false)
  const selected = (field.options || []).find(o => o.id === value)

  return (
    <div style={{ position: 'relative' }}>
      <InputFieldLabel label={field.label} required={field.required} helper={field.helper} />
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        ...inputFieldStyle, display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', textAlign: 'left', padding: '0 12px',
        borderColor: open ? '#16341f' : '#e6ddca',
      }}>
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: selected?.label ? '#3a3a36' : '#9a917f', fontWeight: selected?.label ? 500 : 400, fontSize: 13.5,
        }}>
          {selected?.label || field.placeholder || 'Choose…'}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
          flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
        }}>
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 2,
            background: '#fff', border: '1px solid #e8e1d2', borderRadius: 12,
            boxShadow: '0 12px 34px rgba(40,32,18,0.14)', padding: 6, overflow: 'hidden',
          }}>
            {(field.options || []).map(option => (
              <div key={option.id} onClick={() => { onChange(option.id); setOpen(false) }}
                onMouseOver={e => { e.currentTarget.style.background = '#faf7f0' }}
                onMouseOut={e => { e.currentTarget.style.background = value === option.id ? '#f6f9f7' : 'transparent' }}
                style={{
                  padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5,
                  color: '#2a2620', background: value === option.id ? '#f6f9f7' : 'transparent',
                }}>
                {option.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BlocksInputField({ field, value, onChange }) {
  const blocks = Array.isArray(value) ? value : []
  const hasBlocks = blocks.length > 0
  const addBlock = () => onChange([...blocks, { id: `block-${Date.now()}`, type: 'section' }])
  const removeBlock = (id) => onChange(blocks.filter(b => b.id !== id))

  return (
    <div>
      <InputFieldLabel label={field.label} required={field.required} helper={field.helper} />
      <div style={{
        border: '1px solid #e6ddca', borderRadius: 10, background: '#fff',
        display: 'flex', flexDirection: 'column', gap: 8,
        ...(hasBlocks
          ? { padding: '8px 10px' }
          : { height: 42, padding: '0 12px', justifyContent: 'center' }),
      }}>
        {blocks.map((block, i) => (
          <div key={block.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            border: '1px solid #f0ebe0', borderRadius: 8, background: '#faf7f0',
          }}>
            <span style={{ flex: 1, fontSize: 13, color: '#2a2620', fontWeight: 500 }}>
              Block {i + 1} · {block.type}
            </span>
            <button type="button" onClick={() => removeBlock(block.id)} style={{
              padding: 0, border: 'none', background: 'none', color: '#9a917f',
              fontSize: 12, cursor: 'pointer',
            }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addBlock} style={{
          alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none',
          color: '#16341f', fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5v7M2.5 6h7" stroke="#16341f" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add block
        </button>
      </div>
    </div>
  )
}

function LookupInputField({ field, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const allOptions = getLookupOptions(field.lookup)
  const match = allOptions.find(o => o.id === value)
  const selected = match || (value ? { id: value, label: value } : null)
  const displayLabel = selected?.label ? `#${selected.label}` : null

  const options = getLookupOptions(field.lookup, query)

  const pick = (id) => {
    onChange(id)
    setOpen(false)
    setQuery('')
    setCustomMode(false)
  }

  const applyCustom = () => {
    const trimmed = customValue.trim()
    if (!trimmed) return
    onChange(trimmed)
    setOpen(false)
    setCustomMode(false)
    setCustomValue('')
    setQuery('')
  }

  return (
    <div style={{ position: 'relative' }}>
      <InputFieldLabel label={field.label} required={field.required} helper={field.helper} />
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        ...inputFieldStyle, display: 'flex', alignItems: 'center', gap: 8,
        cursor: 'pointer', textAlign: 'left', padding: '0 12px',
        borderColor: open ? '#16341f' : '#e6ddca',
      }}>
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: displayLabel ? '#3a3a36' : '#9a917f', fontWeight: displayLabel ? 500 : 400,
        }}>
          {displayLabel || field.placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
          flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
        }}>
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div onClick={() => { setOpen(false); setCustomMode(false); setQuery('') }} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 2,
            background: '#fff', border: '1px solid #e8e1d2', borderRadius: 12,
            boxShadow: '0 12px 34px rgba(40,32,18,0.14)', overflow: 'hidden',
          }}>
            {customMode ? (
              <div style={{ padding: 12 }}>
                <input
                  autoFocus
                  value={customValue}
                  onChange={e => setCustomValue(e.target.value)}
                  placeholder="Enter channel name or ID"
                  style={{ ...inputFieldStyle, marginBottom: 10 }}
                  onKeyDown={e => { if (e.key === 'Enter') applyCustom() }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setCustomMode(false)} style={{
                    height: 34, padding: '0 12px', border: '1px solid #e3ddd1', borderRadius: 8,
                    background: '#fff', fontSize: 13, cursor: 'pointer', color: '#3a3a36',
                  }}>Cancel</button>
                  <button type="button" onClick={applyCustom} style={{
                    height: 34, padding: '0 12px', border: 'none', borderRadius: 8,
                    background: 'var(--green-btn)', fontSize: 13, cursor: 'pointer', color: '#fff',
                  }}>Apply</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #f0ebe0' }}>
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search channels"
                    style={{ ...inputFieldStyle, height: 38, background: '#faf7f0', borderColor: '#ece5d7' }}
                  />
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', padding: 6 }}>
                  {options.map(item => (
                    <div key={item.id} onClick={() => pick(item.id)}
                      onMouseOver={e => { e.currentTarget.style.background = '#faf7f0' }}
                      onMouseOut={e => { e.currentTarget.style.background = value === item.id ? '#f6f9f7' : 'transparent' }}
                      style={{
                        padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5,
                        color: '#2a2620', background: value === item.id ? '#f6f9f7' : 'transparent',
                      }}>
                      #{item.label}
                    </div>
                  ))}
                  {options.length === 0 && (
                    <div style={{ padding: '16px 10px', textAlign: 'center', fontSize: 13, color: '#9a917f' }}>
                      No channels found
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '10px 12px', borderTop: '1px solid #f0ebe0', background: '#fafaf9',
                }}>
                  <button type="button" onClick={() => setCustomMode(true)} style={{
                    padding: 0, border: 'none', background: 'none', color: '#16341f',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2.5v7M2.5 6h7" stroke="#16341f" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Enter custom value
                  </button>
                  <button type="button" onClick={() => setQuery('')} style={{
                    height: 32, padding: '0 12px', border: '1px solid #c8d9ce', borderRadius: 8,
                    background: '#fff', color: '#16341f', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  }}>
                    Refresh results
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function renderInputField(field, value, onChange) {
  const shared = {
    key: field.id,
    field,
    value: value ?? (field.type === 'blocks' ? [] : ''),
    onChange,
  }
  if (field.type === 'lookup') return <LookupInputField {...shared} />
  if (field.type === 'textarea') return <TextareaInputField {...shared} />
  if (field.type === 'select') return <SelectInputField {...shared} />
  if (field.type === 'blocks') return <BlocksInputField {...shared} />
  return <TextInputField {...shared} />
}

function ActionInputForm({ appId, actionId, values, onChange }) {
  const fields = getFieldsForAction(appId, actionId)
  const visibleFields = getVisibleFields(fields, values)
  const requiredFields = visibleFields.filter(field => field.required)
  const optionalFields = visibleFields.filter(field => !field.required)
  const [showOptional, setShowOptional] = useState(false)

  useEffect(() => {
    setShowOptional(false)
  }, [appId, actionId])

  if (!fields.length) {
    return (
      <div style={{
        border: '1px dashed #e3ddd1', borderRadius: 12, background: '#faf9f7',
        padding: '28px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No inputs needed</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          This action doesn&apos;t require any configuration. Continue to settings.
        </div>
      </div>
    )
  }

  const optionalCount = optionalFields.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {requiredFields.map(field => renderInputField(
        field,
        values[field.id],
        v => onChange(field.id, v),
      ))}

      {optionalCount > 0 && !showOptional && (
        <button
          type="button"
          onClick={() => setShowOptional(true)}
          style={{
            alignSelf: 'flex-start', marginTop: requiredFields.length ? -6 : 0,
            padding: 0, border: 'none', background: 'none',
            color: '#16341f', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          {`Show ${optionalCount} optional field${optionalCount > 1 ? 's' : ''}`}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#16341f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {showOptional && optionalFields.map(field => renderInputField(
        field,
        values[field.id],
        v => onChange(field.id, v),
      ))}

      {optionalCount > 0 && showOptional && (
        <button
          type="button"
          onClick={() => setShowOptional(false)}
          style={{
            alignSelf: 'flex-start', marginTop: -6,
            padding: 0, border: 'none', background: 'none',
            color: '#16341f', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}
        >
          Hide optional fields
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: 'rotate(180deg)', transition: 'transform .15s' }}>
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#16341f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

function SettingsToggle({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2,
      background: on ? 'var(--green-btn)' : '#e3ddd1', transition: 'background .15s',
      display: 'flex', alignItems: 'center', flexShrink: 0,
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.14)',
      }} />
    </button>
  )
}

function SettingsRow({ label, description, tooltip, checked, onChange }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked) } }}
      style={{
        ...settingsBoxStyle,
        display: 'flex', alignItems: 'flex-start', gap: 16,
        padding: settingsRowPadding, cursor: 'pointer',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={settingsRowTitleStyle}>{label}</div>
          {tooltip && <FieldHelpTooltip text={tooltip} />}
        </div>
        {description && (
          <div style={settingsRowDescStyle}>{description}</div>
        )}
      </div>
      <span onClick={e => e.stopPropagation()}>
        <SettingsToggle on={checked} onChange={onChange} />
      </span>
    </div>
  )
}

const tablerLineProps = { stroke: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }

function RateLimitScopeGlyph({ id, size = 18, color = '#16341f' }) {
  const Icon = id === 'agent' ? IconUserPlus : IconUsers
  return <Icon size={size} color={color} {...tablerLineProps} aria-hidden />
}

function CacheWhenModeGlyph({ id, size = 18, color = '#16341f' }) {
  const Icon = id === 'always' ? IconRefresh : IconAdjustmentsHorizontal
  return <Icon size={size} color={color} {...tablerLineProps} aria-hidden />
}

function RateLimitSummary({ config, onEdit }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        width: 40, height: 40, flexShrink: 0,
        borderRadius: 10, background: '#edf5f0', color: '#8a8378',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconGauge size={18} {...tablerLineProps} aria-hidden />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: '#2a2620', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {formatRateLimitSummaryTitle(config)}
        </div>
        <div style={{
          fontSize: 12.5, color: '#9a917f', marginTop: 4, lineHeight: 1.45,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {formatRateLimitSummarySubtitle(config)}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{
          flexShrink: 0, alignSelf: 'center', padding: 0, border: 'none', background: 'none',
          color: '#16341f', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity .12s',
        }}
      >
        Edit
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 2.5L8.5 6l-4 3.5" stroke="#16341f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

function RateLimitModal({ open, config, onClose, onSave }) {
  const [draft, setDraft] = useState(config)

  useEffect(() => {
    if (open) setDraft(config)
  }, [open, config])

  if (!open) return null

  const update = patch => setDraft(prev => ({ ...prev, ...patch }))

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(28,24,18,0.38)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460, background: '#fff', borderRadius: 16,
          border: '1px solid #ece5d7', boxShadow: '0 24px 64px rgba(40,32,18,0.18)',
          overflow: 'visible',
        }}
      >
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.25 }}>
                Rate limiting policy
              </div>
              <div style={{ fontSize: 12.5, color: '#9a917f', marginTop: 2, lineHeight: 1.4 }}>
                Set how often this tool can run
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a917f',
                borderRadius: 8, flexShrink: 0,
              }}
            >
              <IconX size={16} {...tablerLineProps} aria-hidden />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <InputFieldLabel
                label="Limit on"
                required
                helper="Choose whether the limit applies to the whole agent or each user individually."
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {RATE_LIMIT_SCOPES.map(opt => {
                  const selected = draft.scope === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => update({ scope: opt.id })}
                      style={{
                        padding: '14px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${selected ? '#16341f' : '#e6ddca'}`,
                        background: selected ? '#f6f9f7' : '#fff',
                        transition: 'border-color .12s, background .12s, box-shadow .12s',
                        boxShadow: selected ? '0 0 0 3px rgba(22,52,31,0.06)' : 'none',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                        color: selected ? '#16341f' : '#6b6453',
                      }}>
                        <RateLimitScopeGlyph id={opt.id} size={18} color={selected ? '#16341f' : '#7a7974'} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{opt.label}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#9a917f', lineHeight: 1.45 }}>{opt.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <InputFieldLabel
                label="Rate limit parameter"
                required
                richHelper={<RateLimitParameterHelpContent />}
              />
              <input
                type="text"
                value={draft.parameter}
                onChange={e => update({ parameter: e.target.value })}
                placeholder="(x)"
                style={{
                  ...inputFieldStyle,
                  height: 38,
                  fontFamily: 'var(--mono)',
                }}
                onFocus={e => { e.target.style.borderColor = '#16341f' }}
                onBlur={e => { e.target.style.borderColor = '#e6ddca' }}
              />
            </div>

            <div>
              <InputFieldLabel
                label="Rate limit"
                required
                helper="Maximum number of calls allowed within the selected time window."
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <NumberInput
                  value={draft.maxCalls}
                  onChange={v => update({ maxCalls: v })}
                  width={88}
                />
                <span style={{ fontSize: 13.5, color: '#6b6453', flexShrink: 0 }}>per</span>
                <NumberInput
                  value={draft.periodValue}
                  onChange={v => update({ periodValue: v })}
                  width={72}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <UnitSelect
                    compact
                    value={draft.periodUnit}
                    options={RATE_LIMIT_UNITS}
                    onChange={v => update({ periodUnit: v })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '20px 24px 24px', marginTop: 24,
          borderTop: '1px solid #f0ebe0',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 38, padding: '0 18px', borderRadius: 9, cursor: 'pointer',
              border: '1px solid #e6ddca', background: '#fff', color: '#2a2620',
              fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            style={{
              height: 38, padding: '0 20px', borderRadius: 9, cursor: 'pointer',
              border: 'none', background: '#16341f', color: '#fff',
              fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#1d4228' }}
            onMouseOut={e => { e.currentTarget.style.background = '#16341f' }}
          >
            Save policy
          </button>
        </div>
      </div>
    </div>
  )
}

function RateLimitSettingsSection({ enabled, onEnabledChange, config, onRateLimitChange }) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleToggle = (next) => {
    onEnabledChange(next)
    if (next) setModalOpen(true)
  }

  return (
    <div style={{
      ...settingsBoxStyle,
      padding: enabled ? '18px 20px 20px' : settingsRowPadding,
    }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleToggle(!enabled)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(!enabled) } }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={settingsRowTitleStyle}>Enable rate limit</div>
            <span onClick={e => e.stopPropagation()}>
              <FieldHelpTooltip text="Limits how often this tool can run in a time window. Configure max calls and scope after enabling." />
            </span>
          </div>
          <div style={settingsRowDescStyle}>
            Cap how many times this tool can run within a time window.
          </div>
        </div>
        <span onClick={e => e.stopPropagation()}>
          <SettingsToggle on={enabled} onChange={handleToggle} />
        </span>
      </div>
      {enabled && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0ebe0' }}
        >
          <RateLimitSummary config={config} onEdit={() => setModalOpen(true)} />
        </div>
      )}
      <RateLimitModal
        open={modalOpen}
        config={config}
        onClose={() => setModalOpen(false)}
        onSave={(next) => { onRateLimitChange(next); setModalOpen(false) }}
      />
    </div>
  )
}

function CacheSummary({ config, onEdit }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        width: 40, height: 40, flexShrink: 0,
        borderRadius: 10, background: '#edf5f0', color: '#8a8378',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconDatabase size={18} {...tablerLineProps} aria-hidden />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: '#2a2620', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {formatCacheSummaryTitle(config)}
        </div>
        <div style={{
          fontSize: 12.5, color: '#9a917f', marginTop: 4, lineHeight: 1.45,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {formatCacheSummarySubtitle(config)}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{
          flexShrink: 0, alignSelf: 'center', padding: 0, border: 'none', background: 'none',
          color: '#16341f', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'opacity .12s',
        }}
      >
        Edit
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 2.5L8.5 6l-4 3.5" stroke="#16341f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

function CacheModal({ open, config, onClose, onSave }) {
  const [draft, setDraft] = useState(config)
  const [keyDraft, setKeyDraft] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(config)
      setKeyDraft('')
    }
  }, [open, config])

  if (!open) return null

  const update = patch => setDraft(prev => ({ ...prev, ...patch }))
  const updateCondition = (id, patch) => update({
    conditions: draft.conditions.map(c => c.id === id ? { ...c, ...patch } : c),
  })

  const addKeyField = () => {
    const field = keyDraft.trim()
    if (!field || draft.keyFields.includes(field)) return
    update({ keyFields: [...draft.keyFields, field] })
    setKeyDraft('')
  }

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(28,24,18,0.38)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640, maxHeight: 'calc(100vh - 48px)',
          background: '#fff', borderRadius: 16,
          border: '1px solid #ece5d7', boxShadow: '0 24px 64px rgba(40,32,18,0.18)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '24px 32px 0', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.25 }}>
                Cache policy
              </div>
              <div style={{ fontSize: 13, color: '#9a917f', marginTop: 4, lineHeight: 1.45 }}>
                Control how long responses are cached and when they apply
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a917f',
                borderRadius: 8, flexShrink: 0, marginTop: -2,
              }}
            >
              <IconX size={16} {...tablerLineProps} aria-hidden />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 24 }}>
            <div>
              <InputFieldLabel label="Cache duration" required helper="How long cached responses stay valid before expiring." />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <NumberInput
                  value={draft.ttlValue}
                  onChange={v => update({ ttlValue: v })}
                  width={88}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <UnitSelect
                    compact
                    value={draft.ttlUnit}
                    options={TTL_UNITS}
                    onChange={v => update({ ttlUnit: v })}
                  />
                </div>
              </div>
            </div>

            <div>
              <InputFieldLabel label="Cache key fields" helper="Fields used to identify a unique cached response." />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={keyDraft}
                  onChange={e => setKeyDraft(e.target.value)}
                  placeholder="Add field"
                  style={{ ...inputFieldStyle, flex: 1, height: 38 }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyField() } }}
                  onFocus={e => { e.target.style.borderColor = '#16341f' }}
                  onBlur={e => { e.target.style.borderColor = '#e6ddca' }}
                />
                <button type="button" onClick={addKeyField} style={{
                  width: 38, height: 38, flexShrink: 0, border: '1px solid #e6ddca', borderRadius: 10,
                  background: '#faf7f0', color: '#16341f', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {draft.keyFields.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {draft.keyFields.map(field => (
                    <span key={field} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                      borderRadius: 8, background: '#f6f9f7', border: '1px solid #dce8e0', fontSize: 13, color: '#2a2620',
                    }}>
                      {field}
                      <button type="button" onClick={() => update({ keyFields: draft.keyFields.filter(f => f !== field) })}
                        style={{ padding: 0, border: 'none', background: 'none', color: '#9a917f', cursor: 'pointer', lineHeight: 1 }}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => update({ cacheOnErrorsOnly: !draft.cacheOnErrorsOnly })}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ cacheOnErrorsOnly: !draft.cacheOnErrorsOnly }) } }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={settingsRowTitleStyle}>Use cache only on errors</div>
                <div style={settingsRowDescStyle}>
                  When enabled, the cache is used only if the tool execution fails.
                </div>
              </div>
              <span onClick={e => e.stopPropagation()}>
                <SettingsToggle
                  on={draft.cacheOnErrorsOnly}
                  onChange={v => update({ cacheOnErrorsOnly: v })}
                />
              </span>
            </div>

            <div>
              <InputFieldLabel label="Only cache when" helper="Optional rules for when responses should be cached." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {CACHE_WHEN_MODES.map(opt => {
                  const selected = getCacheWhenMode(draft) === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id === 'always') {
                          update({ cacheWhen: 'always', conditions: [] })
                          return
                        }
                        update({
                          cacheWhen: 'conditional',
                          conditions: draft.conditions.length ? draft.conditions : [newCacheCondition()],
                        })
                      }}
                      style={{
                        padding: '16px 18px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: `1.5px solid ${selected ? '#16341f' : '#e6ddca'}`,
                        background: selected ? '#f6f9f7' : '#fff',
                        transition: 'border-color .12s, background .12s, box-shadow .12s',
                        boxShadow: selected ? '0 0 0 3px rgba(22,52,31,0.06)' : 'none',
                      }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                        color: selected ? '#16341f' : '#6b6453',
                      }}>
                        <CacheWhenModeGlyph id={opt.id} size={18} color={selected ? '#16341f' : '#7a7974'} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{opt.label}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#9a917f', lineHeight: 1.45 }}>{opt.desc}</div>
                    </button>
                  )
                })}
              </div>

              {getCacheWhenMode(draft) === 'conditional' && (
                <div style={{
                  marginTop: 18, paddingTop: 18, borderTop: '1px solid #f0ebe0',
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  {draft.conditions.map((cond, i) => (
                    <div key={cond.id} style={{
                      display: 'flex', flexDirection: 'column', gap: 8,
                      paddingTop: i > 0 ? 16 : 0,
                      borderTop: i > 0 ? '1px solid #f0ebe0' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547' }}>
                          {i === 0 ? 'Where' : `Condition ${i + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = draft.conditions.filter(c => c.id !== cond.id)
                            update({ conditions: next.length ? next : [newCacheCondition()] })
                          }}
                          style={{ padding: 0, border: 'none', background: 'none', color: '#9a917f', fontSize: 12, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        value={cond.field}
                        onChange={e => updateCondition(cond.id, { field: e.target.value })}
                        placeholder="Enter field"
                        style={{ ...inputFieldStyle, height: 38 }}
                      />
                      <UnitSelect
                        compact
                        value={cond.operator}
                        options={CONDITION_OPERATORS}
                        onChange={v => updateCondition(cond.id, { operator: v })}
                      />
                      <input
                        value={cond.value}
                        onChange={e => updateCondition(cond.id, { value: e.target.value })}
                        placeholder="Enter value"
                        style={{ ...inputFieldStyle, height: 38 }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update({ conditions: [...draft.conditions, newCacheCondition()] })}
                    style={{
                      alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none',
                      color: '#16341f', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    + Add condition
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 32px 20px', borderTop: '1px solid #f0ebe0', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 36, padding: '0 16px', borderRadius: 9, cursor: 'pointer',
              border: '1px solid #e6ddca', background: '#fff', color: '#2a2620',
              fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            style={{
              height: 36, padding: '0 18px', borderRadius: 9, cursor: 'pointer',
              border: 'none', background: '#16341f', color: '#fff',
              fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#1d4228' }}
            onMouseOut={e => { e.currentTarget.style.background = '#16341f' }}
          >
            Save policy
          </button>
        </div>
      </div>
    </div>
  )
}

function CacheSettingsSection({ enabled, onEnabledChange, config, onCacheChange }) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleToggle = (next) => {
    onEnabledChange(next)
    if (next) setModalOpen(true)
  }

  return (
    <div style={{
      ...settingsBoxStyle,
      padding: enabled ? '18px 20px 20px' : settingsRowPadding,
    }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleToggle(!enabled)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(!enabled) } }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={settingsRowTitleStyle}>Enable cache</div>
            <span onClick={e => e.stopPropagation()}>
              <FieldHelpTooltip text="Stores tool responses so identical requests return instantly without re-running." />
            </span>
          </div>
          <div style={settingsRowDescStyle}>
            Reuse the cached answer instead of running the tool again for the same request.
          </div>
        </div>
        <span onClick={e => e.stopPropagation()}>
          <SettingsToggle on={enabled} onChange={handleToggle} />
        </span>
      </div>
      {enabled && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0ebe0' }}
        >
          <CacheSummary config={config} onEdit={() => setModalOpen(true)} />
        </div>
      )}
      <CacheModal
        open={modalOpen}
        config={config}
        onClose={() => setModalOpen(false)}
        onSave={(next) => { onCacheChange(next); setModalOpen(false) }}
      />
    </div>
  )
}

function UnitSelect({ value, options, onChange, compact = false, embedded = false }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const anchorRef = useRef(null)
  const selected = options.find(o => o.id === value)
  const fieldStyle = compact ? { ...inputFieldStyle, height: 38, fontSize: 13 } : inputFieldStyle

  const openMenu = () => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpen(true)
  }

  const closeMenu = () => setOpen(false)

  const toggleMenu = () => {
    if (open) closeMenu()
    else openMenu()
  }

  return (
    <div ref={anchorRef} style={{ position: 'relative', flex: embedded ? 1 : undefined, width: embedded ? '100%' : undefined }}>
      <button type="button" onClick={toggleMenu} style={{
        ...fieldStyle,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        textAlign: 'left',
        padding: '0 12px',
        border: embedded ? 'none' : fieldStyle.border,
        borderRadius: embedded ? 0 : fieldStyle.borderRadius,
        borderColor: open ? '#16341f' : (embedded ? 'transparent' : '#e6ddca'),
        background: embedded ? (open ? '#f6f9f7' : 'transparent') : fieldStyle.background,
        height: embedded ? 38 : fieldStyle.height,
      }}>
        <span style={{ flex: 1, fontSize: compact ? 13 : 13.5, color: '#3a3a36' }}>{selected?.label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
          flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s',
        }}>
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="#8a8378" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && menuPos && (
        <>
          <div onClick={closeMenu} style={{ position: 'fixed', inset: 0, zIndex: 210 }} />
          <div style={{
            position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 211,
            background: '#fff', border: '1px solid #e8e1d2', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(40,32,18,0.12)', padding: 4,
          }}>
            {options.map(opt => (
              <div key={opt.id} onClick={() => { onChange(opt.id); closeMenu() }}
                onMouseOver={e => { e.currentTarget.style.background = '#faf7f0' }}
                onMouseOut={e => { e.currentTarget.style.background = value === opt.id ? '#f6f9f7' : 'transparent' }}
                style={{
                  padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13.5,
                  color: '#2a2620', background: value === opt.id ? '#f6f9f7' : 'transparent',
                }}>
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InvocationCostInput({ config, onChange }) {
  const safe = config && typeof config === 'object' ? config : DEFAULT_INVOCATION_COST
  const { value = '', unit = 'dollars' } = safe
  const isDollars = unit === 'dollars'
  const [focused, setFocused] = useState(false)
  const borderColor = focused ? '#16341f' : '#e6ddca'

  const handleValueChange = (e) => {
    const raw = e.target.value
    if (isDollars) {
      let cleaned = raw.replace(/[^\d.]/g, '')
      const parts = cleaned.split('.')
      if (parts.length > 2) cleaned = `${parts[0]}.${parts.slice(1).join('')}`
      const [whole, fraction] = cleaned.split('.')
      if (fraction != null) cleaned = `${whole}.${fraction.slice(0, 2)}`
      onChange({ ...safe, value: cleaned })
      return
    }
    onChange({ ...safe, value: raw.replace(/[^\d]/g, '') })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      border: `1px solid ${borderColor}`,
      borderRadius: 10, overflow: 'visible', background: '#fff',
      transition: 'border-color .12s',
    }}>
      <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
        {isDollars && (
          <span style={{
            position: 'absolute', left: 12, color: '#8a8378', fontSize: 13.5, pointerEvents: 'none',
          }}>
            $
          </span>
        )}
        <input
          type="text"
          inputMode={isDollars ? 'decimal' : 'numeric'}
          value={value}
          onChange={handleValueChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={isDollars ? '0.00' : '0'}
          style={{
            width: '100%', height: 38, border: 'none', outline: 'none',
            padding: isDollars ? '0 12px 0 24px' : '0 12px',
            fontSize: 13.5, color: '#3a3a36',
            background: focused ? '#f6f9f7' : 'transparent',
            fontFamily: 'inherit',
          }}
        />
      </div>
      <div style={{ width: 1, background: focused ? '#d8e3dc' : '#ece5d7', flexShrink: 0 }} />
      <div style={{ width: 132, flexShrink: 0 }}>
        <UnitSelect
          embedded
          compact
          value={unit}
          options={INVOCATION_COST_UNITS}
          onChange={nextUnit => onChange({ ...safe, unit: nextUnit })}
        />
      </div>
    </div>
  )
}

function ToolSettingsForm({
  requireApproval, onRequireApprovalChange,
  reuseResponses, onReuseResponsesChange,
  rateLimitEnabled, onRateLimitEnabledChange, rateLimitConfig, onRateLimitChange,
  cacheConfig, onCacheChange,
  governance, onGovernanceChange,
  invocationCostEnabled, onInvocationCostEnabledChange, invocationCost, onInvocationCostChange,
}) {
  return (
    <div style={settingsStackStyle}>
      <SettingsRow
        label="Ask permission before execution"
        description="The agent asks for your approval before running this tool."
        checked={requireApproval}
        onChange={onRequireApprovalChange}
      />
      <RateLimitSettingsSection
        enabled={rateLimitEnabled}
        onEnabledChange={onRateLimitEnabledChange}
        config={rateLimitConfig}
        onRateLimitChange={onRateLimitChange}
      />
      <SettingsRow
        label="Governance"
        description="Set conditional rules for when the agent can and cannot execute this tool."
        checked={governance}
        onChange={onGovernanceChange}
      />
      <CacheSettingsSection
        enabled={reuseResponses}
        onEnabledChange={onReuseResponsesChange}
        config={cacheConfig}
        onCacheChange={onCacheChange}
      />
      <div style={{
        ...settingsBoxStyle,
        padding: invocationCostEnabled ? '18px 20px 20px' : settingsRowPadding,
      }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onInvocationCostEnabledChange(!invocationCostEnabled)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onInvocationCostEnabledChange(!invocationCostEnabled) } }}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 20 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ ...settingsRowTitleStyle, lineHeight: '20px' }}>Invocation cost calculation</div>
              <span
                onClick={e => e.stopPropagation()}
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <RichFieldHelpTooltip><InvocationCostHelpContent /></RichFieldHelpTooltip>
              </span>
            </div>
            <span
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <SettingsToggle on={invocationCostEnabled} onChange={onInvocationCostEnabledChange} />
            </span>
          </div>
          <div style={settingsRowDescStyle}>
            Calculates how much each execution costs in dollars or credits for agent budgeting.
          </div>
        </div>
        {invocationCostEnabled && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0ebe0' }}
          >
            <InvocationCostInput config={invocationCost} onChange={onInvocationCostChange} />
          </div>
        )}
      </div>
    </div>
  )
}

const OUTPUT_TYPE_LABELS = {
  number: 'Number',
  boolean: 'Boolean',
  array: 'Array',
  object: 'Object',
  string: 'String',
}

function OutputTypePill({ type }) {
  const label = OUTPUT_TYPE_LABELS[type] || OUTPUT_TYPE_LABELS.string
  return (
    <span style={{
      flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
      color: '#8a8170', background: '#f6f2ea', border: '1px solid #ebe4d6',
      borderRadius: 6, padding: '1px 7px', lineHeight: 1.45, whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {label}
    </span>
  )
}

const OUTPUT_TREE_GUIDE = '#e7e0d2'

const OUTPUT_INDENT = 12

const OUTPUT_GUIDE_OFFSET = 5.5

function OutputRow({
  label, type, expandable, expanded, onClick,
  customizing, checked, indeterminate, onToggle, depth = 0,
}) {
  const [hovered, setHovered] = useState(false)

  const labelContent = (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1,
    }}>
      {expandable ? (
        <span style={{
          width: 11, height: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{
            transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .15s',
          }}>
            <path d="M4.5 2.5L8.5 6.5L4.5 10.5" stroke="#b3a994" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        <span style={{ width: 11, flexShrink: 0 }} aria-hidden />
      )}
      <span style={{
        fontSize: 13, fontWeight: expandable ? 600 : 450, color: expandable ? '#2a2620' : '#5b5547', lineHeight: 1.4,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1,
      }}>
        {label}
      </span>
    </span>
  )

  const rowStyle = {
    display: 'flex', alignItems: 'stretch', gap: 0, minHeight: 30,
    borderRadius: 8, padding: '0 8px', margin: '0 -8px',
    background: hovered ? '#f7f4ec' : 'transparent', transition: 'background .12s',
  }

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {customizing && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: 10 }}>
          {onToggle ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggle() }}
              style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'flex' }}
            >
              <ConnectionCheckbox checked={checked} indeterminate={indeterminate} />
            </button>
          ) : (
            <span style={{ width: 16, height: 16 }} aria-hidden />
          )}
        </span>
      )}
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            width: OUTPUT_INDENT, flexShrink: 0, alignSelf: 'stretch', position: 'relative',
          }}
        >
          <span style={{
            position: 'absolute', top: 0, bottom: 0, left: OUTPUT_GUIDE_OFFSET, width: 1,
            background: OUTPUT_TREE_GUIDE,
          }} />
        </span>
      ))}
      {expandable ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', minWidth: 0, flex: 1, display: 'flex', alignItems: 'center' }}
        >
          {labelContent}
        </button>
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {labelContent}
        </span>
      )}
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, paddingLeft: 12 }}>
        <OutputTypePill type={type} />
      </span>
    </div>
  )
}

function collectLeafFieldIds(node, acc = []) {
  if (node.children.size === 0) {
    if (node.field) acc.push(node.field.id)
    return acc
  }
  for (const child of node.children.values()) collectLeafFieldIds(child, acc)
  return acc
}

function OutputTreeNode({
  node, path, depth = 0, collapsed, onToggleCollapse,
  customizing, selectedIds, onToggleField, onToggleFields,
}) {
  const nodePath = path ? `${path}.${node.key}` : node.key
  const hasChildren = node.children.size > 0
  const isExpanded = !collapsed.has(nodePath)
  const childNodes = [...node.children.values()]

  if (!hasChildren && node.field) {
    const field = node.field
    return (
      <OutputRow
        label={field.label}
        type={field.type}
        depth={depth}
        customizing={customizing}
        checked={selectedIds.includes(field.id)}
        onToggle={() => onToggleField(field.id)}
      />
    )
  }

  const branchType = node.field?.type
    || (childNodes.some(c => c.field?.type === 'array') ? 'array' : 'object')

  const leafIds = collectLeafFieldIds(node)
  const selectedCount = leafIds.filter(id => selectedIds.includes(id)).length
  const allSelected = leafIds.length > 0 && selectedCount === leafIds.length
  const someSelected = selectedCount > 0 && !allSelected

  return (
    <div>
      <OutputRow
        label={formatOutputTreeKey(node.key)}
        type={branchType}
        depth={depth}
        expandable
        expanded={isExpanded}
        onClick={() => onToggleCollapse(nodePath)}
        customizing={customizing}
        checked={allSelected}
        indeterminate={someSelected}
        onToggle={leafIds.length ? () => onToggleFields(leafIds, !allSelected) : undefined}
      />
      {isExpanded && (
        <>
          {childNodes.map(child => (
            <OutputTreeNode
              key={child.key}
              node={child}
              path={nodePath}
              depth={depth + 1}
              collapsed={collapsed}
              onToggleCollapse={onToggleCollapse}
              customizing={customizing}
              selectedIds={selectedIds}
              onToggleField={onToggleField}
              onToggleFields={onToggleFields}
            />
          ))}
        </>
      )}
    </div>
  )
}

function OutputFilterSection({ onModeChange, fields, selectedIds, onSelectedChange }) {
  const [customizing, setCustomizing] = useState(false)
  const [collapsed, setCollapsed] = useState(() => new Set())
  const allSelected = selectedIds.length === fields.length
  const tree = useMemo(() => buildOutputFieldTree(fields), [fields])

  const updateSelection = (nextIds) => {
    onSelectedChange(nextIds)
    onModeChange(nextIds.length === fields.length ? 'all' : 'filter')
  }

  const toggleField = id => {
    updateSelection(
      selectedIds.includes(id)
        ? selectedIds.filter(f => f !== id)
        : [...selectedIds, id],
    )
  }

  const toggleFields = (ids, shouldSelect) => {
    if (shouldSelect) {
      const set = new Set(selectedIds)
      ids.forEach(id => set.add(id))
      updateSelection(fields.map(f => f.id).filter(id => set.has(id)))
    } else {
      const remove = new Set(ids)
      updateSelection(selectedIds.filter(id => !remove.has(id)))
    }
  }

  const toggleAll = () => {
    updateSelection(allSelected ? [] : fields.map(f => f.id))
  }

  const toggleCollapse = path => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const sendFull = () => {
    setCustomizing(false)
    updateSelection(fields.map(f => f.id))
  }

  const sendCustom = () => {
    setCustomizing(true)
  }

  const segStyle = (active) => ({
    flex: 1, minWidth: 0, height: 32, boxSizing: 'border-box',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '0 12px', borderRadius: 9, border: active ? '1px solid #f1efed' : '1px solid transparent',
    background: active ? '#fff' : 'transparent',
    boxShadow: active ? '0px 1px 2px 0px rgba(16,24,40,0.05)' : 'none',
    cursor: 'pointer', fontSize: 13, lineHeight: '18px', whiteSpace: 'nowrap',
    color: active ? '#060503' : '#7a7468', fontWeight: 500,
    transition: 'background .15s, color .15s, box-shadow .15s',
  })

  return (
    <div>
      <InputFieldLabel
        label="Tool output"
        helper="Sending the full response can pollute the agent's context window with fields it doesn't need. Select only the fields the agent should use."
      />
      <p style={{ fontSize: 13, color: '#9a917f', lineHeight: 1.5, margin: '0 0 10px' }}>
        Define the tool output the agent should receive.
      </p>

      <div style={{
        border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden',
        background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)',
      }}>
        <div style={{ padding: 8, borderBottom: '1px solid #f0ebe0' }}>
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 4,
            background: '#f7f5f3', borderRadius: 11, padding: 4,
          }}>
            <button type="button" onClick={sendFull} style={segStyle(!customizing)}>
              Send full response
            </button>
            <button type="button" onClick={sendCustom} style={segStyle(customizing)}>
              Select Fields
            </button>
          </div>
        </div>

        <div style={{ padding: '10px 14px 12px', background: '#fff' }}>
          {customizing && (
            <div style={{ display: 'flex', alignItems: 'center', minHeight: 30, marginBottom: 2 }}>
              <button
                type="button"
                onClick={toggleAll}
                aria-label={allSelected ? 'Deselect all fields' : 'Select all fields'}
                style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0, marginRight: 10 }}
              >
                <ConnectionCheckbox
                  checked={allSelected}
                  indeterminate={selectedIds.length > 0 && !allSelected}
                />
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#5b5547' }}>
                Fields
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: '#9a917f' }}>
                {selectedIds.length} of {fields.length} selected
              </span>
            </div>
          )}
          {[...tree.children.values()].map(child => (
            <OutputTreeNode
              key={child.key}
              node={child}
              path=""
              depth={0}
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              customizing={customizing}
              selectedIds={selectedIds}
              onToggleField={toggleField}
              onToggleFields={toggleFields}
            />
          ))}
        </div>
      </div>

      {customizing && selectedIds.length === 0 && (
        <p style={{ fontSize: 12.5, color: '#b45309', margin: '8px 0 0', lineHeight: 1.45 }}>
          Select at least one field for the agent to receive.
        </p>
      )}
    </div>
  )
}

function toolDescriptionPlaceholder(app, action) {
  const appName = app?.name || 'the app'
  const actionName = action?.name || 'run this action'
  const actionLower = actionName.toLowerCase()
  const example = action?.desc || `${actionName} using ${appName}.`

  return `Describe what this tool does and when to use it. E.g. ${example}`
}

function AgentContextForm({
  app, action, name, description, onNameChange, onDescriptionChange,
  outputFilterMode, onOutputFilterModeChange,
  outputFields, selectedOutputFields, onSelectedOutputFieldsChange,
}) {
  const textareaStyle = {
    ...inputFieldStyle, width: '100%', height: 'fit-content', padding: '12px 12px',
    resize: 'vertical', lineHeight: 1.55, display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <InputFieldLabel
          label="Name"
          required
          helper="A short, recognizable name the agent can reference when choosing tools."
        />
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Enter name"
          style={inputFieldStyle}
          onFocus={e => { e.target.style.borderColor = '#16341f' }}
          onBlur={e => { e.target.style.borderColor = '#e6ddca' }}
        />
      </div>

      <div>
        <InputFieldLabel
          label="Description"
          required
          helper="Explain what this tool does and when the agent should use it."
        />
        <textarea
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder={toolDescriptionPlaceholder(app, action)}
          rows={4}
          style={textareaStyle}
          onFocus={e => { e.target.style.borderColor = '#16341f' }}
          onBlur={e => { e.target.style.borderColor = '#e6ddca' }}
        />
      </div>

      <OutputFilterSection
        onModeChange={onOutputFilterModeChange}
        fields={outputFields}
        selectedIds={selectedOutputFields}
        onSelectedChange={onSelectedOutputFieldsChange}
      />
    </div>
  )
}

function goBackStep(step) {
  if (step === 'context') return 'settings'
  if (step === 'settings') return 'inputs'
  if (step === 'inputs') return 'summary'
  if (step === 'summary') return 'action'
  if (step === 'action') return 'app'
  return 'app'
}

export default function AddToolPanel({ onClose, onAdd, appsOnly = false }) {
  const [tab, setTab] = useState(appsOnly ? 'apps' : 'tools')      // tools | apps
  const [step, setStep] = useState('app')      // app | action | connection | summary | inputs | settings | context
  const [returnTo, setReturnTo] = useState(null)
  const [app, setApp] = useState(null)
  const [action, setAction] = useState(null)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(() => new Set())
  const [connectionId, setConnectionId] = useState(null)
  const [useRuntimeConnection, setUseRuntimeConnection] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)
  const [reuseResponses, setReuseResponses] = useState(false)
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false)
  const [rateLimitConfig, setRateLimitConfig] = useState(DEFAULT_RATE_LIMIT_CONFIG)
  const [governance, setGovernance] = useState(false)
  const [invocationCostEnabled, setInvocationCostEnabled] = useState(false)
  const [invocationCost, setInvocationCost] = useState(DEFAULT_INVOCATION_COST)
  const [cacheConfig, setCacheConfig] = useState(DEFAULT_CACHE_CONFIG)
  const [inputValues, setInputValues] = useState({})
  const [toolName, setToolName] = useState('')
  const [toolDescription, setToolDescription] = useState('')
  const [outputFilterMode, setOutputFilterMode] = useState('all')
  const [selectedOutputFields, setSelectedOutputFields] = useState([])
  const [headerIconHover, setHeaderIconHover] = useState(false)

  const inFlow = (appsOnly || tab === 'apps') && step !== 'app'   // inside an app's action/config flow
  const tools = TOOLS.filter(t => t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase()))
  const apps = APPS.filter(a => a.name.toLowerCase().includes(q.toLowerCase()))
  const allActions = app ? ACTIONS[app.id] || GENERIC_ACTIONS : []
  const selectedConnection = useMemo(
    () => (app && connectionId ? getConnectionsForApp(app.id).find(c => c.id === connectionId) : null),
    [app, connectionId],
  )
  const actionKey = action?.id ?? ''
  const inputFields = useMemo(() => getFieldsForAction(app?.id, action?.id), [app?.id, action?.id])
  const outputFields = useMemo(
    () => getOutputFieldsForAction(app?.id, action?.id),
    [app?.id, action?.id],
  )
  const ql = q.toLowerCase()
  const actions = allActions.filter(a =>
    a.name.toLowerCase().includes(ql)
    || (a.desc || '').toLowerCase().includes(ql)
    || (a.tag || '').toLowerCase().includes(ql)
  )

  const resetConnection = () => { setConnectionId(null); setUseRuntimeConnection(false) }
  const resetSettings = () => {
    setRequireApproval(false)
    setReuseResponses(false)
    setRateLimitEnabled(false)
    setRateLimitConfig(DEFAULT_RATE_LIMIT_CONFIG)
    setGovernance(false)
    setInvocationCostEnabled(false)
    setInvocationCost(DEFAULT_INVOCATION_COST)
    setCacheConfig(DEFAULT_CACHE_CONFIG)
    setToolName('')
    setToolDescription('')
    setOutputFilterMode('all')
    setSelectedOutputFields([])
  }
  const resetInputs = () => {
    setInputValues(getDefaultInputValues(getFieldsForAction(app?.id, action?.id)))
  }
  const setInputValue = (fieldId, value) => setInputValues(prev => ({ ...prev, [fieldId]: value }))

  useEffect(() => {
    if (step !== 'summary' || !app?.id || connectionId || useRuntimeConnection) return
    const defaultId = getDefaultConnectionId(app.id)
    if (defaultId) setConnectionId(defaultId)
  }, [step, app?.id, connectionId, useRuntimeConnection])

  useEffect(() => {
    setRequireApproval(false)
    resetInputs()
    const fields = getOutputFieldsForAction(app?.id, action?.id)
    setSelectedOutputFields(fields.map(f => f.id))
    setOutputFilterMode('all')
  }, [actionKey])

  useEffect(() => {
    if (step !== 'context' || toolName.trim()) return
    if (app?.name && action?.name) setToolName(`${app.name}: ${action.name}`)
  }, [step, app, action, toolName])

  const handleOutputFilterModeChange = mode => {
    setOutputFilterMode(mode)
    if (mode === 'filter') {
      setSelectedOutputFields(prev => (
        prev.length ? prev : getDefaultSelectedOutputFields(outputFields)
      ))
    }
  }

  const goBackInFlow = () => {
    setStep(goBackStep(step))
    setQ('')
  }

  const switchTab = (t) => {
    setTab(t); setStep('app'); setApp(null); setAction(null); resetConnection(); resetSettings(); resetInputs(); setReturnTo(null); setQ('')
  }
  const pickApp = (a) => {
    const changed = app?.id !== a.id
    setApp(a)
    if (changed) {
      setAction(null)
      resetConnection()
      resetSettings()
      resetInputs()
      setReturnTo(null)
      setStep('action')
    } else if (returnTo === 'summary') {
      setStep('summary')
      setReturnTo(null)
    } else {
      setStep('action')
    }
    setQ('')
  }
  const pickAction = (ac) => {
    const changed = action?.id !== ac.id
    setAction(ac)
    if (changed) {
      resetConnection()
      resetSettings()
      resetInputs()
    }
    setStep('summary')
    setReturnTo(null)
    setQ('')
  }
  const addApp = () => {
    if (!action) return
    const approval = requireApproval ? 'Required' : 'None'
    const inputs = formatInputsSummary(inputFields, inputValues)
    const name = toolName.trim() || (app?.name && action?.name ? `${app.name}: ${action.name}` : action.name || '')
    const description = toolDescription.trim() || action?.desc || ''
    onAdd?.({
      app, action, connection: selectedConnection, useRuntimeConnection, approval, inputs, inputValues,
      cache: reuseResponses ? cacheConfig : null,
      rateLimit: rateLimitEnabled ? rateLimitConfig : null,
      governance,
      invocationCost: invocationCostEnabled ? normalizeInvocationCost(invocationCost) : null,
      name,
      description,
      outputFilter: outputFilterMode === 'all'
        ? { mode: 'all' }
        : { mode: 'filter', fields: selectedOutputFields },
    })
    onClose?.()
  }
  const inAppsFlow = appsOnly || tab === 'apps'
  const toggleTool = (t) => setPicked(p => { const n = new Set(p); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })
  const addPicked = () => { if (!picked.size) return; TOOLS.filter(t => picked.has(t.id)).forEach(t => onAdd?.({ app: { name: 'Built-in tool', slug: '__builtin', icon: t.Icon }, action: { name: t.name }, builtin: true })); onClose?.() }

  const showAppIcon = Boolean(app && step !== 'app')
  const setupSummaryProps = app && action ? {
    app,
    connectionId,
    onSelectConnection: setConnectionId,
    query: q,
    onQueryChange: setQ,
    useRuntimeConnection,
    onUseRuntimeConnectionChange: setUseRuntimeConnection,
  } : null

  const isConfigureStep = step === 'inputs' || step === 'settings' || step === 'context'
  const headerSubtitle = step === 'summary' && action
    ? action.name
    : isConfigureStep && action
      ? [action.name, selectedConnection?.name].filter(Boolean).join(' · ')
      : null

  const title = !appsOnly && tab === 'tools' ? 'Add a tool'
    : step === 'app' ? 'Select an app to connect'
    : step === 'action' ? `Select an action for ${app?.name}`
    : step === 'summary' ? 'Select connection'
    : isConfigureStep ? 'Configure tool'
    : APP_STEPS.find(s => s.id === step)?.label || 'Add a tool'

  const searchBar = (step === 'app' || step === 'action') && (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="7" cy="7" r="4.5" stroke="#a89e88" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" /></svg>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={step === 'app' ? 'Search apps' : 'Search actions'}
          style={{ width: '100%', height: 42, border: '1px solid #f0ebe3', borderRadius: 11, padding: '0 14px 0 36px', fontSize: 13.5, color: '#3a3a36', background: '#faf7f0', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#f0ebe3'} />
      </div>
    </div>
  )

  const selectionList = step === 'app' && (
    <div style={{ border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
      {apps.map((item, i) => (
        <div
          key={item.id}
          onClick={() => pickApp(item)}
          onMouseOver={e => { e.currentTarget.style.background = '#faf7f0' }}
          onMouseOut={e => { e.currentTarget.style.background = '#fff' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px', cursor: 'pointer',
            borderBottom: i < apps.length - 1 ? '1px solid #f4eee2' : 'none', background: '#fff',
            transition: 'background .12s',
          }}
        >
          <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ToolGlyph slug={item.slug} name={item.name} size={20} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{item.name}</div>
            <div style={{ fontSize: 12.5, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
          </div>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
            <path d="M6 3.5L10.5 8 6 12.5" stroke="#d4cdc0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ))}
      {apps.length === 0 && (
        <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No matches found.</div>
      )}
    </div>
  )

  const actionList = step === 'action' && (
    <ActionCategoryList
      actions={actions}
      onSelect={pickAction}
      groupDefs={app?.id === 'slack' ? SLACK_ACTION_GROUPS : null}
    />
  )

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(28,24,18,0.30)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ width: 520, maxWidth: '94vw', height: '100%', background: '#FEFDFB', borderLeft: '1px solid #ece5d7', boxShadow: '-18px 0 60px rgba(40,32,18,0.22)', display: 'flex', flexDirection: 'column', animation: 'toolSlide .22s cubic-bezier(.4,0,.2,1)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 'fit-content', padding: '16px 20px', borderBottom: '1px solid #f6f2ea', flexShrink: 0 }}>
          <span
            role={inFlow ? 'button' : undefined}
            tabIndex={inFlow ? 0 : undefined}
            aria-label={inFlow ? 'Go back' : undefined}
            title={inFlow ? 'Go back' : undefined}
            onClick={inFlow ? goBackInFlow : undefined}
            onKeyDown={inFlow ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goBackInFlow()
              }
            } : undefined}
            onMouseEnter={inFlow ? () => setHeaderIconHover(true) : undefined}
            onMouseLeave={inFlow ? () => setHeaderIconHover(false) : undefined}
            style={{
              position: 'relative', width: 40, height: 40, borderRadius: 11,
              background: inFlow && headerIconHover
                ? '#f7f4ec'
                : showAppIcon ? '#fff' : !appsOnly && tab === 'tools' ? '#f3ecdd' : '#fbe9d9',
              border: '1px solid',
              borderColor: !appsOnly && tab === 'tools' ? '#e6dcc4' : '#efe3d2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              cursor: inFlow ? 'pointer' : 'default',
              transition: 'background .15s',
            }}
          >
            {inFlow && headerIconHover ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M9.5 3.5L5 8l4.5 4.5" stroke="#5b5547" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : showAppIcon ? <ToolGlyph slug={app.slug} name={app.name} size={22} />
              : !appsOnly && tab === 'tools'
                ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 2.5a4 4 0 00-4.7 5.2l-4.9 4.9a1.6 1.6 0 102.3 2.3l4.9-4.9A4 4 0 1012.5 2.5z" stroke="#8a7648" strokeWidth="1.6" strokeLinejoin="round" /></svg>
                : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="#d97b3a" strokeWidth="1.5" /><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="#d97b3a" strokeWidth="1.5" /><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="#d97b3a" strokeWidth="1.5" /><path d="M14.5 12v5M12 14.5h5" stroke="#d97b3a" strokeWidth="1.5" strokeLinecap="round" /></svg>}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{title}</div>
            {headerSubtitle && (
              <div style={{
                fontSize: 12.5, color: '#9a917f', marginTop: 3, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {headerSubtitle}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            {inFlow && step === 'inputs' && (connectionId || useRuntimeConnection) && (
              <button type="button" aria-label="Run tool" style={{
                border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9a917f',
              }}>
                <IconPlayerPlay size={18} stroke={1.75} />
              </button>
            )}
            <button onClick={onClose} aria-label="Close" style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 0,
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9a917f',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs — only at the top level (hidden inside an app flow or when apps-only) */}
        {!appsOnly && !inFlow && (
          <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', background: '#f2f1ee', borderRadius: 11, padding: 4, gap: 2 }}>
              {[['tools', 'Standard'], ['apps', 'Applications']].map(([id, label]) => (
                <button key={id} onClick={() => switchTab(id)} style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5,
                  background: tab === id ? '#fff' : 'transparent', color: tab === id ? '#1a1a1a' : '#6b6b66', fontWeight: tab === id ? 500 : 400,
                  boxShadow: tab === id ? '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' : 'none', transition: 'all .15s',
                }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {inAppsFlow ? (
          <div style={{
            flex: 1, minWidth: 0, padding: '16px 20px 20px', overflowY: 'auto',
          }}>
            {searchBar}
            {selectionList}
            {actionList}

            {step === 'summary' && setupSummaryProps && (
              <ToolSetupSummary {...setupSummaryProps} />
            )}

            {(step === 'inputs' || step === 'settings' || step === 'context') && (
              <ConfigureStepper
                currentStep={step}
                onStepClick={(stepId) => setStep(stepId)}
              />
            )}

            {step === 'inputs' && app && action && (
              <ActionInputForm
                appId={app.id}
                actionId={action.id}
                values={inputValues}
                onChange={setInputValue}
              />
            )}

            {step === 'settings' && app && action && (
              <ToolSettingsForm
                requireApproval={requireApproval}
                onRequireApprovalChange={setRequireApproval}
                reuseResponses={reuseResponses}
                onReuseResponsesChange={setReuseResponses}
                rateLimitEnabled={rateLimitEnabled}
                onRateLimitEnabledChange={setRateLimitEnabled}
                rateLimitConfig={rateLimitConfig}
                onRateLimitChange={setRateLimitConfig}
                cacheConfig={cacheConfig}
                onCacheChange={setCacheConfig}
                governance={governance}
                onGovernanceChange={setGovernance}
                invocationCostEnabled={invocationCostEnabled}
                onInvocationCostEnabledChange={setInvocationCostEnabled}
                invocationCost={invocationCost}
                onInvocationCostChange={setInvocationCost}
              />
            )}

            {step === 'context' && app && action && (
              <AgentContextForm
                app={app}
                action={action}
                name={toolName}
                description={toolDescription}
                onNameChange={setToolName}
                onDescriptionChange={setToolDescription}
                outputFilterMode={outputFilterMode}
                onOutputFilterModeChange={handleOutputFilterModeChange}
                outputFields={outputFields}
                selectedOutputFields={selectedOutputFields}
                onSelectedOutputFieldsChange={setSelectedOutputFields}
              />
            )}
          </div>
        ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          {/* TOOLS tab — instant add */}
          {!appsOnly && tab === 'tools' && (
            <>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="7" cy="7" r="4.5" stroke="#a89e88" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="#a89e88" strokeWidth="1.4" strokeLinecap="round" /></svg>
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools"
                style={{ width: '100%', height: 42, border: '1px solid #f0ebe3', borderRadius: 11, padding: '0 14px 0 36px', fontSize: 13.5, color: '#3a3a36', background: '#faf7f0', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#16341f'} onBlur={e => e.target.style.borderColor = '#f0ebe3'} />
            </div>
            <div style={{ border: '1px solid #eee7da', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(60,50,30,0.03)' }}>
              {tools.map((t, i) => {
                const on = picked.has(t.id)
                const Icon = t.Icon
                return (
                <div key={t.id} onClick={() => toggleTool(t)}
                  onMouseOver={e => { if (!on) e.currentTarget.style.background = '#faf7f0' }} onMouseOut={e => { if (!on) e.currentTarget.style.background = '#fff' }}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px', cursor: 'pointer', borderBottom: i < tools.length - 1 ? '1px solid #f4eee2' : 'none', background: on ? '#f6f2ea' : '#fff', transition: 'background .12s' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #eee7da', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} color={TOOL_ICON_COLOR} {...tablerToolProps} aria-hidden />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2620' }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: '#9a917f', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  </div>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: on ? '#16341f' : '#f1ede4', border: '1px solid', borderColor: on ? '#16341f' : '#e6dfd1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}>
                    {on
                      ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2l3 3L11.5 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="#8a7d6a" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                  </span>
                </div>
              )})}
              {tools.length === 0 && <div style={{ padding: '34px 0', textAlign: 'center', color: '#9a917f', fontSize: 13.5 }}>No tools found.</div>}
            </div>
            </>
          )}
        </div>
        )}

        {/* Footer — tools multi-select */}
        {!appsOnly && tab === 'tools' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: picked.size ? '#3a3a36' : '#9a917f' }}>{picked.size ? `${picked.size} selected` : 'No tools selected'}</span>
            <div style={{ flex: 1 }} />
            <button onClick={addPicked} disabled={!picked.size} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: picked.size ? 'pointer' : 'default', opacity: picked.size ? 1 : 0.45 }}
              onMouseOver={e => { if (picked.size) e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { if (picked.size) e.currentTarget.style.background = '#16341f' }}>
              {picked.size ? `Add ${picked.size} tool${picked.size > 1 ? 's' : ''}` : 'Add tools'}
            </button>
          </div>
        )}

        {/* Footer — setup summary / select connection */}
        {inAppsFlow && step === 'summary' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <button onClick={() => { setStep('action'); setQ('') }} style={{ height: 38, padding: '0 12px', background: 'none', color: '#3a3a36', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
            <div style={{ flex: 1 }} />
            {(() => {
              const canProceed = Boolean(connectionId || useRuntimeConnection)
              return (
                <button onClick={canProceed ? () => setStep('inputs') : undefined} disabled={!canProceed} style={{
                  height: 38, padding: '0 20px', color: '#fff', border: 'none', borderRadius: 9,
                  fontSize: 13.5, fontWeight: 500, cursor: canProceed ? 'pointer' : 'not-allowed',
                  background: canProceed ? 'var(--green-btn)' : '#c9c3b6',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
                  onMouseOver={e => { if (canProceed) e.currentTarget.style.background = '#1d4228' }}
                  onMouseOut={e => { if (canProceed) e.currentTarget.style.background = '#16341f' }}>
                  Next
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6.5 3.5L11 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )
            })()}
          </div>
        )}

        {/* Footer — inputs step */}
        {inAppsFlow && step === 'inputs' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <button onClick={() => setStep('summary')} style={{ height: 38, padding: '0 12px', background: 'none', color: '#3a3a36', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={addApp} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.background = '#1d4228' }} onMouseOut={e => { e.currentTarget.style.background = '#16341f' }}>
              Add tool
            </button>
          </div>
        )}

        {/* Footer — settings step */}
        {inAppsFlow && step === 'settings' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <button onClick={goBackInFlow} style={{ height: 38, padding: '0 12px', background: 'none', color: '#3a3a36', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={addApp} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
              Add tool
            </button>
          </div>
        )}

        {/* Footer — agent context step */}
        {inAppsFlow && step === 'context' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid #f2ede3', flexShrink: 0 }}>
            <button onClick={goBackInFlow} style={{ height: 38, padding: '0 12px', background: 'none', color: '#3a3a36', border: 'none', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M9.5 3.5L5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={addApp} style={{ height: 38, padding: '0 20px', background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'} onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
              Add tool
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#5b5547', display: 'block', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  )
}

export { ToolGlyph }
