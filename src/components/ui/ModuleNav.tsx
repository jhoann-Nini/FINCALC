import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCarryStore, MODULE_ORDER, type CarryPayload } from '../../store/carryStore'

// Hook: al montar el módulo, "recibe" los datos que dejó el módulo anterior (si hay).
// Devuelve true si llegó algo, para mostrar un aviso.
export function useCarryReceive(onReceive: (p: CarryPayload) => void) {
  const consume = useCarryStore((s) => s.consume)
  const [received, setReceived] = useState(false)
  useEffect(() => {
    const p = consume()
    if (p) {
      onReceive(p)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceived(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return received
}

// Barra para saltar al módulo anterior / siguiente llevando el cálculo hecho.
export function ModuleNav({
  current,
  buildCarry,
}: {
  current: string
  buildCarry: () => CarryPayload
}) {
  const navigate = useNavigate()
  const setCarry = useCarryStore((s) => s.set)
  const idx = MODULE_ORDER.findIndex((m) => m.path === current)
  const prev = idx > 0 ? MODULE_ORDER[idx - 1] : null
  const next = idx >= 0 && idx < MODULE_ORDER.length - 1 ? MODULE_ORDER[idx + 1] : null

  function go(to: string) {
    setCarry({ ...buildCarry(), from: current })
    navigate(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="card p-4 mt-6">
      <p className="text-xs text-center mb-3" style={{ color: 'var(--muted)' }}>
        Continúa el ejercicio en otro módulo —{' '}
        <strong style={{ color: 'var(--accent)' }}>llevamos tus datos</strong>
      </p>
      <div className="flex items-stretch gap-3">
        {prev ? (
          <button
            type="button"
            onClick={() => go(prev.path)}
            className="flex-1 flex items-center gap-2 p-3 rounded-xl text-left cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span className="min-w-0">
              <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                Módulo anterior
              </span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {prev.label}
              </span>
            </span>
          </button>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <button
            type="button"
            onClick={() => go(next.path)}
            className="flex-1 flex items-center justify-end gap-2 p-3 rounded-xl text-right cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
          >
            <span className="min-w-0">
              <span className="block text-xs" style={{ color: 'var(--muted)' }}>
                Siguiente módulo
              </span>
              <span className="block text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                {next.label}
              </span>
            </span>
            <ArrowRight size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}

export default ModuleNav
