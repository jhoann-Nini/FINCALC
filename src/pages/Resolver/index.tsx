import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui'
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircleQuestion,
  CheckCircle2,
  Printer,
  BookmarkPlus,
} from 'lucide-react'
import { useCarryStore } from '../../store/carryStore'
import { useHistoryStore } from '../../store/historyStore'

// ── Tipos ──────────────────────────────────────────────────────────────────

type CalcType =
  | 'simple'
  | 'compuesto'
  | 'tasas'
  | 'amortizacion'
  | 'anualidades'
  | 'inflacion'
  | 'desconocido'

interface InterpretResult {
  tipo: CalcType
  confianza: number
  incognita: string
  datos: Record<string, number | null>
  params_url: string
  resumen: string
  pasos: string[]
  resultado_final: string | null
  formula_usada: string
  interpretacion: string
  preguntas_aclaratorias: string[]
}

interface ClarifyContext {
  q: string
  a: string
}

// ── Constantes ─────────────────────────────────────────────────────────────

const CALC_ROUTES: Record<CalcType, string> = {
  simple: '/simple',
  compuesto: '/compuesto',
  tasas: '/tasas',
  amortizacion: '/amortizacion',
  anualidades: '/anualidades',
  inflacion: '/inflacion',
  desconocido: '/',
}

const CALC_LABELS: Record<CalcType, string> = {
  simple: 'Interés Simple',
  compuesto: 'Interés Compuesto',
  tasas: 'Conversión de Tasas',
  amortizacion: 'Amortización',
  anualidades: 'Anualidades',
  inflacion: 'Inflación & Tasas Reales',
  desconocido: 'No determinado',
}

const EJEMPLOS = [
  'Invierto $2.000.000 al 1,8% mensual durante 18 meses con interés compuesto. ¿Cuánto tengo al final?',
  'Tengo una deuda de $15.000.000 a 24 meses con una tasa del 2% mensual vencida. ¿Cuál es la cuota fija del sistema francés?',
  'Un banco ofrece el 24% NMV. ¿Cuál es la tasa efectiva anual?',
  'Quiero ahorrar $500.000 al mes durante 3 años al 1,5% mensual. ¿Cuánto acumulo?',
  'Compré un electrodoméstico en $800.000 con un interés simple del 3% mensual a 6 meses. ¿Cuánto pago en total?',
  'La inflación del año fue del 9,28% y la tasa nominal del crédito es del 14%. ¿Cuál es la tasa real?',
]

// ── Componente de confianza ────────────────────────────────────────────────

function ConfianzaBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 80 ? 'var(--accent)' : pct >= 55 ? 'var(--gold)' : 'var(--destructive)'
  const bg =
    pct >= 80 ? 'var(--accent-bg)' : pct >= 55 ? 'var(--gold-bg)' : 'var(--destructive-bg)'
  const border =
    pct >= 80
      ? 'var(--accent-border)'
      : pct >= 55
        ? 'var(--gold-border)'
        : 'var(--destructive-border)'

  return (
    <span
      className="text-xs mono px-2 py-0.5 rounded-full"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {pct}% confianza
    </span>
  )
}

// ── Componente de pasos ────────────────────────────────────────────────────

