import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../../store/historyStore'
import { PageHeader } from '../../components/ui'
import { Trash2, RotateCcw, Clock, Filter, Download, Upload } from 'lucide-react'

const MODULE_ROUTES: Record<string, string> = {
  'Interés Simple':           '/simple',
  'Interés Compuesto':        '/compuesto',
  'Conversión de Tasas':      '/tasas',
  'Amortización':             '/amortizacion',
  'Anualidades':              '/anualidades',
  'Inflación & Tasas Reales': '/inflacion',
  'VPN / TIR':                '/vpntir',
}

const MODULE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Interés Simple':           { bg: 'var(--accent-bg)',  color: 'var(--accent)',      border: 'var(--accent-border)' },
  'Interés Compuesto':        { bg: 'var(--gold-bg)',    color: 'var(--gold)',         border: 'var(--gold-border)' },
  'Conversión de Tasas':      { bg: 'var(--accent-bg)',  color: 'var(--accent)',      border: 'var(--accent-border)' },
  'Amortización':             { bg: 'var(--gold-bg)',    color: 'var(--gold)',         border: 'var(--gold-border)' },
  'Anualidades':              { bg: 'var(--accent-bg)',  color: 'var(--accent)',      border: 'var(--accent-border)' },
  'Inflación & Tasas Reales': { bg: 'var(--gold-bg)',    color: 'var(--gold)',         border: 'var(--gold-border)' },
  'VPN / TIR':                { bg: 'var(--accent-bg)',  color: 'var(--accent)',      border: 'var(--accent-border)' },
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
  const priority = ['F', 'VPN', 'FV', 'PV', 'PMT', 'cuota', 'tasa_real', 'EA', 'P']
  const labels: Record<string, string> = {
    F:          'F',
    VPN:        'VPN',
    FV:         'FV',
    PV:         'PV',
    PMT:        'PMT',
    cuota:      'Cuota',
    tasa_real:  'Tasa real',
    EA:         'Tasa EA',
    P:          'P',
  }
  for (const key of priority) {
    if (result[key] != null) {
      const v = result[key]
      const isRate = key.toLowerCase().includes('rate') || key.toLowerCase().includes('pct') || key === 'EA' || key === 'tasa_real'
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
  const { entries, remove, clear, importEntries } = useHistoryStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string>('todos')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modules = ['todos', ...Array.from(new Set(entries.map((e) => e.module))).filter(Boolean)]
  const filtered = filter === 'todos' ? entries : entries.filter((e) => e.module === filter)

  function handleExport() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finametrics-historial-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const arr = Array.isArray(parsed) ? parsed : parsed?.entries
        const added = importEntries(arr ?? [], 'merge')
        alert(
          added > 0
            ? `Se importaron ${added} cálculo${added !== 1 ? 's' : ''} nuevo${added !== 1 ? 's' : ''}.`
            : 'No se agregaron cálculos nuevos (ya estaban o el archivo estaba vacío).'
        )
      } catch {
        alert('No se pudo leer el archivo. Asegurate de que sea un JSON de historial válido.')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // permite reimportar el mismo archivo
  }

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
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
              onClick={() => navigate('/tasas')}
            >
              Ir a calculadoras →
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-[10px] transition-all"
              style={{ color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <Upload size={13} strokeWidth={1.75} />
              Importar respaldo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={12} style={{ color: 'var(--muted)' }} />
          {modules.map((m) => (
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
              {m === 'todos' ? 'Todos' : m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
            title="Descargar el historial como archivo JSON (respaldo)"
          >
            <Download size={11} strokeWidth={1.75} />
            Exportar
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
            title="Importar cálculos desde un archivo JSON exportado"
          >
            <Upload size={11} strokeWidth={1.75} />
            Importar
          </button>
          <button
            onClick={() => { if (confirm('¿Eliminar todo el historial?')) clear() }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <Trash2 size={11} strokeWidth={1.75} />
            Limpiar todo
          </button>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>
          No hay cálculos de {filter} todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => {
            const mainResult = extractMainResult(entry.result)
            const colors = MODULE_COLORS[entry.module] ?? MODULE_COLORS['Interés Simple']

            return (
              <div key={entry.id} className="card p-4 flex items-start gap-4">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: colors.bg,
                        color:      colors.color,
                        border:     `1px solid ${colors.border}`,
                      }}
                    >
                      {entry.module}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {timeAgo(entry.timestamp)}
                    </span>
                  </div>

                  {entry.label && (
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                      {entry.label}
                    </p>
                  )}

                  {mainResult && (
                    <p className="result-number" style={{ color: 'var(--text)', fontSize: '1.2rem', margin: '2px 0' }}>
                      <span
                        className="text-xs font-normal"
                        style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono', fontSize: 10 }}
                      >
                        {mainResult.key} ={' '}
                      </span>
                      {mainResult.val}
                    </p>
                  )}

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
