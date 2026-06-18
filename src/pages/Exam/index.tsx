import { useState, useEffect, useRef, useCallback } from 'react'
import { Timer, CheckCircle2, XCircle, RotateCcw, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { fmtCOP, fmtNumber } from '../../utils/format'

// ── Exercise generation (shared logic with Practice) ──────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function randomAmount(min: number, max: number, step: number) {
  return Math.round((Math.random() * (max - min) + min) / step) * step
}
function randomRate(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

interface ExamExercise {
  id: string
  modulo: string
  enunciado: string
  answer: number
  answerFormatted: string
  tolerance: number
  steps: string[]
}

function makeSimpleF(): ExamExercise {
  const P = randomAmount(500000, 8000000, 500000)
  const iPct = randomRate(0.5, 4, 1)
  const n = randomInt(3, 36)
  const I = P * (iPct / 100) * n
  const F = P + I
  return {
    id: Math.random().toString(36).slice(2),
    modulo: 'Interés Simple',
    enunciado: `Depositas ${fmtCOP(P)} al ${iPct}% mensual simple durante ${n} meses. ¿Cuánto recibes al final?`,
    answer: F, answerFormatted: fmtCOP(F), tolerance: 0.005,
    steps: [
      `F = P × (1 + i × n) = ${fmtCOP(P)} × (1 + ${iPct / 100} × ${n})`,
      `I = ${fmtCOP(I)} → F = ${fmtCOP(F)}`,
    ],
  }
}

function makeCompoundF(): ExamExercise {
  const P = randomAmount(1000000, 10000000, 500000)
  const iPct = randomRate(0.5, 3, 0.5)
  const n = randomInt(12, 48)
  const F = P * Math.pow(1 + iPct / 100, n)
  return {
    id: Math.random().toString(36).slice(2),
    modulo: 'Interés Compuesto',
    enunciado: `Inviertes ${fmtCOP(P)} al ${iPct}% mensual compuesto durante ${n} meses. ¿Cuál es el monto final?`,
    answer: F, answerFormatted: fmtCOP(F), tolerance: 0.005,
    steps: [
      `F = ${fmtCOP(P)} × (1 + ${iPct / 100})^${n}`,
      `F = ${fmtCOP(F)}`,
    ],
  }
}

function makeRateEA(): ExamExercise {
  const nmv = randomRate(18, 36, 2)
  const m = nmv / 12
  const EA = (Math.pow(1 + m / 100, 12) - 1) * 100
  return {
    id: Math.random().toString(36).slice(2),
    modulo: 'Conversión de Tasas',
    enunciado: `Una entidad financiera ofrece ${nmv}% NMV. ¿Cuál es la EA? (responde en %)`,
    answer: EA, answerFormatted: `${EA.toFixed(4)}%`, tolerance: 0.01,
    steps: [
      `i_mensual = ${nmv}% / 12 = ${m.toFixed(4)}%`,
      `EA = (1 + ${(m / 100).toFixed(6)})^12 − 1 = ${EA.toFixed(4)}%`,
    ],
  }
}

function makeAnnuityFV(): ExamExercise {
  const PMT = randomAmount(200000, 1500000, 100000)
  const iPct = randomRate(0.5, 2, 0.5)
  const n = randomInt(24, 60)
  const FV = PMT * ((Math.pow(1 + iPct / 100, n) - 1) / (iPct / 100))
  return {
    id: Math.random().toString(36).slice(2),
    modulo: 'Anualidades',
    enunciado: `Ahorras ${fmtCOP(PMT)} al final de cada mes durante ${n} meses al ${iPct}% mensual. ¿Cuál es el valor futuro (FV)?`,
    answer: FV, answerFormatted: fmtCOP(FV), tolerance: 0.005,
    steps: [
      `FV = ${fmtCOP(PMT)} × [(1 + ${iPct / 100})^${n} − 1] / ${iPct / 100}`,
      `FV = ${fmtCOP(FV)}`,
    ],
  }
}

function makeInflation(): ExamExercise {
  const nom = randomRate(10, 25, 1)
  const inf = randomRate(4, 12, 1)
  const real = ((1 + nom / 100) / (1 + inf / 100) - 1) * 100
  return {
    id: Math.random().toString(36).slice(2),
    modulo: 'Inflación',
    enunciado: `La tasa nominal de un crédito es ${nom}% anual y la inflación del año fue ${inf}%. ¿Cuál es la tasa real? (Fisher exacta, en %)`,
    answer: real, answerFormatted: `${real.toFixed(4)}%`, tolerance: 0.01,
    steps: [
      `Fórmula de Fisher: (1 + i_real) = (1 + i_nom) / (1 + π)`,
      `i_real = (1 + ${nom / 100}) / (1 + ${inf / 100}) − 1 = ${real.toFixed(4)}%`,
    ],
  }
}

function generateExamSet(count: number): ExamExercise[] {
  const factories = [makeSimpleF, makeCompoundF, makeRateEA, makeAnnuityFV, makeInflation]
  const shuffled = [...factories].sort(() => Math.random() - 0.5)
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]())
}

