import { useState, useMemo } from 'react'
import {
  IconBook, IconBrain, IconChevronRight, IconCpu, IconDotsVertical, IconFileText,
  IconListCheck, IconSettings, IconShield, IconTools, IconUser,
} from '@tabler/icons-react'
import AddToolPanel, { ToolGlyph } from './AddToolPanel'

const tablerLineProps = { stroke: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }

const PLATE = { background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }

const MAIN_TABS = ['Configuration', 'Deployments', 'Observability']

const CONFIG_NAV = [
  { id: 'instructions', label: 'Instructions', Icon: IconFileText },
  { id: 'tasks', label: 'Tasks', Icon: IconListCheck },
  { id: 'knowledge', label: 'Knowledge', Icon: IconBook },
  { id: 'memory', label: 'Memory', Icon: IconBrain },
  { id: 'tools', label: 'Tools', Icon: IconTools },
  { id: 'models', label: 'Models', Icon: IconCpu },
  { id: 'guardrails', label: 'Guardrails', Icon: IconShield, chevron: true },
  { id: 'settings', label: 'Settings', Icon: IconSettings, chevron: true },
]

const STANDARD_TOOLS = [
  { id: 'web-search', name: 'Web Search', desc: 'Search the web for live information', enabled: true },
  { id: 'code', name: 'Code Interpreter', desc: 'Run Python to compute and analyze', enabled: true },
  { id: 'summarize', name: 'Summarizer', desc: 'Condense long text into a brief', enabled: false },
  { id: 'kb-search', name: 'Knowledge Search', desc: 'Search your knowledge base (RAG)', enabled: true },
]

function Toggle({ on, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} style={{
      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', padding: 2,
      background: on ? 'var(--green-btn)' : '#e3ddd1', transition: 'background .15s',
      display: 'flex', alignItems: 'center', flexShrink: 0,
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform .15s', boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
      }} />
    </button>
  )
}

function ApprovalBadge({ value }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, lineHeight: 1,
      color: '#374151', border: '1px solid #e3ddd1', borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
    }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#9ca3af" strokeWidth="1.2" /><path d="M4 6l1.4 1.4L8 4.8" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {value}
    </span>
  )
}

function toolFromPanelEntry(entry) {
  const appName = entry.app?.name || 'Unknown'
  const actionName = entry.action?.name || 'Tool'
  const slug = entry.app?.slug || 'unknown'
  const isBuiltin = entry.builtin || slug === '__builtin'
  const name = isBuiltin ? actionName : `${actionName} via ${appName}`
  return {
    id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    desc: entry.action?.desc || '',
    app: { name: isBuiltin ? 'built-in' : (slug === 'slack' ? 'slack' : appName.toLowerCase()), slug },
    inputs: '',
    approval: entry.approval || 'None',
    connector: isBuiltin ? 'built-in' : (slug === 'slack' ? 'slack' : slug),
    endUserConnection: !isBuiltin && !!entry.useRuntimeConnection,
    enabled: true,
  }
}

