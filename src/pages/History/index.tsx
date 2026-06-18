import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../../store/historyStore'
import { PageHeader } from '../../components/ui'
import { Trash2, RotateCcw, Clock, Filter } from 'lucide-react'

const MODULE_LABELS: Record<string, string> = {
  simple:       'Interés Simple',
  compuesto:    'Interés Compuesto',
  tasas:        'Conversión de Tasas',
  amortizacion: 'Amortización',
  anualidades:  'Anualidades',
  inflacion:    'Inflación & Tasas Reales',
  vpn:          'VPN',
  tir:          'TIR',
}

const MODULE_ROUTES: Record<string, string> = {
  simple:       '/simple',
  compuesto:    '/compuesto',
  tasas:        '/tasas',
  amortizacion: '/amortizacion',
  anualidades:  '/anualidades',
  inflacion:    '/inflacion',
}

const MODULE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  simple:       { bg: 'var(--accent-bg)',      color: 'var(--accent)',      border: 'var(--accent-border)' },
  compuesto:    { bg: 'var(--blue-bg)',         color: 'var(--blue)',        border: 'var(--blue-border)' },
  tasas:        { bg: 'var(--gold-bg)',         color: 'var(--gold)',        border: 'var(--gold-border)' },
  amortizacion: { bg: 'var(--destructive-bg)', color: 'var(--destructive)', border: 'var(--destructive-border)' },
  anualidades:  { bg: 'var(--accent-bg)',      color: 'var(--accent)',      border: 'var(--accent-border)' },
  inflacion:    { bg: 'var(--gold-bg)',         color: 'var(--gold)',        border: 'var(--gold-border)' },
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora mismo'
  if (m < 60) return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `Hace ${d}d`
  return new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function extractMainResult(result: Record<string, number | string>): { key: string; val: string } | null {
  const priority = ['F', 'P', 'payment', 'PV', 'FV', 'PMT', 'realRatePct', 'outputPct', 'realRate']
  const labels: Record<string, string> = {
    F:           'F',
    P:           'P',
    payment:     'Cuota',
    PV:          'PV',
    FV:          'FV',
    PMT:         'PMT',
    realRatePct: 'Tasa real',
    outputPct:   'Tasa',
    realRate:    'Tasa real',
  }
  for (const key of priority) {
    if (result[key] != null) {
      const v = result[key]
      const isRate = key.toLowerCase().includes('rate') || key.toLowerCase().includes('pct')
      const val = typeof v === 'number'
        ? isRate
          ? `${v.toFixed(4)}%`
          : `$${Math.round(v).toLocaleString('es-CO')}`
        : String(v)
      return { key: labels[key] ?? key, val }
    }
  }
  return null
}

export default function HistoryPage() {
  const { entries, remove, clear } = useHistoryStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string>('todos')

  const modules = ['todos', ...Array.from(new Set(entries.map(e => e.module))).filter(Boolean)]
  const filtered = filter === 'todos' ? entries : entries.filter(e => e.module === filter)

  if (entries.length === 0) {
    return (
      <div className="p-6 lg:p-12 max-w-2xl mx-auto">
        <PageHeader
          chip="Historial"
          title="Tus cálculos"
          description="Los resultados de cada calculadora se guardan aquí automáticamente."
        />
        <div
          className="rounded-xl flex flex-col items-center justify-center py-20 mt-8"
          style={{ border: '1px dashed var(--border)', color: 'var(--muted)' }}
        >
          <Clock size={32} strokeWidth={1.25} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p className="text-sm">Aún no hay cálculos guardados.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Usá cualquier calculadora y el resultado aparecerá aquí.
          </p>
          <button
            className="btn-primary mt-6"
            style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
            onClick={() => navigate('/tasas')}
          >
            Ir a calculadoras →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-12 max-w-2xl mx-auto">
      <PageHeader
        chip="Historial"
        title="Tus cálculos"
        description={`${entries.length} cálculo${entries.length !== 1 ? 's' : ''} guardado${entries.length !== 1 ? 's' : ''} en este dispositivo.`}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        {/* Filtro por módulo */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={12} style={{ color: 'var(--muted)' }} />
          {modules.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                background: filter === m ? 'var(--accent-bg)' : 'transparent',
                color:      filter === m ? 'var(--accent)' : 'var(--muted)',
                border:     filter === m ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              {m === 'todos' ? 'Todos' : (MODULE_LABELS[m] ?? m)}
            </button>
          ))}
        </div>

        {/* Limpiar */}
        <button
          onClick={() => { if (confirm('¿Eliminar todo el historial?')) clear() }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <Trash2 size={11} strokeWidth={1.75} />
          Limpiar todo
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>
          No hay cálculos de {MODULE_LABELS[filter] ?? filter} todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => {
            const mainResult = extractMainResult(entry.result)
            const colors = MODULE_COLORS[entry.module] ?? MODULE_COLORS['simple']

            return (
              <div key={entry.id} className="card p-4 flex items-start gap-4">
                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badge + tiempo */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: colors.bg,
                        color: colors.color,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {MODULE_LABELS[entry.module] ?? entry.module}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>

                  {/* Label del cálculo */}
                  {entry.label && (
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      {entry.label}
                    </p>
                  )}

                  {/* Resultado principal */}
                  {mainResult && (
                    <p
                      className="result-number"
                      style={{ color: 'var(--text)', fontSize: '1.2rem', margin: '2px 0' }}
                    >
                      <span
                        className="text-xs font-normal"
                        style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                      >
                        {mainResult.key} ={' '}
                      </span>
                      {mainResult.val}
                    </p>
                  )}

                  {/* Inputs resumidos */}
                  {entry.inputs && Object.keys(entry.inputs).length > 0 && (
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                    >
                      {Object.entries(entry.inputs)
                        .slice(0, 5)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 flex-shrink-0">
                  {MODULE_ROUTES[entry.module] && (
                    <button
                      onClick={() => navigate(MODULE_ROUTES[entry.module])}
                      title="Abrir calculadora"
                      className="p-2 rounded-lg transition-all"
                      style={{
                        color: 'var(--accent)',
                        border: '1px solid var(--accent-border)',
                        background: 'var(--accent-bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} strokeWidth={1.75} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(entry.id)}
                    title="Eliminar"
                    className="p-2 rounded-lg transition-all"
                    style={{
                      color: 'var(--muted)',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