function parseAnswer(raw: string): number | null {
  const clean = raw.replace(/[$\s.]/g, '').replace(',', '.').replace('%', '').trim()
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}
function isCorrect(user: number, expected: number, tol: number) {
  if (expected === 0) return Math.abs(user) < 1
  return Math.abs((user - expected) / expected) <= tol
}

// ── Config ──────────────────────────────────────────────────────

const EXAM_QUESTIONS = 5
const EXAM_MINUTES = 20

// ── Components ──────────────────────────────────────────────────

type ExamPhase = 'config' | 'running' | 'review'

export default function ExamPage() {
  const [phase, setPhase] = useState<ExamPhase>('config')
  const [exercises, setExercises] = useState<ExamExercise[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXAM_MINUTES * 60)
  const [results, setResults] = useState<boolean[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startExam = useCallback(() => {
    const exs = generateExamSet(EXAM_QUESTIONS)
    setExercises(exs)
    setAnswers(new Array(EXAM_QUESTIONS).fill(''))
    setCurrent(0)
    setTimeLeft(EXAM_MINUTES * 60)
    setResults([])
    setPhase('running')
  }, [])

  useEffect(() => {
    if (phase !== 'running') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          submitExam()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function submitExam() {
    if (timerRef.current) clearInterval(timerRef.current)
    const res = exercises.map((ex, i) => {
      const val = parseAnswer(answers[i] ?? '')
      return val !== null && isCorrect(val, ex.answer, ex.tolerance)
    })
    setResults(res)
    setPhase('review')
  }

  const score = results.filter(Boolean).length
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isLowTime = timeLeft < 120

  // ── Config screen ────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <div className="p-6 lg:p-10 max-w-xl mx-auto">
        <PageHeader
          chip="Modo Examen"
          title="Simulacro de Examen"
          description={`${EXAM_QUESTIONS} preguntas de distintos módulos. Tienes ${EXAM_MINUTES} minutos. No verás la respuesta hasta terminar.`}
        />
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Preguntas', value: EXAM_QUESTIONS },
              { label: 'Tiempo', value: `${EXAM_MINUTES} min` },
              { label: 'Temas', value: '5' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold mono" style={{ color: 'var(--accent)' }}>{value}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
              </div>
            ))}
          </div>
          <div
            className="rounded-lg px-4 py-3 text-sm mb-5"
            style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}
          >
            <p><strong>Módulos incluidos:</strong> Interés Simple, Interés Compuesto, Conversión de Tasas, Anualidades, Inflación.</p>
          </div>
          <button className="btn-primary flex items-center justify-center gap-2" onClick={startExam}>
            <Timer size={16} />
            Iniciar examen
          </button>
        </div>
      </div>
    )
  }

  // ── Running screen ───────────────────────────────────────────
  if (phase === 'running') {
    const ex = exercises[current]
    return (
      <div className="p-6 lg:p-10 max-w-2xl mx-auto">
        {/* Timer bar */}
        <div
          className="fixed top-0 left-0 right-0 h-1 z-50 transition-all"
          style={{
            background: isLowTime ? 'var(--destructive)' : 'var(--accent)',
            width: `${(timeLeft / (EXAM_MINUTES * 60)) * 100}%`,
          }}
        />

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              {current + 1} / {EXAM_QUESTIONS}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{ex.modulo}</span>
          </div>
          <span
            className="mono font-bold text-lg flex items-center gap-2"
            style={{ color: isLowTime ? 'var(--destructive)' : 'var(--text)' }}
          >
            {isLowTime && <AlertTriangle size={16} />}
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>

        <div className="card p-5 mb-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', lineHeight: 1.75 }}>
            {ex.enunciado}
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Tu respuesta…"
            value={answers[current]}
            onChange={(e) => {
              const next = [...answers]
              next[current] = e.target.value
              setAnswers(next)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && current < EXAM_QUESTIONS - 1) setCurrent((c) => c + 1)
            }}
            autoFocus
          />
        </div>

        {/* Question navigator */}
        <div className="flex gap-2 flex-wrap mb-6">
          {exercises.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-9 h-9 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={
                i === current
                  ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                  : answers[i].trim()
                    ? { background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }
                    : { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' }
              }
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          {current < EXAM_QUESTIONS - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="btn-primary"
              style={{ width: 'auto' }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={submitExam}
              className="btn-primary flex items-center justify-center gap-2"
              style={{ width: 'auto', background: 'var(--accent)' }}
            >
              Finalizar examen
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Review screen ─────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{
            background: score >= 4 ? 'var(--accent-bg)' : score >= 3 ? 'var(--gold-bg)' : 'var(--destructive-bg)',
            border: `2px solid ${score >= 4 ? 'var(--accent)' : score >= 3 ? 'var(--gold)' : 'var(--destructive)'}`,
          }}
        >
          <span className="text-3xl font-bold mono" style={{ color: score >= 4 ? 'var(--accent)' : score >= 3 ? 'var(--gold)' : 'var(--destructive)' }}>
            {score}/{EXAM_QUESTIONS}
          </span>
        </div>
        <h2 className="display text-2xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
          {score >= 4 ? '¡Excelente trabajo!' : score >= 3 ? 'Buen intento' : 'Sigue practicando'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Acertaste {score} de {EXAM_QUESTIONS} preguntas.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {exercises.map((ex, i) => {
          const correct = results[i]
          const userVal = parseAnswer(answers[i] ?? '')
          return (
            <div
              key={ex.id}
              className="card p-4"
              style={{ borderLeft: `3px solid ${correct ? 'var(--accent)' : 'var(--destructive)'}` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {correct
                    ? <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
                    : <XCircle size={16} style={{ color: 'var(--destructive)' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{ex.modulo}</p>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text)' }}>{ex.enunciado}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span>Tu respuesta: <strong style={{ color: correct ? 'var(--accent)' : 'var(--destructive)' }}>
                      {userVal !== null ? fmtNumber(userVal, 2, 0) : '(sin respuesta)'}
                    </strong></span>
                    {!correct && (
                      <span>Correcta: <strong style={{ color: 'var(--accent)' }}>{ex.answerFormatted}</strong></span>
                    )}
                  </div>
                  {!correct && (
                    <div
                      className="mt-2 rounded-lg px-3 py-2 text-xs"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                    >
                      {ex.steps.map((s, j) => <p key={j}>{s}</p>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={startExam} className="btn-primary flex items-center justify-center gap-2">
        <RotateCcw size={15} />
        Nuevo examen
      </button>
    </div>
  )
}