export default function AgentDetailPage({ agent, onBack }) {
  const [mainTab, setMainTab] = useState('Configuration')
  const [configSection, setConfigSection] = useState('tools')
  const [tools, setTools] = useState(() => [...(agent.tools || [])])
  const [standardTools, setStandardTools] = useState(() => [...STANDARD_TOOLS])
  const [toolPanel, setToolPanel] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTools = useMemo(() =>
    tools.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [tools, search])

  const addTool = (entry) => setTools(ts => [...ts, toolFromPanelEntry(entry)])
  const toggleTool = (id, enabled) => setTools(ts => ts.map(t => t.id === id ? { ...t, enabled } : t))
  const toggleStandard = (id, enabled) => setStandardTools(ts => ts.map(t => t.id === id ? { ...t, enabled } : t))

  return (
    <div style={PLATE}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 24px 0', flexShrink: 0, borderBottom: '1px solid #efece6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--serif)', fontSize: 15, color: '#9a8f7d', padding: 0 }}>Agents</button>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5l3 3.5-3 3.5" stroke="#c9c2b4" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{agent.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <span style={{
            width: 48, height: 48, borderRadius: '50%', background: agent.color || '#2f7d4c',
            color: '#fff', fontSize: 16, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" fill="#fff" opacity="0.9" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" fill="#fff" opacity="0.9" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.2 }}>{agent.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>{agent.version} published {agent.publishedAt}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <IconBtn title="Share">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="3.5" r="1.8" stroke="#6b7280" strokeWidth="1.3" /><circle cx="4" cy="8" r="1.8" stroke="#6b7280" strokeWidth="1.3" /><circle cx="12" cy="12.5" r="1.8" stroke="#6b7280" strokeWidth="1.3" /><path d="M5.6 7.1l4.3-2.4M5.6 8.9l4.3 2.4" stroke="#6b7280" strokeWidth="1.2" /></svg>
            </IconBtn>
            <button style={{
              background: '#fff', color: 'var(--green-btn)', border: '1px solid var(--green-btn)', borderRadius: 8,
              padding: '0 16px', height: 34, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'background .15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#f4f8f5'}
              onMouseOut={e => e.currentTarget.style.background = '#fff'}>
              Preview
            </button>
            <button style={{
              background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 8,
              padding: '0 18px', height: 34, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'background .15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
              onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
              Publish
            </button>
            <IconBtn title="More options">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.2" fill="#6b7280" /><circle cx="8" cy="8" r="1.2" fill="#6b7280" /><circle cx="8" cy="12.5" r="1.2" fill="#6b7280" /></svg>
            </IconBtn>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {MAIN_TABS.map(t => (
            <button key={t} onClick={() => setMainTab(t)} style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
              color: mainTab === t ? 'var(--green-btn)' : '#6b7280', fontWeight: mainTab === t ? 600 : 400,
              borderBottom: mainTab === t ? '2px solid var(--green-btn)' : '2px solid transparent',
              marginBottom: -1, transition: 'color .12s, border-color .12s',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {mainTab === 'Configuration' ? (
          <>
            {/* Config sidebar */}
            <div style={{ width: 210, flexShrink: 0, borderRight: '1px solid #efece6', padding: '12px 10px', overflowY: 'auto' }}>
              {CONFIG_NAV.map(item => {
                const active = configSection === item.id
                return (
                  <button key={item.id} onClick={() => setConfigSection(item.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                    border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                    background: active ? '#eef6f0' : 'transparent',
                    color: active ? 'var(--green-btn)' : '#374151',
                    fontSize: 13.5, fontWeight: active ? 600 : 400, transition: 'background .12s, color .12s',
                  }}
                    onMouseOver={e => { if (!active) e.currentTarget.style.background = '#f9faf9' }}
                    onMouseOut={e => { if (!active) e.currentTarget.style.background = active ? '#eef6f0' : 'transparent' }}>
                    <item.Icon
                      size={17}
                      color={active ? 'var(--green-btn)' : '#6b7280'}
                      {...tablerLineProps}
                      aria-hidden
                    />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.chevron && (
                      <IconChevronRight size={14} color="#c5c9c5" {...tablerLineProps} aria-hidden />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Config content */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '24px' }}>
              {configSection === 'tools' ? (
                <ToolsSection
                  tools={filteredTools}
                  standardTools={standardTools}
                  search={search}
                  setSearch={setSearch}
                  onToggle={toggleTool}
                  onToggleStandard={toggleStandard}
                  onAddTool={() => setToolPanel(true)}
                />
              ) : (
                <PlaceholderSection section={CONFIG_NAV.find(n => n.id === configSection)?.label || configSection} />
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9a917f', fontSize: 14 }}>
            {mainTab} view coming soon.
          </div>
        )}
      </div>

      {toolPanel && <AddToolPanel onClose={() => setToolPanel(false)} onAdd={addTool} />}
    </div>
  )
}

const COMBINED_COLS = '52px 248px 1fr 158px 132px 44px'

const COMBINED_COL_PAD = [
  { paddingLeft: 14, paddingRight: 10 },
  { paddingLeft: 14, paddingRight: 16 },
  { paddingLeft: 16, paddingRight: 20 },
  { paddingLeft: 12, paddingRight: 16 },
  { paddingLeft: 12, paddingRight: 16 },
  {},
]

function ToolsSection({ tools, standardTools, search, setSearch, onToggle, onToggleStandard, onAddTool }) {
  const q = search.trim().toLowerCase()
  const filteredStandard = q
    ? standardTools.filter(t => (t.name + ' ' + t.desc).toLowerCase().includes(q))
    : standardTools

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: '#1a1a1a', marginBottom: 6 }}>Tools</h2>
          <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>
            Custom tools connect this agent to your systems. Standard tools are a fixed catalog of built-in capabilities you configure once.
          </p>
        </div>
        <button onClick={onAddTool} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 12px', flexShrink: 0,
          background: '#fff', color: 'var(--green-btn)', border: '1px solid var(--green-btn)', borderRadius: 7,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background .15s', whiteSpace: 'nowrap',
        }}
          onMouseOver={e => e.currentTarget.style.background = '#f4f8f5'}
          onMouseOut={e => e.currentTarget.style.background = '#fff'}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Add Tool
        </button>
      </div>

      {/* ── All tools (custom + standard, combined) ── */}
      <ToolGroup headerRight={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ToolbarButton title="Refresh">
              <FigRefreshIcon />
            </ToolbarButton>
            <ToolbarButton title="Filter" label="Filter">
              <FigFilterIcon />
            </ToolbarButton>
            <ToolbarButton title="Sort" label="Sort">
              <FigSortIcon />
            </ToolbarButton>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 28, flexShrink: 0,
            background: '#fff', border: '1px solid #edebe8', borderRadius: 8, padding: '0 8px',
            transition: 'border-color .15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, pointerEvents: 'none' }}>
              <circle cx="7" cy="7" r="4.5" stroke="#737373" strokeWidth="1.4" /><path d="M11 11l3 3" stroke="#737373" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all tools"
              style={{ width: 168, height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#374151' }} />
          </div>
        </div>
      }>
        <div role="table">
          <TableHead cols={COMBINED_COLS} labels={['On', 'Tool', 'Description', 'Connection', 'Approval', '']} colPad={COMBINED_COL_PAD} />

          {tools.map((t, i) => {
            const last = i === tools.length - 1 && filteredStandard.length === 0
            return (
              <TableRow key={t.id} cols={COMBINED_COLS} last={last}>
                <Cell pad={COMBINED_COL_PAD[0]}><Toggle on={t.enabled} onChange={v => onToggle(t.id, v)} /></Cell>
                <Cell pad={COMBINED_COL_PAD[1]}><ToolNameCell glyph={<ToolIcon app={t.app} />} name={t.name} /></Cell>
                <Cell pad={COMBINED_COL_PAD[2]}><DescriptionText text={t.desc} /></Cell>
                <Cell pad={COMBINED_COL_PAD[3]}><ConnectionBadge endUser={t.endUserConnection} /></Cell>
                <Cell pad={COMBINED_COL_PAD[4]}><ApprovalBadge value={t.approval} /></Cell>
                <ActionCell>
                  <RowActionsBtn />
                </ActionCell>
              </TableRow>
            )
          })}

          {filteredStandard.map((t, i) => (
            <TableRow key={t.id} cols={COMBINED_COLS} last={i === filteredStandard.length - 1}>
              <Cell pad={COMBINED_COL_PAD[0]}><Toggle on={t.enabled} onChange={v => onToggleStandard(t.id, v)} /></Cell>
              <Cell pad={COMBINED_COL_PAD[1]}><ToolNameCell glyph={<BuiltinGlyph />} name={t.name} /></Cell>
              <Cell pad={COMBINED_COL_PAD[2]}><DescriptionText text={t.desc} /></Cell>
              <Cell pad={COMBINED_COL_PAD[3]}><span style={{ fontSize: 13, color: '#b3aa98' }}>—</span></Cell>
              <Cell pad={COMBINED_COL_PAD[4]}><span style={{ fontSize: 13, color: '#b3aa98' }}>—</span></Cell>
              <ActionCell>
                <RowActionsBtn />
              </ActionCell>
            </TableRow>
          ))}

          {tools.length === 0 && filteredStandard.length === 0 && (
            <EmptyRow>No tools match “{search}”.</EmptyRow>
          )}
        </div>
      </ToolGroup>
    </div>
  )
}

function ConnectionBadge({ endUser }) {
  if (endUser) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, lineHeight: 1,
        color: 'var(--green-btn)', background: '#eef6f0', border: '1px solid #d6e8dc', borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
      }}>
        <IconUser size={12} color="var(--green-btn)" {...tablerLineProps} aria-hidden />
        End user
      </span>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, lineHeight: 1,
      color: '#6b7280', border: '1px solid #e3ddd1', borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
    }}>
      Shared
    </span>
  )
}

function BuiltinGlyph() {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: '#f4f1ea',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IconTools size={13} color="#8a8270" {...tablerLineProps} aria-hidden />
    </span>
  )
}

function ToolIcon({ app }) {
  if (!app || app.slug === '__builtin') return <BuiltinGlyph />
  return <ToolGlyph slug={app.slug} name={app.name} size={22} />
}

function ToolNameCell({ glyph, name }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {glyph}
      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
    </span>
  )
}

function DescriptionText({ text }) {
  if (!text) return <span style={{ fontSize: 13, color: '#b3aa98' }}>—</span>
  return (
    <span style={{
      fontSize: 13, color: '#6b7280', lineHeight: 1.45,
      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
    }}>
      {text}
    </span>
  )
}

function ToolGroup({ title, headerRight, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {title && <h3 style={{ fontSize: 14.5, fontWeight: 600, color: '#1a1a1a', margin: 0, flexShrink: 0 }}>{title}</h3>}
        {headerRight && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, marginLeft: title ? 'auto' : 0 }}>
            {headerRight}
          </div>
        )}
      </div>
      <div style={{ border: '1px solid #ece8e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
        {children}
      </div>
    </section>
  )
}

