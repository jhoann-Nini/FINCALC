import { BarChart2, BookOpen, Zap, Clock, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PageHeader } from '../../components/ui'
import { useHistoryStore } from '../../store/historyStore'
import type { HistoryEntry } from '../../types/finance.types'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `Hace ${d}d`
  if (h > 0) return `Hace ${h}h`
  if (m > 0) return `Hace ${m}min`
  return 'Ahora'
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof BarChart2
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className="card p-5"
      style={accent ? { borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' } : {}}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: accent ? 'var(--accent)' : 'var(--surface2)', border: '1px solid var(--border)' }}
        >
          <Icon size={16} style={{ color: accent ? '#fff' : 'var(--accent)' }} />
        </div>
      </div>
      <p className="text-3xl font-bold mono mb-1" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {label}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card p-10 flex flex-col items-center gap-4 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
      >
        <TrendingUp size={24} style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
          Aún no hay datos de progreso
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Resuelve ejercicios en las calculadoras o usa el Resolver con IA para ver tu actividad aquí.
        </p>
      </div>
    </div>
  )
}

function getModuleStats(entries: HistoryEntry[]) {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    counts[e.module] = (counts[e.module] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count)
}

function getDailyActivity(entries: HistoryEntry[], days = 7) {
  const now = Date.now()
  return Array.from({ length: days }, (_, i) => {
    const dayStart = now - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const label = new Date(dayStart).toLocaleDateString('es-CO', { weekday: 'short' })
    const count = entries.filter((e) => e.timestamp >= dayStart && e.timestamp < dayEnd).length
    return { day: label, ejercicios: count }
  })
}

const MODULE_COLORS = [
  'var(--accent)',
  'var(--chart-2)',
  'var(--gold)',
  'var(--destructive)',
  'var(--accent-soft)',
  'var(--blue)',
]

export default function DashboardPage() {
  const entries = useHistoryStore((s) => s.entries)

  if (entries.length === 0) {
    return (
      <div className="p-6 lg:p-10 max-w-3xl mx-auto">
        <PageHeader
          chip="Mi Progreso"
          title="Dashboard"
          description="Visualiza tu actividad, módulos más practicados y evolución en el tiempo."
        />
        <EmptyState />
      </div>
    )
  }

  const moduleStats = getModuleStats(entries)
  const dailyActivity = getDailyActivity(entries)
  const topModule = moduleStats[0]
  const totalToday = dailyActivity[dailyActivity.length - 1]?.ejercicios ?? 0
  const streak = (() => {
    let s = 0
    for (let i = dailyActivity.length - 1; i >= 0; i--) {
      if (dailyActivity[i].ejercicios > 0) s++
      else break
    }
    return s
  })()

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader
        chip="Mi Progreso"
        title="Dashboard"
        description="Tu actividad, módulos más practicados y evolución en el tiempo."
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          icon={BookOpen}
          label="Ejercicios totales"
          value={entries.length}
          sub="Desde el inicio"
          accent
        />
        <StatCard
          icon={Zap}
          label="Hoy"
          value={totalToday}
          sub="ejercicios resueltos"
        />
        <StatCard
          icon={Clock}
          label="Racha"
          value={`${streak}d`}
          sub="días seguidos"
        />
        <StatCard
          icon={TrendingUp}
          label="Módulo top"
          value={topModule ? topModule.count : 0}
          sub={topModule?.module ?? '—'}
        />
      </div>

      {/* Daily activity chart */}
      <div className="card p-5 mb-6">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
          Actividad — Últimos 7 días
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dailyActivity} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="day" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--chart-tick)', fontSize: 10 }}
              width={24}
            />
            <Tooltip
              contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`${v} ejercicios`, '']}
            />
            <Bar dataKey="ejercicios" radius={[4, 4, 0, 0]}>
              {dailyActivity.map((_, i) => (
                <Cell key={i} fill={i === dailyActivity.length - 1 ? 'var(--accent)' : 'var(--border)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Module breakdown */}
      <div className="card p-5 mb-6">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
          Ejercicios por módulo
        </p>
        <div className="flex flex-col gap-3">
          {moduleStats.map(({ module, count }, i) => {
            const pct = Math.round((count / entries.length) * 100)
            return (
              <div key={module}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{module}</span>
                  <span className="text-xs mono" style={{ color: 'var(--muted)' }}>{count} · {pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: MODULE_COLORS[i % MODULE_COLORS.length] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Actividad reciente
          </p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {entries.slice(0, 8).map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                <BookOpen size={13} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{e.label}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{e.module}</p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
                {timeAgo(e.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
