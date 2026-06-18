import { useState } from 'react'
import { ListOrdered, ChevronDown } from 'lucide-react'
import type { CalcStep } from '../../types/finance.types'

// Bloque "Paso a paso": muestra la derivación numerada del cálculo.
// Plegable para no saturar; abierto por defecto porque es el corazón didáctico.
export function StepByStep({
  steps,
  defaultOpen = true,
}: {
  steps: CalcStep[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (!steps.length) return null

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
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default StepByStep