const FIG_ICON_COLOR = '#6a6662'

function FigRefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M2.45288 8.66667L2.10072 9.0216C2.29566 9.215 2.61011 9.215 2.80504 9.0216L2.45288 8.66667ZM3.92492 7.91047C4.12095 7.716 4.12219 7.3994 3.92769 7.2034C3.7332 7.00733 3.41662 7.00613 3.22059 7.2006L3.92492 7.91047ZM1.68517 7.2006C1.48914 7.00613 1.17256 7.00733 0.978067 7.2034C0.783573 7.3994 0.78482 7.716 0.980847 7.91047L1.68517 7.2006ZM12.4101 4.92853C12.5547 5.16377 12.8626 5.23723 13.0979 5.09261C13.3331 4.94799 13.4065 4.64005 13.2619 4.40481L12.4101 4.92853ZM8.05227 1.5C4.68737 1.5 1.95288 4.20747 1.95288 7.55553H2.95288C2.95288 4.76715 5.23223 2.5 8.05227 2.5V1.5ZM1.95288 7.55553V8.66667H2.95288V7.55553H1.95288ZM2.80504 9.0216L3.92492 7.91047L3.22059 7.2006L2.10072 8.31173L2.80504 9.0216ZM2.80504 8.31173L1.68517 7.2006L0.980847 7.91047L2.10072 9.0216L2.80504 8.31173ZM13.2619 4.40481C12.191 2.66285 10.2579 1.5 8.05227 1.5V2.5C9.89861 2.5 11.5148 3.4723 12.4101 4.92853L13.2619 4.40481Z" fill={FIG_ICON_COLOR} />
      <path d="M13.543 7.33337L13.8945 6.97777C13.6997 6.78523 13.3863 6.78523 13.1915 6.97777L13.543 7.33337ZM12.0673 8.0889C11.8709 8.28297 11.8691 8.59957 12.0632 8.79597C12.2573 8.99237 12.5739 8.99423 12.7703 8.8001L12.0673 8.0889ZM14.3157 8.8001C14.5121 8.99423 14.8287 8.99237 15.0227 8.79597C15.2169 8.59957 15.2151 8.28297 15.0187 8.08883L14.3157 8.8001ZM3.54569 11.0708C3.40066 10.8358 3.0926 10.7628 2.8576 10.9079C2.6226 11.0529 2.54967 11.361 2.69469 11.596L3.54569 11.0708ZM7.9222 14.5C11.2971 14.5 14.043 11.7944 14.043 8.4445H13.043C13.043 11.2311 10.7559 13.5 7.9222 13.5V14.5ZM14.043 8.4445V7.33337H13.043V8.4445H14.043ZM13.1915 6.97777L12.0673 8.0889L12.7703 8.8001L13.8945 7.68897L13.1915 6.97777ZM13.1915 7.68897L14.3157 8.8001L15.0187 8.08883L13.8945 6.97777L13.1915 7.68897ZM2.69469 11.596C3.76976 13.338 5.70975 14.5 7.9222 14.5V13.5C6.06722 13.5 4.44429 12.5269 3.54569 11.0708L2.69469 11.596Z" fill={FIG_ICON_COLOR} />
    </svg>
  )
}

function FigFilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M14.6663 4.66666H1.33301" stroke={FIG_ICON_COLOR} strokeLinecap="round" />
      <path d="M12.6663 8H3.33301" stroke={FIG_ICON_COLOR} strokeLinecap="round" />
      <path d="M10.6663 11.3333H5.33301" stroke={FIG_ICON_COLOR} strokeLinecap="round" />
    </svg>
  )
}

function FigSortIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M10.6667 12V4M8 6.75L10.6667 4L13.3333 6.75" stroke={FIG_ICON_COLOR} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.33366 4V12M2.66699 9.25L5.33366 12L8.00033 9.25" stroke={FIG_ICON_COLOR} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ToolbarButton({ title, label, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        height: 28, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: label ? '0 12px 0 8px' : '0 8px', minWidth: label ? 72 : undefined,
        background: '#fff', border: '1px solid #f2f0ee', borderRadius: 8,
        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background .12s',
        fontSize: 12, fontWeight: 500, lineHeight: '16px', color: '#6a6662',
      }}
      onMouseOver={e => e.currentTarget.style.background = '#faf9f7'}
      onMouseOut={e => e.currentTarget.style.background = '#fff'}>
      {children}
      {label && <span>{label}</span>}
    </button>
  )
}

function TableHead({ cols, labels, colPad = [] }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols, alignItems: 'center',
      borderBottom: '1px solid #ece8e0', background: '#faf9f7',
    }}>
      {labels.map((h, i) => (
        <div key={h || `c${i}`} style={{
          paddingTop: 9, paddingBottom: 9, paddingLeft: 16, paddingRight: 16,
          ...colPad[i],
          fontSize: 11, fontWeight: 600, color: '#94908a',
          textTransform: 'uppercase', letterSpacing: '0.04em',
          textAlign: i === labels.length - 1 && !h ? 'right' : 'left',
        }}>{h}</div>
      ))}
    </div>
  )
}

