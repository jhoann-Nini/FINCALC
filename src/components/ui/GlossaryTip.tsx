import { useState, useRef, useEffect } from 'react'
import { GLOSSARY } from '../../lib/glossary'

// Término del glosario: se muestra como una "píldora" con subrayado punteado;
// al tocarla aparece la definición corta en un tooltip. Sin salir de la página.
export function GlossaryTip({ term, label }: { term: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const entry = GLOSSARY[term]

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!entry) return <>{label ?? term}</>

  return (
    <span ref={ref} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--accent)',
          font: 'inherit',
          textDecoration: 'underline dotted',
          textUnderlineOffset: 3,
        }}
      >
        {label ?? entry.term}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-xl p-3 text-xs"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            lineHeight: 1.6,
            boxShadow: 'var(--shadow-pop)',
            fontFamily: 'Hanken Grotesk',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 'normal',
            textAlign: 'left',
          }}
        >
          <strong style={{ color: 'var(--accent)' }}>{entry.term}</strong>
          <br />
          {entry.def}
        </span>
      )}
    </span>
  )
}

// Fila de "chips" del glosario para mostrar los conceptos clave de un módulo.
export function GlossaryChips({ terms }: { terms: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span
        className="text-xs uppercase tracking-widest mono"
        style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}
      >
        Conceptos:
      </span>
      {terms.map((t) => {
        const e = GLOSSARY[t]
        if (!e) return null
        return (
          <span
            key={t}
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <GlossaryTip term={t} />
          </span>
        )
      })}
    </div>
  )
}

export default GlossaryTip
