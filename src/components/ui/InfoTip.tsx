import { useState, useRef, useEffect, ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

// Ícono ⓘ que al tocarlo muestra una explicación en lenguaje sencillo.
// Pensado para que cualquier persona entienda los términos técnicos.
export function InfoTip({
  children,
  label = '¿Qué significa?',
}: {
  children: ReactNode
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center cursor-pointer"
        style={{ color: 'var(--muted)', background: 'transparent', border: 'none', padding: 2 }}
      >
        <HelpCircle size={15} strokeWidth={2} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 rounded-xl p-3 text-xs"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            lineHeight: 1.6,
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
            fontFamily: 'DM Sans',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 'normal',
          }}
        >
          {children}
        </span>
      )}
    </span>
  )
}

export default InfoTip
