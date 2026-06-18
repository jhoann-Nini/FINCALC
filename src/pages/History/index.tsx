import { useState } from 'react'
import { Trash2, Clock, BookOpen, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useHistoryStore } from '../../store/historyStore'
import { PageHeader } from '../../components/ui'
import type { HistoryEntry } from '../../types/finance.types'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `Hace ${d} día${d > 1 ? 's' : ''}`
  if (h > 0) return `Hace ${h} hora${h > 1 ? 's' : ''}`
  if (m > 0) return `Hace ${m} min`
  return 'Ahora mismo'
}

function EntryCard({ entry, onRemove }: { entry: HistoryEntry; onRemove: () => void }) {
  const [open, setOpen] = useState(false)

  const inputEntries = Object.entries(entry.inputs).filter(([, v]) => v !== null && v !== '')
  const resultEntries = Object.entries(entry.result).filter(([, v]) => v !== null && v !== '')

  return (
    <div
      className="card overflow-hidden"
      style={{ borderLeft: '3px solid var(--accent)' }}
    >
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        style={{ userSelect: 'none' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
              }}
            >
              {entry.module}
            </span>
          </div>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
            {entry.label}
          </p>
          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted)' }}>
            <Clock size={10} />
            {timeAgo(entry.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
          {open ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />}
        </div>
      </div>

      {open && (
        <div
          className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}
        >
          {inputEntries.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                Datos de entrada
              </p>
              <div className="flex flex-col gap-1.5">
                {inputEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span className="mono font-medium" style={{ color: 'var(--text)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resultEntries.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                Resultado
              </p>
              <div className="flex flex-col gap-1.5">
                {resultEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const { entries, remove, clear } = useHistoryStore()

  const modules = [...new Set(entries.map((e) => e.module))]
  const [filter, setFilter] = useState<string>('Todos')

  const filtered = filter === 'Todos' ? entries : entries.filter((e) => e.module === filter)

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <PageHeader
        chip="Historial"
        title="Mis Ejercicios"
        description="Todos los cálculos que has realizado en la app, guardados automáticamente para que puedas revisarlos después."
      />

      {entries.length === 0 ? (
        <div
          className="card p-10 flex flex-col items-center gap-4 text-center"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
          >
            <BookOpen size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              No hay ejercicios guardados
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Resuelve un cálculo en cualquier calculadora o en el Resolver con IA para verlos aquí.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filters + clear button */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {['Todos', ...modules].map((m) => (
                <button
                  key={m}
                  onClick={() => setFilter(m)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
                  style={
                    filter === m
                      ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                      : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }
                  }
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={clear}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              style={{
                background: 'var(--destructive-bg)',
                border: '1px solid var(--destructive-border)',
                color: 'var(--destructive)',
              }}
            >
              <RotateCcw size={11} />
              Limpiar todo
            </button>
          </div>

          {/* Stats bar */}
          <div
            className="rounded-xl p-3 mb-5 flex items-center gap-4 flex-wrap"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold mono" style={{ color: 'var(--accent)' }}>{entries.length}</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>ejercicios</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold mono" style={{ color: 'var(--text)' }}>{modules.length}</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>módulos</span>
            </div>
          </div>

          {/* Entry list */}
          <div className="flex flex-col gap-3">
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onRemove={() => remove(entry.id)} />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
                No hay ejercicios para este módulo.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
