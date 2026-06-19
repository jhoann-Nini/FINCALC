import { Link } from 'react-router-dom'
import { FormulaBox } from '../../components/ui'

export default function NotFoundPage() {
  return (
    <div
      className="p-6 lg:p-12 max-w-2xl mx-auto flex flex-col"
      style={{ minHeight: '75vh', justifyContent: 'center' }}
    >
      <span
        className="mono text-xs mb-8"
        style={{ color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        Error · 404
      </span>

      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <span
          className="display"
          style={{
            fontSize: 'clamp(5rem, 20vw, 9rem)',
            lineHeight: 1,
            color: 'var(--text)',
            opacity: 0.08,
            fontWeight: 600,
            display: 'block',
            userSelect: 'none',
          }}
        >
          404
        </span>
      </div>

      <h2
        style={{
          fontFamily: 'Hanken Grotesk, sans-serif',
          fontSize: '1.4rem',
          fontWeight: 600,
          color: 'var(--text)',
          margin: '0 0 0.5rem',
        }}
      >
        Ruta no encontrada
      </h2>
      <p
        style={{
          color: 'var(--muted)',
          marginBottom: '1.75rem',
          maxWidth: '36ch',
          lineHeight: 1.7,
        }}
      >
        Esta dirección no existe en el sistema. Verificá el URL o volvé al inicio.
      </p>

      <FormulaBox formula="f(ruta) → undefined" />

      <Link
        to="/"
        className="inline-flex items-center gap-2 mt-8"
        style={{
          color: 'var(--muted)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontFamily: 'JetBrains Mono, monospace',
          width: 'fit-content',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
