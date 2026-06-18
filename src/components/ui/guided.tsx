import { ReactNode } from 'react'
import { Sparkles, SlidersHorizontal, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { fmtNumber } from '../../utils/format'

// ── INTERRUPTOR Modo Simple / Modo Experto ───────────────────
export type UiMode = 'simple' | 'experto'
export function ModeSwitch({ value, onChange }: { value: UiMode; onChange: (m: UiMode) => void }) {
  const opts: { v: UiMode; label: string; icon: typeof Sparkles }[] = [
    { v: 'simple', label: 'Modo simple', icon: Sparkles },
    { v: 'experto', label: 'Modo experto', icon: SlidersHorizontal },
  ]
  return (
    <div
      className="inline-flex p-1 rounded-xl mb-6"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
    >
      {opts.map(({ v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
          style={
            value === v
              ? { background: 'var(--accent)', color: '#fff', border: 'none' }
              : { background: 'transparent', color: 'var(--muted)', border: 'none' }
          }
        >
          <Icon size={15} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  )
}

// ── CONTENEDOR DEL ASISTENTE (progreso + navegación) ─────────
interface WizardShellProps {
  step: number
  total: number
  question: string
  hint?: string
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  canNext?: boolean
  onRestart?: () => void
}
export function WizardShell({
  step,
  total,
  question,
  hint,
  children,
  onBack,
  onNext,
  nextLabel = 'Siguiente',
  canNext = true,
  onRestart,
}: WizardShellProps) {
  return (
    <div className="card p-6 mb-6">
      {/* Progreso */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          Paso {step} de {total}
        </span>
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1 text-xs cursor-pointer"
            style={{ color: 'var(--muted)', background: 'transparent', border: 'none' }}
          >
            <RotateCcw size={13} /> Empezar de nuevo
          </button>
        )}
      </div>
      <div className="h-1.5 rounded-full mb-6" style={{ background: 'var(--surface2)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(step / total) * 100}%`, background: 'var(--accent)' }}
        />
      </div>

      {/* Pregunta */}
      <h3
        className="display text-xl sm:text-2xl font-semibold mb-1"
        style={{ color: 'var(--text)' }}
      >
        {question}
      </h3>
      {hint && (
        <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      )}

      <div className="my-5">{children}</div>

      {/* Navegación */}
      <div className="flex items-center gap-3 mt-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft size={15} /> Atrás
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            className="flex items-center justify-center gap-1.5 flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              opacity: canNext ? 1 : 0.45,
            }}
          >
            {nextLabel} <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── OPCIONES GRANDES (para elegir qué calcular) ──────────────
export interface BigChoiceOption {
  value: string
  emoji: string
  label: string
  desc?: string
}
export function BigChoice({
  options,
  onPick,
}: {
  options: BigChoiceOption[]
  onPick: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className="flex items-center gap-3 text-left p-4 rounded-xl transition-all cursor-pointer hover:opacity-90"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>{o.emoji}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {o.label}
            </span>
            {o.desc && (
              <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {o.desc}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── SLIDER GRANDE con valor en vivo + entrada manual ─────────
interface BigSliderProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}
export function BigSlider({ value, onChange, min, max, step, format }: BigSliderProps) {
  return (
    <div>
      <div className="text-center mb-4">
        <span className="result-number text-3xl sm:text-4xl" style={{ color: 'var(--accent)' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        className="ui-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <div className="flex justify-between mt-1.5 text-xs mono" style={{ color: 'var(--muted)' }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

// ── CAMPO DE DINERO con separadores de miles ─────────────────
// El padre guarda el valor crudo en dígitos ("1000000"); aquí se muestra "1.000.000".
interface MoneyFieldProps {
  label: ReactNode
  value: string
  onChange: (raw: string) => void
  placeholder?: string
  prefix?: string
}
export function MoneyField({ label, value, onChange, placeholder, prefix = '$' }: MoneyFieldProps) {
  const display = value === '' || isNaN(+value) ? value : fmtNumber(+value, 0, 0)
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-medium flex items-center gap-1"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm mono"
          style={{ color: 'var(--muted)' }}
        >
          {prefix}
        </span>
        <input
          inputMode="numeric"
          className="input-field"
          style={{ paddingLeft: '1.8rem' }}
          value={display}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        />
      </div>
    </div>
  )
}