function TableRow({ cols, last, children }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols, alignItems: 'center', minHeight: 44,
      borderBottom: last ? 'none' : '1px solid #f3f0ea', transition: 'background .12s',
    }}
      onMouseOver={e => e.currentTarget.style.background = '#faf9f7'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </div>
  )
}

function Cell({ children, style, pad }) {
  return (
    <div style={{
      paddingTop: 10, paddingBottom: 10, paddingLeft: 16, paddingRight: 16,
      display: 'flex', alignItems: 'center', minWidth: 0,
      ...pad, ...style,
    }}>
      {children}
    </div>
  )
}

function ActionCell({ children }) {
  return (
    <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
      {children}
    </div>
  )
}

function RowActionsBtn({ title = 'Row actions', onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 28, height: 28, flexShrink: 0,
        border: 'none', background: 'transparent', borderRadius: 7, outline: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .12s',
      }}
      onMouseOver={e => { e.currentTarget.style.background = '#f2f1ee' }}
      onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}>
      <IconDotsVertical size={15} color="#6b7280" stroke={1.75} aria-hidden />
    </button>
  )
}

function EmptyRow({ children }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: '#9a917f' }}>{children}</div>
  )
}

function PlaceholderSection({ section }) {
  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>{section}</h2>
      <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.55 }}>
        Configure {section.toLowerCase()} settings for this agent. Select <strong style={{ fontWeight: 600, color: '#374151' }}>Tools</strong> in the sidebar to manage custom and standard tool connections.
      </p>
    </div>
  )
}

function IconBtn({ children, title, onClick }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 34, height: 34, border: 'none', background: 'transparent', borderRadius: 7,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s',
      }}
      onMouseOver={e => e.currentTarget.style.background = '#f2f1ee'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </button>
  )
}

