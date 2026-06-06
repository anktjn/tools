import { useState } from 'react'
import { AGENTS } from '../data/agents'

const STATUS_STYLE = {
  Live: { fg: '#1f7a40', border: '#c2e3cd' },
  Draft: { fg: '#6b7280', border: '#dadfda' },
  'In Approval': { fg: '#b07a16', border: '#ecdcae' },
}

const COLS = [
  { key: 'name', label: 'Agent Name', w: '28%' },
  { key: 'version', label: 'Version', w: '12%' },
  { key: 'status', label: 'Status', w: '14%' },
  { key: 'tools', label: 'Tools', w: '12%' },
  { key: 'owner', label: 'Owner', w: '20%' },
  { key: 'modified', label: 'Last Modified', w: '14%' },
]

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Draft
  return (
    <span style={{ fontSize: 12.5, fontWeight: 500, color: s.fg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '2px 9px', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function AgentAvatar({ agent, size = 32 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: agent.color,
      color: '#fff', fontSize: size * 0.34, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{agent.init}</span>
  )
}

export default function AgentsPage({ onOpenAgent }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')

  const rows = AGENTS
    .filter(a => statusFilter === 'All status' || a.status === statusFilter)
    .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ flex: 1, background: '#FEFDFB', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '18px 26px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 27, fontWeight: 500, color: '#1a1a1a', letterSpacing: -0.3, lineHeight: 1.1, flex: 1 }}>
            Agents
          </h1>
          <button style={{
            background: 'var(--green-btn)', color: '#fff', border: 'none', borderRadius: 9,
            padding: '0 16px', height: 36, fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, transition: 'background .15s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#1d4228'}
            onMouseOut={e => e.currentTarget.style.background = '#16341f'}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v10M1.5 6.5h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
            Create Agent
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14 }}>
          <FilterBtn label={statusFilter} />
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative', width: 240 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4" stroke="#9ca3af" strokeWidth="1.4" /><path d="M10 10l3 3" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents"
              style={{ width: '100%', height: 36, border: '1px solid #e3e6e3', borderRadius: 9, padding: '0 12px 0 32px', fontSize: 13, color: '#374151', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 26px 20px' }}>
        <div style={{ border: '1px solid #ece8e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #ece8e0', background: '#faf9f7' }}>
            {COLS.map(c => (
              <div key={c.key} style={{ width: c.w, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#6b7280', letterSpacing: 0.2 }}>{c.label}</div>
            ))}
          </div>
          {rows.map((a, i) => (
            <div key={a.id} onClick={() => onOpenAgent?.(a)}
              onMouseOver={e => e.currentTarget.style.background = '#faf9f7'}
              onMouseOut={e => e.currentTarget.style.background = '#fff'}
              style={{ display: 'flex', alignItems: 'center', borderBottom: i < rows.length - 1 ? '1px solid #f0ede8' : 'none', cursor: 'pointer', transition: 'background .12s' }}>
              <div style={{ width: COLS[0].w, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <AgentAvatar agent={a} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{a.name}</span>
              </div>
              <div style={{ width: COLS[1].w, padding: '12px 14px', fontSize: 13.5, color: '#374151' }}>{a.version}</div>
              <div style={{ width: COLS[2].w, padding: '12px 14px' }}><StatusBadge status={a.status} /></div>
              <div style={{ width: COLS[3].w, padding: '12px 14px', fontSize: 13.5, color: '#374151' }}>{a.tools.length}</div>
              <div style={{ width: COLS[4].w, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#e8e4dc', color: '#5b5547', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.ownerInit}</span>
                <span style={{ fontSize: 13.5, color: '#374151' }}>{a.owner}</span>
              </div>
              <div style={{ width: COLS[5].w, padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{a.modified}</div>
            </div>
          ))}
          {rows.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#9a917f', fontSize: 14 }}>No agents match your search.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterBtn({ label }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px',
      background: '#fff', border: '1px solid #e3ddd1', borderRadius: 8, fontSize: 13, color: '#374151', cursor: 'pointer',
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" /></svg>
      {label}
    </button>
  )
}