function PasosAccordion({ pasos }: { pasos: string[] }) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium"
        style={{
          background: 'var(--surface2)',
          color: 'var(--text)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.06em' }}>
          SOLUCIÓN PASO A PASO
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="px-5 py-4" style={{ background: 'var(--surface)' }}>
          <ol className="flex flex-col gap-3">
            {pasos.map((paso, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mono"
                  style={{
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--accent-border)',
                    color: 'var(--accent)',
                    fontSize: 10,
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className="text-sm leading-relaxed pt-0.5"
                  style={{ color: 'var(--text)', fontFamily: 'Hanken Grotesk' }}
                >
                  {paso}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────

export default function ResolverPage() {
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const addHistory = useHistoryStore((s) => s.add)

  const [enunciado, setEnunciado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<InterpretResult | null>(null)
  const [clarifyContext, setClarifyContext] = useState<ClarifyContext[]>([])
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([])
  const [awaitingClarify, setAwaitingClarify] = useState(false)
  const [saved, setSaved] = useState(false)

  // Auto-resize textarea
  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setEnunciado(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  async function interpret(extraContext: ClarifyContext[] = []) {
    if (!enunciado.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setAwaitingClarify(false)

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enunciado: enunciado.trim(),
          context: [...clarifyContext, ...extraContext],
        }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setError(err.error ?? `Error HTTP ${res.status}`)
        return
      }

      const data = (await res.json()) as InterpretResult

      if (!data.tipo) {
        setError('No se pudo interpretar el enunciado. Intentá ser más específico.')
        return
      }

      setResult(data)

      // Si quedan preguntas sin responder
      if (data.preguntas_aclaratorias?.length > 0 && !data.resultado_final) {
        setClarifyAnswers(new Array(data.preguntas_aclaratorias.length).fill(''))
        setAwaitingClarify(true)
      }
    } catch {
      setError('Error de red. Verificá tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  async function submitClarifications() {
    if (!result) return
    const newContext: ClarifyContext[] = result.preguntas_aclaratorias.map((q, i) => ({
      q,
      a: clarifyAnswers[i] ?? '',
    }))
    setClarifyContext((prev) => [...prev, ...newContext])
    await interpret(newContext)
    setClarifyAnswers([])
  }

  function reset() {
    setEnunciado('')
    setResult(null)
    setError('')
    setClarifyContext([])
    setClarifyAnswers([])
    setAwaitingClarify(false)
    setTimeout(() => {
      textareaRef.current?.focus()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }, 50)
  }

  function goToCalculator() {
    if (!result || result.tipo === 'desconocido') return
    const base = CALC_ROUTES[result.tipo]
    // Preload carryStore so the calculator auto-fills the fields
    const d = result.datos
    useCarryStore.getState().set({
      amount: d.P ?? d.PV ?? d.monto ?? undefined,
      rate: d.i ?? d.tasa ?? undefined,
      periods: d.n ?? undefined,
      from: '/resolver',
    })
    const params = result.params_url?.startsWith('?') ? result.params_url : ''
    navigate(`${base}${params}`)
  }

  function saveToHistory() {
    if (!result) return
    addHistory({
      module: CALC_LABELS[result.tipo] ?? 'Resolver',
      label: result.resumen ?? enunciado.slice(0, 60),
      inputs: { enunciado: enunciado.slice(0, 100) },
      result: result.resultado_final
        ? { resultado: result.resultado_final, incognita: result.incognita }
        : {},
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function exportPDF() {
    window.print()
  }

  const canGoToCalc = result && result.tipo !== 'desconocido' && result.confianza >= 0.5

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <PageHeader
        chip="✦ Nuevo"
        title="Resolver con IA"
        description="Describí tu problema financiero en lenguaje natural. El sistema lo interpreta, identifica el tipo de cálculo y te muestra la solución paso a paso."
      />

      {/* Input principal */}
      {!result && (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="px-4 py-2.5 flex items-center gap-2"
              style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}
            >
              <Sparkles size={13} style={{ color: 'var(--accent)' }} />
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}
              >
                Enunciado del problema
              </span>
            </div>
            <div style={{ background: 'var(--surface)' }}>
              <textarea
                ref={textareaRef}
                rows={4}
                className="w-full resize-none outline-none text-sm leading-relaxed p-4"
                style={{
                  background: 'transparent',
                  color: 'var(--text)',
                  fontFamily: 'Hanken Grotesk',
                  border: 'none',
                  minHeight: 100,
                }}
                placeholder="Ej: Invierto $3.000.000 al 2% mensual durante 12 meses con interés compuesto. ¿Cuánto tengo al final?"
                value={enunciado}
                onChange={handleTextareaInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    interpret()
                  }
                }}
                disabled={loading}
              />
            </div>
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Ctrl+Enter para enviar
              </span>
              <button
                onClick={() => interpret()}
                disabled={loading || !enunciado.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: enunciado.trim() ? 'var(--accent)' : 'var(--border)',
                  color: enunciado.trim() ? '#fff' : 'var(--muted)',
                  border: 'none',
                  cursor: enunciado.trim() && !loading ? 'pointer' : 'not-allowed',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Interpretando…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Resolver
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'var(--destructive-bg)',
                border: '1px solid var(--destructive-border)',
                color: 'var(--destructive)',
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Ejemplos */}
          <div>
            <p
              className="text-xs mb-3 uppercase tracking-widest"
              style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}
            >
              Ejemplos para probar
            </p>
            <div className="flex flex-col gap-2">
              {EJEMPLOS.map((ej) => (
                <button
                  key={ej}
                  onClick={() => {
                    setEnunciado(ej)
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto'
                        textareaRef.current.style.height =
                          Math.min(textareaRef.current.scrollHeight, 200) + 'px'
                      }
                    }, 0)
                  }}
                  className="text-left text-xs px-3.5 py-2.5 rounded-lg transition-all"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    lineHeight: 1.5,
                  }}
                >
                  {ej}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="flex flex-col gap-5">
          {/* Tipo detectado + acciones */}
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CheckCircle2 size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {CALC_LABELS[result.tipo]}
                </span>
                <ConfianzaBadge value={result.confianza} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {result.resumen}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={11} />
                Nuevo
              </button>
              <button
                onClick={saveToHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: saved ? 'var(--accent-bg)' : 'transparent',
                  border: `1px solid ${saved ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: saved ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <BookmarkPlus size={11} />
                {saved ? 'Guardado' : 'Guardar'}
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all no-print"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <Printer size={11} />
                PDF
              </button>
              {canGoToCalc && (
                <button
                  onClick={goToCalculator}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Ir a la calculadora
                  <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Enunciado capturado */}
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
            }}
          >
            <p
              className="text-xs mb-1 uppercase tracking-widest"
              style={{ color: 'var(--gold)', fontFamily: 'JetBrains Mono' }}
            >
              Problema
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {enunciado}
            </p>
          </div>

          {/* Datos extraídos */}
          {Object.keys(result.datos).length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-xs mb-3 uppercase tracking-widest"
                style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}
              >
                Datos identificados
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(result.datos).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg px-3 py-2"
                    style={{ background: 'var(--surface2)' }}
                  >
                    <p
                      className="text-xs mono uppercase"
                      style={{ color: 'var(--muted)', fontSize: 10 }}
                    >
                      {k}
                    </p>
                    <p
                      className="text-sm font-semibold mono mt-0.5"
                      style={{
                        color: v !== null ? 'var(--text)' : 'var(--destructive)',
                      }}
                    >
                      {v !== null ? v : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fórmula */}
          {result.formula_usada && (
            <div
              className="rounded-lg px-4 py-3 text-sm mono overflow-x-auto"
              style={{
                background: 'var(--blue-bg)',
                border: '1px solid var(--blue-border)',
                color: 'var(--blue)',
              }}
            >
              <p
                className="text-xs mb-1 uppercase tracking-widest"
                style={{ color: 'var(--muted)', fontFamily: 'Hanken Grotesk', letterSpacing: '0.08em' }}
              >
                Fórmula aplicada
              </p>
              <span className="whitespace-nowrap">{result.formula_usada}</span>
            </div>
          )}

          {/* Preguntas aclaratorias */}
          {awaitingClarify && result.preguntas_aclaratorias.length > 0 && (
            <div
              className="rounded-xl p-4 flex flex-col gap-4"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--gold-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <MessageCircleQuestion size={15} style={{ color: 'var(--gold)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Necesito más información
                </p>
              </div>
              {result.preguntas_aclaratorias.map((q, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <label className="text-xs" style={{ color: 'var(--muted)' }}>
                    {q}
                  </label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={clarifyAnswers[i] ?? ''}
                    onChange={(e) => {
                      const next = [...clarifyAnswers]
                      next[i] = e.target.value
                      setClarifyAnswers(next)
                    }}
                    placeholder="Tu respuesta…"
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        clarifyAnswers.every((a) => a.trim())
                      ) {
                        submitClarifications()
                      }
                    }}
                  />
                </div>
              ))}
              <button
                onClick={submitClarifications}
                disabled={loading || !clarifyAnswers.every((a) => a.trim())}
                className="self-end flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    clarifyAnswers.every((a) => a.trim()) ? 'var(--accent)' : 'var(--border)',
                  color: clarifyAnswers.every((a) => a.trim()) ? '#fff' : 'var(--muted)',
                  border: 'none',
                  cursor: clarifyAnswers.every((a) => a.trim()) ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Calculando…
                  </>
                ) : (
                  'Continuar →'
                )}
              </button>
            </div>
          )}

          {/* Pasos de solución */}
          {result.pasos.length > 0 && <PasosAccordion pasos={result.pasos} />}

          {/* Resultado final */}
          {result.resultado_final && (
            <div
              className="rounded-xl p-5"
              style={{
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-border)',
              }}
            >
              <p
                className="text-xs mono uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--accent)' }}
              >
                Resultado — {result.incognita}
              </p>
              <p
                className="result-number text-3xl sm:text-4xl"
                style={{ color: 'var(--accent)' }}
              >
                {result.resultado_final}
              </p>
              {result.interpretacion && (
                <p
                  className="text-sm leading-relaxed mt-3 pt-3"
                  style={{
                    color: 'var(--text)',
                    borderTop: '1px solid var(--accent-border)',
                  }}
                >
                  💡 {result.interpretacion}
                </p>
              )}
            </div>
          )}

          {/* CTA calculadora */}
          {canGoToCalc && (
            <div
              className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                Verificá o explorá variaciones en la calculadora{' '}
                <strong style={{ color: 'var(--text)' }}>{CALC_LABELS[result.tipo]}</strong>
              </p>
              <button
                onClick={goToCalculator}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Abrir calculadora
                <ArrowRight size={11} />
              </button>
            </div>
          )}

          {/* Error (post-resultado) */}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'var(--destructive-bg)',
                border: '1px solid var(--destructive-border)',
                color: 'var(--destructive)',
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
