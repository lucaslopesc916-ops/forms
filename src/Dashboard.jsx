import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

const fmt = (val) => val || <span style={{ color: '#9ca3af' }}>—</span>

const SOURCE_LABELS = {
  ig: 'Instagram',
  fb: 'Facebook',
  google: 'Google',
  tiktok: 'TikTok',
}

function StatCard({ label, value, sub, color = '#111827' }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</span>}
    </div>
  )
}

function Badge({ text, color = '#6b7280', bg = '#f3f4f6' }) {
  return (
    <span style={{
      background: bg,
      color,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{text}</span>
  )
}

const SOURCE_COLORS = {
  ig:     { bg: '#fdf2f8', color: '#be185d' },
  fb:     { bg: '#eff6ff', color: '#1d4ed8' },
  google: { bg: '#f0fdf4', color: '#15803d' },
  tiktok: { bg: '#fdf4ff', color: '#7e22ce' },
}

function SourceBadge({ source }) {
  if (!source) return <span style={{ color: '#d1d5db' }}>—</span>
  const c = SOURCE_COLORS[source] || { bg: '#f3f4f6', color: '#374151' }
  return <Badge text={SOURCE_LABELS[source] || source} color={c.color} bg={c.bg} />
}

function MediumBadge({ medium }) {
  if (!medium) return <span style={{ color: '#d1d5db' }}>—</span>
  const isPaid = medium === 'paid' || medium === 'cpc'
  return <Badge
    text={medium}
    color={isPaid ? '#92400e' : '#065f46'}
    bg={isPaid ? '#fffbeb' : '#ecfdf5'}
  />
}

function LeadRow({ lead, onClick, selected }) {
  const date = new Date(lead.created_at)
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <tr
      onClick={() => onClick(lead)}
      style={{
        cursor: 'pointer',
        background: selected ? '#f0f9ff' : undefined,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f9fafb' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '' }}
    >
      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>
        <div>{dateStr}</div>
        <div>{timeStr}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{lead.phone}</div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmt(lead.company)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmt(lead.city)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmt(lead.segment)}</td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>{fmt(lead.role)}</td>
      <td style={{ padding: '12px 16px' }}><SourceBadge source={lead.utm_source} /></td>
      <td style={{ padding: '12px 16px' }}><MediumBadge medium={lead.utm_medium} /></td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {fmt(lead.utm_campaign)}
      </td>
    </tr>
  )
}

function LeadDrawer({ lead, onClose }) {
  if (!lead) return null
  const date = new Date(lead.created_at)

  const rows = [
    ['Nome', lead.name],
    ['Telefone', lead.phone],
    ['Email', lead.email],
    ['Cidade', lead.city],
    ['Empresa', lead.company],
    ['Segmento', lead.segment],
    ['Cargo', lead.role],
    ['Faturamento', lead.revenue],
    ['Colaboradores', lead.employees],
  ]

  const utmRows = [
    ['Fonte', lead.utm_source],
    ['Meio', lead.utm_medium],
    ['Campanha', lead.utm_campaign],
    ['Termo', lead.utm_term],
    ['Anúncio', lead.utm_content],
    ['Facebook Click ID', lead.fbclid ? 'Sim' : null],
  ]

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 40,
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: '#fff', zIndex: 50, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>Dados do Lead</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {rows.map(([label, val]) => (
              val ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>{val}</span>
                </div>
              ) : null
            ))}
          </div>

          <div style={{ height: 1, background: '#e5e7eb', margin: '16px 0' }} />

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>Origem do Anúncio</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {utmRows.map(([label, val]) => (
              val ? (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                  <span style={{ color: '#6b7280', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
                </div>
              ) : null
            ))}
            {utmRows.every(([, val]) => !val) && (
              <div style={{ fontSize: 13, color: '#9ca3af' }}>Sem dados de rastreamento</div>
            )}
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
          <a
            href={`https://wa.me/55${lead.phone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#22c55e', color: '#fff', borderRadius: 10, padding: '10px 16px',
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setLeads(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    const interval = setInterval(fetchLeads, 30000)
    return () => clearInterval(interval)
  }, [fetchLeads])

  const today = new Date().toDateString()
  const leadsHoje = leads.filter(l => new Date(l.created_at).toDateString() === today)

  const sources = [...new Set(leads.map(l => l.utm_source).filter(Boolean))]

  const sourceCounts = sources.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.utm_source === s).length
    return acc
  }, {})

  const topSource = sources.sort((a, b) => (sourceCounts[b] || 0) - (sourceCounts[a] || 0))[0]

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || [l.name, l.phone, l.email, l.company, l.city].some(v => v?.toLowerCase().includes(q))
    const matchSource = !filterSource || l.utm_source === filterSource
    return matchSearch && matchSource
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Dashboard de Leads</span>
          </div>
          <button
            onClick={fetchLeads}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#374151' }}
          >
            ↻ Atualizar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total de Leads" value={leads.length} sub="desde o início" />
          <StatCard label="Hoje" value={leadsHoje.length} sub={new Date().toLocaleDateString('pt-BR', { weekday: 'long' })} color="#2563eb" />
          <StatCard
            label="Fonte Principal"
            value={topSource ? (SOURCE_LABELS[topSource] || topSource) : '—'}
            sub={topSource ? `${sourceCounts[topSource]} leads` : 'sem dados ainda'}
            color="#7c3aed"
          />
          <StatCard
            label="Com Rastreamento"
            value={leads.filter(l => l.utm_source).length}
            sub={`${leads.length ? Math.round(leads.filter(l => l.utm_source).length / leads.length * 100) : 0}% do total`}
            color="#0891b2"
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nome, telefone, empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 220, padding: '9px 14px', borderRadius: 10,
              border: '1px solid #e5e7eb', fontSize: 13, background: '#fff',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 10, border: '1px solid #e5e7eb',
              fontSize: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="">Todas as fontes</option>
            {sources.map(s => (
              <option key={s} value={s}>{SOURCE_LABELS[s] || s} ({sourceCounts[s]})</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
              {(search || filterSource) ? ' encontrado' + (filtered.length !== 1 ? 's' : '') : ''}
            </span>
            {(search || filterSource) && (
              <button onClick={() => { setSearch(''); setFilterSource('') }} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                Limpar filtros
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhum lead encontrado</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Data', 'Lead', 'Empresa', 'Cidade', 'Segmento', 'Cargo', 'Fonte', 'Meio', 'Campanha'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #e5e7eb' }}>
                  {filtered.map((lead, i) => (
                    <tr key={lead.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #f3f4f6' }}>
                      <LeadRow
                        lead={lead}
                        onClick={setSelected}
                        selected={selected?.id === lead.id}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
