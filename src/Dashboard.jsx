import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { supabase } from './lib/supabase'

// ── helpers ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS = { ig: 'Instagram', fb: 'Facebook', google: 'Google', tiktok: 'TikTok' }
const srcLabel = (s) => SOURCE_LABELS[s] || s || 'Desconhecido'

const COLORS = ['#111827', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#f97316']

const today = () => new Date().toDateString()

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d
  })
}

function fmtDay(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function countBy(arr, key) {
  const map = {}
  arr.forEach(item => {
    const val = item[key] || 'Desconhecido'
    map[val] = (map[val] || 0) + 1
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent = '#111827' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 34, fontWeight: 800, color: accent, lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</span>}
    </div>
  )
}

function ChartCard({ title, sub, children, height = 220 }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
      padding: '20px 24px',
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#111827', color: '#fff', borderRadius: 8,
      padding: '8px 12px', fontSize: 13,
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i}>{p.name || 'Leads'}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#111827', color: '#fff', borderRadius: 8,
      padding: '8px 12px', fontSize: 13,
    }}>
      <strong>{payload[0].name}</strong>: {payload[0].value} leads
    </div>
  )
}

function Badge({ text, color, bg }) {
  return (
    <span style={{
      background: bg, color, borderRadius: 6, padding: '2px 8px',
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{text}</span>
  )
}

const SOURCE_BADGE = {
  ig:     { bg: '#fdf2f8', color: '#be185d' },
  fb:     { bg: '#eff6ff', color: '#1d4ed8' },
  google: { bg: '#f0fdf4', color: '#15803d' },
  tiktok: { bg: '#fdf4ff', color: '#7e22ce' },
}

function SourceBadge({ source }) {
  if (!source) return <span style={{ color: '#d1d5db' }}>—</span>
  const c = SOURCE_BADGE[source] || { bg: '#f3f4f6', color: '#374151' }
  return <Badge text={srcLabel(source)} color={c.color} bg={c.bg} />
}

function LeadDrawer({ lead, onClose }) {
  if (!lead) return null
  const date = new Date(lead.created_at)
  const info = [
    ['Nome', lead.name], ['Telefone', lead.phone], ['Email', lead.email],
    ['Cidade', lead.city], ['Empresa', lead.company], ['Segmento', lead.segment],
    ['Cargo', lead.role], ['Faturamento', lead.revenue], ['Colaboradores', lead.employees],
  ]
  const utm = [
    ['Fonte', lead.utm_source ? srcLabel(lead.utm_source) : null],
    ['Meio', lead.utm_medium], ['Campanha', lead.utm_campaign],
    ['Termo', lead.utm_term], ['Anúncio', lead.utm_content],
    ['Facebook Click ID', lead.fbclid ? 'Sim' : null],
  ]
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, background: '#fff',
        zIndex: 50, boxShadow: '-4px 0 32px rgba(0,0,0,0.1)', display: 'flex',
        flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>Dados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {info.filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                <span style={{ color: '#6b7280', flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: '#e5e7eb', margin: '16px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12 }}>Origem do Anúncio</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {utm.filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                <span style={{ color: '#6b7280', flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{val}</span>
              </div>
            ))}
            {utm.every(([, v]) => !v) && <div style={{ fontSize: 13, color: '#9ca3af' }}>Sem dados de rastreamento</div>}
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
          <a
            href={`https://wa.me/55${lead.phone?.replace(/\D/g, '')}`}
            target="_blank" rel="noreferrer"
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

// ── main dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('overview') // 'overview' | 'leads'

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    const iv = setInterval(fetchLeads, 30000)
    return () => clearInterval(iv)
  }, [fetchLeads])

  // ── computed stats ──────────────────────────────────────────────────────────

  const leadsHoje = leads.filter(l => isSameDay(l.created_at, new Date()))
  const leadsSemana = leads.filter(l => {
    const d = new Date(l.created_at)
    const ago = new Date(); ago.setDate(ago.getDate() - 7)
    return d >= ago
  })

  const days = last14Days()
  const leadsPerDay = days.map(d => ({
    name: fmtDay(d),
    Leads: leads.filter(l => isSameDay(l.created_at, d)).length,
  }))

  const sourceData = countBy(leads.filter(l => l.utm_source), 'utm_source')
    .map(({ name, value }) => ({ name: srcLabel(name), value }))

  const segmentData = countBy(leads, 'segment').slice(0, 8)
  const revenueData = countBy(leads, 'revenue').slice(0, 7)
  const mediumData = countBy(leads.filter(l => l.utm_medium), 'utm_medium')

  const withTracking = leads.filter(l => l.utm_source).length
  const trackingPct = leads.length ? Math.round(withTracking / leads.length * 100) : 0

  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    return !q || [l.name, l.phone, l.email, l.company, l.city, l.segment].some(v => v?.toLowerCase().includes(q))
  })

  // ── render ──────────────────────────────────────────────────────────────────

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        background: tab === id ? '#111827' : 'transparent',
        color: tab === id ? '#fff' : '#6b7280',
        border: 'none', borderRadius: 8, padding: '6px 16px',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
      }}
    >{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: "'Inter', -apple-system, sans-serif", WebkitFontSmoothing: 'antialiased' }}>

      {/* Navbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 3px #dcfce7' }} />
            <span style={{ fontWeight: 800, fontSize: 15 }}>Leads Dashboard</span>
            <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 4px' }} />
            <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', padding: 4, borderRadius: 10 }}>
              <TabBtn id="overview" label="Visão Geral" />
              <TabBtn id="leads" label="Leads" />
            </div>
          </div>
          <button
            onClick={fetchLeads}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#374151' }}
          >↻ Atualizar</button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <StatCard label="Total de Leads" value={loading ? '…' : leads.length} sub="desde o início" />
              <StatCard label="Hoje" value={loading ? '…' : leadsHoje.length} sub={new Date().toLocaleDateString('pt-BR', { weekday: 'long' })} accent="#2563eb" />
              <StatCard label="Últimos 7 dias" value={loading ? '…' : leadsSemana.length} sub="comparado ao total" accent="#7c3aed" />
              <StatCard label="Com Rastreamento" value={loading ? '…' : `${trackingPct}%`} sub={`${withTracking} de ${leads.length} leads`} accent="#0891b2" />
            </div>

            {/* Leads por dia */}
            <div style={{ marginBottom: 24 }}>
              <ChartCard title="Leads por Dia" sub="últimos 14 dias" height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsPerDay} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="Leads" fill="#111827" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row: Fonte + Meio */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <ChartCard title="Leads por Fonte" sub="de onde vêm os leads" height={220}>
                {sourceData.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13 }}>
                    Sem dados de rastreamento ainda
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Leads por Meio" sub="pago vs orgânico" height={220}>
                {mediumData.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13 }}>
                    Sem dados de rastreamento ainda
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mediumData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {mediumData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {/* Row: Segmento + Faturamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ChartCard title="Leads por Segmento" sub="top 8 segmentos" height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentData} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="value" name="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Leads por Faturamento" sub="distribuição de faturamento" height={260}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                    <Bar dataKey="value" name="Leads" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}

        {/* ── LEADS TAB ── */}
        {tab === 'leads' && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="Buscar nome, telefone, empresa, cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>{filtered.length} leads</span>
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
                      {['Data', 'Nome', 'Empresa', 'Cidade', 'Segmento', 'Cargo', 'Faturamento', 'Fonte', 'Campanha'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead, i) => {
                      const date = new Date(lead.created_at)
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelected(lead)}
                          style={{
                            borderTop: '1px solid #f3f4f6', cursor: 'pointer',
                            background: selected?.id === lead.id ? '#f0f9ff' : undefined,
                          }}
                          onMouseEnter={e => { if (selected?.id !== lead.id) e.currentTarget.style.background = '#f9fafb' }}
                          onMouseLeave={e => { if (selected?.id !== lead.id) e.currentTarget.style.background = '' }}
                        >
                          <td style={{ padding: '11px 16px', whiteSpace: 'nowrap', color: '#6b7280', fontSize: 12 }}>
                            <div>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                            <div>{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{lead.name}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{lead.phone}</div>
                          </td>
                          <td style={{ padding: '11px 16px', color: '#374151' }}>{lead.company || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ padding: '11px 16px', color: '#374151' }}>{lead.city || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ padding: '11px 16px', color: '#374151' }}>{lead.segment || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ padding: '11px 16px', color: '#374151' }}>{lead.role || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ padding: '11px 16px', color: '#374151', whiteSpace: 'nowrap' }}>{lead.revenue || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                          <td style={{ padding: '11px 16px' }}><SourceBadge source={lead.utm_source} /></td>
                          <td style={{ padding: '11px 16px', color: '#6b7280', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lead.utm_campaign || <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
