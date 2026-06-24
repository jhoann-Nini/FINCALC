import { useState, useEffect, ReactNode, useRef } from 'react'
import { formatMoneyInput, parseMoneyInput } from '../../utils/format'

interface FieldProps {
  label: ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  unit?: string
  disabled?: boolean
  error?: string
  hint?: string
  type?: 'number' | 'text'
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  unit,
  disabled,
  error,
  hint,
  type = 'number',
}: FieldProps) {
  const isMoney = unit === '$'
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isMoney) {
      onChange(e.target.value)
      return
    }

    const rawValue = e.target.value
    const rawCursorPos = e.target.selectionStart || 0

    // Clean value (only digits)
    const cleanValue = parseMoneyInput(rawValue)

    // Format the clean value
    const formattedValue = formatMoneyInput(cleanValue)

    // Count digits up to the cursor position in the raw value
    let digitsBeforeCursor = 0
    for (let i = 0; i < rawCursorPos; i++) {
      if (/\d/.test(rawValue[i])) {
        digitsBeforeCursor++
      }
    }

    // Find where that digit count lands in the new formatted value
    let newCursorPos = 0
    let digitsCount = 0
    for (let i = 0; i < formattedValue.length; i++) {
      if (digitsCount === digitsBeforeCursor) {
        newCursorPos = i
        break
      }
      if (/\d/.test(formattedValue[i])) {
        digitsCount++
      }
      if (i === formattedValue.length - 1) {
        newCursorPos = formattedValue.length
      }
    }

    // Notify parent with clean value
    onChange(cleanValue)

    // Set selection range after state update / render
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const displayValue = isMoney ? formatMoneyInput(value) : value

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={isMoney ? 'text' : type}
          inputMode={isMoney ? 'numeric' : undefined}
          className="input-field pr-12"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          min={isMoney ? undefined : 0}
          step={isMoney ? undefined : "any"}   // ← línea nueva
          style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
        />
        {unit && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs mono"
            style={{ color: 'var(--muted)' }}
          >
            {unit}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ── SELECT ───────────────────────────────────────────────────
interface SelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}
export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <select className="select-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── MODE TABS ─────────────────────────────────────────────────
interface ModeTabsProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}
export function ModeTabs({ options, value, onChange }: ModeTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-all duration-150 touch-manipulation cursor-pointer"
          style={
            value === o.value
              ? {
                  background: 'var(--accent-bg)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                  fontFamily: 'Hanken Grotesk',
                }
              : {
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  fontFamily: 'Hanken Grotesk',
                }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── RESULT CARD ───────────────────────────────────────────────
interface ResultCardProps {
  label: string
  value: string
  accent?: boolean
  sub?: { label: string; value: string }[]
  narrative?: ReactNode
}
export function ResultCard({ label, value, accent, sub, narrative }: ResultCardProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div
      className="rounded-xl p-5 transition-all duration-300"
      style={{
        background: accent ? 'var(--accent-bg)' : 'var(--surface2)',
        border: `1px solid ${accent ? 'var(--accent-border)' : 'var(--border)'}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      <p
        className="text-xs mono uppercase tracking-widest mb-1"
        style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}
      >
        {label}
      </p>
      <p
        className="result-number text-2xl sm:text-3xl"
        style={{
          color: accent ? 'var(--accent)' : 'var(--text)',
          overflowWrap: 'anywhere',
          minWidth: 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <div
          className="mt-4 pt-4 grid grid-cols-2 gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {sub.map((s) => (
            <div key={s.label}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {s.label}
              </p>
              <p className="text-sm font-medium mono mt-0.5" style={{ color: 'var(--text)' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}
      {narrative && (
        <p
          className="text-sm mt-4 pt-4"
          style={{
            color: accent ? 'var(--text)' : 'var(--muted)',
            borderTop: '1px solid var(--border)',
            lineHeight: 1.6,
          }}
        >
          {narrative}
        </p>
      )}
    </div>
  )
}

// ── FORMULA BOX ───────────────────────────────────────────────
export function FormulaBox({ formula, title }: { formula: string; title?: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm mono overflow-x-auto"
      style={{
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-border)',
        color: 'var(--gold)',
      }}
    >
      {title && (
        <p
          className="text-xs uppercase tracking-widest mb-1.5"
          style={{ color: 'var(--muted)', fontFamily: 'Hanken Grotesk', letterSpacing: '0.08em' }}
        >
          {title}
        </p>
      )}
      <span className="whitespace-nowrap">{formula}</span>
    </div>
  )
}

// ── PAGE HEADER ───────────────────────────────────────────────
interface PageHeaderProps {
  chip: string
  title: string
  description: string
}
export function PageHeader({ chip, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <span className="section-chip mb-4 inline-flex">{chip}</span>
      <div
        style={{
          borderLeft: '3px solid var(--accent)',
          paddingLeft: '0.875rem',
          marginBottom: '0.625rem',
        }}
      >
        <h1
          className="display text-3xl lg:text-4xl font-semibold"
          style={{ color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}
        >
          {title}
        </h1>
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--muted)', maxWidth: '54ch', marginTop: '0.5rem' }}
      >
        {description}
      </p>
    </div>
  )
}

// ── CALLOUT ───────────────────────────────────────────────────
export function Callout({
  children,
  color = 'blue',
}: {
  children: ReactNode
  color?: 'blue' | 'accent' | 'gold'
}) {
  const styles = {
    blue: { bg: 'var(--blue-bg)', border: 'var(--blue-border)', text: 'var(--blue)' },
    accent: { bg: 'var(--accent-bg)', border: 'var(--accent-border)', text: 'var(--accent)' },
    gold: { bg: 'var(--gold-bg)', border: 'var(--gold-border)', text: 'var(--gold)' },
  }
  const s = styles[color]
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm leading-relaxed mb-5"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      {children}
    </div>
  )
}

// ── DIVIDER ───────────────────────────────────────────────────
export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span
        className="text-xs mono uppercase tracking-widest px-2"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

// ── ERROR BOX ─────────────────────────────────────────────────
export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm mt-3"
      style={{
        background: 'var(--destructive-bg)',
        border: '1px solid var(--destructive-border)',
        color: 'var(--destructive)',
      }}
    >
      ⚠ {message}
    </div>
  )
}

export { default as CashFlowDiagram } from './CashFlowDiagram'
export { InfoTip } from './InfoTip'
export { GlossaryTip, GlossaryChips } from './GlossaryTip'
export { MicroQuiz } from './MicroQuiz'
export { StepByStep } from './StepByStep'
export { ModuleNav, useCarryReceive } from './ModuleNav'
export {
  ModeSwitch,
  WizardShell,
  BigChoice,
  BigSlider,
  MoneyField,
  type UiMode,
  type BigChoiceOption,
} from './guided'
