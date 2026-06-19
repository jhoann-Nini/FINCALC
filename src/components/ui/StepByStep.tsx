import { useState } from 'react'
import { ListOrdered, ChevronDown, Sparkles, Loader2 } from 'lucide-react'
import type { CalcStep } from '../../types/finance.types'

// Bloque "Paso a paso": muestra la derivación numerada del cálculo.
// Plegable para no saturar; abierto por defecto porque es el corazón didáctico.
// Cada paso tiene un botón "Explícame con IA" que pide a Groq una explicación sencilla.
export function StepByStep({
  steps,
  defaultOpen = true,
  contexto,
}: {
  steps: CalcStep[]
  defaultOpen?: boolean
  contexto?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [explanations, setExplanations] = useState<Record<number, string>>({})
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)
  const [errorIdx, setErrorIdx] = useState<number | null>(null)
  if (!steps.length) return null

  async function explain(idx: number, step: CalcStep) {
    setLoadingIdx(idx)
    setErrorIdx(null)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paso: step, contexto: contexto ?? '' }),
      })
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setExplanations((prev) => ({ ...prev, [idx]: data.explicacion as string }))
    } catch {
      setErrorIdx(idx)
    } finally {
      setLoadingIdx(null)
    }
  }

  return (
    <div className="card overflow-hidden mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center justify-between cursor-pointer"
        style={{ background: 'var(--surface2)', border: 'none' }}
      >
        <span
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          <ListOrdered size={16} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          Cómo se resolvió, paso a paso
        </span>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--muted)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
          }}
        />
      </button>

      {open && (
        <ol className="p-5 pt-4 space-y-3" style={{ listStyle: 'none', margin: 0 }}>
          {steps.map((s, idx) => (
            <li key={idx} className="flex gap-3">
              <span
                className="flex-shrink-0 flex items-center justify-center mono text-xs font-semibold"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {s.title}
                </p>
                {s.expr && (
                  <div
                    className="mt-1.5 rounded-lg px-3 py-2 text-sm mono overflow-x-auto whitespace-nowrap"
                    style={{
                      background: 'var(--gold-bg)',
                      border: '1px solid var(--gold-border)',
                      color: 'var(--gold)',
                    }}
                  >
                    {s.expr}
                  </div>
                )}
                {s.detail && (
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
                    {s.detail}
                  </p>
                )}

                {/* Acción IA */}
                {explanations[idx] ? (
                  <div
                    className="mt-2 rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: 'var(--accent-bg)',
                      border: '1px solid var(--accent-border)',
                      color: 'var(--text)',
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      className="inline-flex items-center gap-1 font-semibold"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Sparkles size={12} strokeWidth={2} /> Explicación
                    </span>
                    <p className="mt-1" style={{ margin: '4px 0 0' }}>
                      {explanations[idx]}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => explain(idx, s)}
                    disabled={loadingIdx === idx}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                      opacity: loadingIdx === idx ? 0.6 : 1,
                    }}
                  >
                    {loadingIdx === idx ? (
                      <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} strokeWidth={2} />
                    )}
                    {loadingIdx === idx ? 'Pensando…' : 'Explícame con IA'}
                  </button>
                )}
                {errorIdx === idx && (
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--destructive)' }}>
                    No se pudo obtener la explicación. ¿El servidor de IA está activo?
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default StepByStep
