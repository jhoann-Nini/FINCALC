import { useState, useCallback } from 'react'
import { CheckCircle2, XCircle, RotateCcw, ChevronRight, Zap } from 'lucide-react'
import { PageHeader, Divider } from '../../components/ui'
import { useHistoryStore } from '../../store/historyStore'
import { fmtCOP, fmtNumber } from '../../utils/format'

interface Exercise {
  id: string
  modulo: string
  enunciado: string
  answer: number
  answerFormatted: string
  tolerance: number // relative, e.g. 0.01 = 1%
  steps: string[]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function randomAmount(min: number, max: number, step: number) {
  return Math.round((Math.random() * (max - min) + min) / step) * step
}
function randomRate(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function generateExercise(): Exercise {
  const tipo = randomInt(0, 3)

  if (tipo === 0) {
    // Interés Simple — Calcular F
    const P = randomAmount(500000, 10000000, 500000)
    const iPct = randomRate(0.5, 4, 1)
    const n = randomInt(3, 36)
    const I = P * (iPct / 100) * n
    const F = P + I
    return {
      id: Math.random().toString(36).slice(2),
      modulo: 'Interés Simple',
      enunciado: `Depositas ${fmtCOP(P)} en una cuenta que paga el ${iPct}% mensual con interés simple durante ${n} meses. ¿Cuánto recibes al final (monto total F)?`,
      answer: F,
      answerFormatted: fmtCOP(F),
      tolerance: 0.005,
      steps: [
        `Datos: P = ${fmtCOP(P)}, i = ${iPct}% = ${iPct / 100}, n = ${n} meses`,
        `Fórmula: F = P × (1 + i × n)`,
        `Intereses: I = ${fmtCOP(P)} × ${iPct / 100} × ${n} = ${fmtCOP(I)}`,
        `Monto final: F = ${fmtCOP(P)} + ${fmtCOP(I)} = ${fmtCOP(F)}`,
      ],
    }
  }

  if (tipo === 1) {
    // Interés Compuesto — Calcular F
    const P = randomAmount(500000, 10000000, 500000)
    const iPct = randomRate(0.5, 3, 1)
    const n = randomInt(6, 48)
    const factor = Math.pow(1 + iPct / 100, n)
    const F = P * factor
    return {
      id: Math.random().toString(36).slice(2),
      modulo: 'Interés Compuesto',
      enunciado: `Inviertes ${fmtCOP(P)} al ${iPct}% mensual con capitalización mensual durante ${n} meses. ¿Cuál es el monto final?`,
      answer: F,
      answerFormatted: fmtCOP(F),
      tolerance: 0.005,
      steps: [
        `Datos: P = ${fmtCOP(P)}, i = ${iPct}% = ${iPct / 100}, n = ${n} meses`,
        `Fórmula: F = P × (1 + i)^n`,
        `Factor: (1 + ${iPct / 100})^${n} = ${factor.toFixed(6)}`,
        `F = ${fmtCOP(P)} × ${factor.toFixed(6)} = ${fmtCOP(F)}`,
      ],
    }
  }

  if (tipo === 2) {
    // Conversión de Tasas — NMV → EA
    const nmvPct = randomRate(12, 36, 2)
    const monthlyRate = nmvPct / 12
    const EA = (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100
    return {
      id: Math.random().toString(36).slice(2),
      modulo: 'Conversión de Tasas',
      enunciado: `Un banco ofrece una tasa del ${nmvPct}% Nominal Mensual Vencida (NMV). ¿Cuál es la Tasa Efectiva Anual (EA)? Expresa el resultado en %.`,
      answer: EA,
      answerFormatted: `${EA.toFixed(4)}%`,
      tolerance: 0.01,
      steps: [
        `Tasa NMV: ${nmvPct}% anual → i_mensual = ${nmvPct}% / 12 = ${monthlyRate.toFixed(4)}%`,
        `Fórmula: EA = (1 + i_mensual/100)^12 − 1`,
        `EA = (1 + ${(monthlyRate / 100).toFixed(6)})^12 − 1`,
        `EA = ${Math.pow(1 + monthlyRate / 100, 12).toFixed(6)} − 1 = ${(EA / 100).toFixed(6)}`,
        `EA = ${EA.toFixed(4)}%`,
      ],
    }
  }

  // Anualidades — Calcular FV (valor futuro de anualidad ordinaria)
  const PMT = randomAmount(100000, 2000000, 100000)
  const iPct = randomRate(0.5, 2.5, 0.5)
  const n = randomInt(12, 60)
  const factor = (Math.pow(1 + iPct / 100, n) - 1) / (iPct / 100)
  const FV = PMT * factor
  return {
    id: Math.random().toString(36).slice(2),
    modulo: 'Anualidades',
    enunciado: `Ahorras ${fmtCOP(PMT)} al final de cada mes durante ${n} meses en una cuenta que paga el ${iPct}% mensual. ¿Cuánto acumulas al final (FV)?`,
    answer: FV,
    answerFormatted: fmtCOP(FV),
    tolerance: 0.005,
    steps: [
      `Datos: PMT = ${fmtCOP(PMT)}, i = ${iPct}% = ${iPct / 100}, n = ${n} meses`,
      `Fórmula: FV = PMT × [(1+i)^n − 1] / i`,
      `Factor: [(1 + ${iPct / 100})^${n} − 1] / ${iPct / 100} = ${factor.toFixed(4)}`,
      `FV = ${fmtCOP(PMT)} × ${factor.toFixed(4)} = ${fmtCOP(FV)}`,
    ],
  }
}

function parseAnswer(raw: string): number | null {
  const clean = raw.replace(/[$\s.]/g, '').replace(',', '.').replace('%', '').trim()
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

function isCorrect(userVal: number, expected: number, tolerance: number): boolean {
  if (expected === 0) return Math.abs(userVal) < 1
  return Math.abs((userVal - expected) / expected) <= tolerance
}

type State = 'answering' | 'correct' | 'incorrect'

export default function PracticePage() {
  const addHistory = useHistoryStore((s) => s.add)
  const [exercise, setExercise] = useState<Exercise>(() => generateExercise())
  const [userAnswer, setUserAnswer] = useState('')
  const [state, setState] = useState<State>('answering')
  const [showSteps, setShowSteps] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)

  const next = useCallback(() => {
    setExercise(generateExercise())
    setUserAnswer('')
    setState('answering')
    setShowSteps(false)
  }, [])

  function check() {
    const val = parseAnswer(userAnswer)
    if (val === null) return
    const correct = isCorrect(val, exercise.answer, exercise.tolerance)
    setState(correct ? 'correct' : 'incorrect')
    setSessionTotal((t) => t + 1)
    if (correct) setSessionCorrect((c) => c + 1)
    addHistory({
      module: exercise.modulo,
      label: `Práctica — ${correct ? 'Correcto' : 'Incorrecto'} · ${exercise.enunciado.slice(0, 60)}`,
      inputs: { respuesta_dada: val, respuesta_correcta: exercise.answer },
      result: { correcto: correct ? 'Sí' : 'No' },
    })
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <PageHeader
        chip="Modo Práctica"
        title="Práctica"
        description="Ejercicios aleatorios generados automáticamente. Resuelve, verifica y aprende del paso a paso."
      />

      {/* Score bar */}
      {sessionTotal > 0 && (
        <div
          className="rounded-xl p-3 mb-5 flex items-center gap-5"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
        >
          <div>
            <span className="text-xl font-bold mono" style={{ color: 'var(--accent)' }}>
              {sessionCorrect}
            </span>
            <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>correctos</span>
          </div>
          <div>
            <span className="text-xl font-bold mono" style={{ color: 'var(--text)' }}>
              {sessionTotal}
            </span>
            <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>intentos</span>
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(sessionCorrect / sessionTotal) * 100}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <span className="text-sm font-semibold mono" style={{ color: 'var(--accent)' }}>
            {fmtNumber((sessionCorrect / sessionTotal) * 100, 0, 0)}%
          </span>
        </div>
      )}

      {/* Exercise card */}
      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
          >
            {exercise.modulo}
          </span>
          <button
            onClick={next}
            className="ml-auto text-xs flex items-center gap-1 cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
          >
            <RotateCcw size={11} /> Otro ejercicio
          </button>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', lineHeight: 1.7 }}>
          {exercise.enunciado}
        </p>
      </div>

      {/* Answer input */}
      {state === 'answering' && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Tu respuesta (ej: 3.825.000 o 24,36%)"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') check() }}
              autoFocus
            />
            <button
              onClick={check}
              disabled={!userAnswer.trim()}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: userAnswer.trim() ? 'var(--accent)' : 'var(--border)',
                color: userAnswer.trim() ? '#fff' : 'var(--muted)',
                border: 'none',
                cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Verificar
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Ingresa el valor numérico — no necesitas escribir $ ni puntos exactos.
          </p>
        </div>
      )}

      {/* Result feedback */}
      {state !== 'answering' && (
        <div
          className="rounded-xl p-5 mb-4"
          style={{
            background: state === 'correct' ? 'var(--accent-bg)' : 'var(--destructive-bg)',
            border: `1px solid ${state === 'correct' ? 'var(--accent-border)' : 'var(--destructive-border)'}`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            {state === 'correct'
              ? <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} />
              : <XCircle size={20} style={{ color: 'var(--destructive)' }} />
            }
            <p className="font-semibold text-sm" style={{ color: state === 'correct' ? 'var(--accent)' : 'var(--destructive)' }}>
              {state === 'correct' ? '¡Correcto!' : 'Incorrecto'}
            </p>
          </div>
          {state === 'incorrect' && (
            <p className="text-sm mb-1" style={{ color: 'var(--text)' }}>
              La respuesta correcta es{' '}
              <strong style={{ color: 'var(--accent)' }}>{exercise.answerFormatted}</strong>
            </p>
          )}
          <button
            onClick={() => setShowSteps((s) => !s)}
            className="text-xs flex items-center gap-1 mt-2 cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
          >
            {showSteps ? '▲' : '▼'} Ver solución paso a paso
          </button>
        </div>
      )}

      {/* Steps */}
      {showSteps && (
        <div className="card p-4 mb-4">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
            Solución
          </p>
          <ol className="flex flex-col gap-2">
            {exercise.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                <span style={{ color: 'var(--text)', lineHeight: 1.6 }}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Next button */}
      {state !== 'answering' && (
        <button
          onClick={next}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Zap size={15} />
          Siguiente ejercicio
          <ChevronRight size={15} />
        </button>
      )}

      <Divider label="Cómo practicar bien" />
      <div className="card p-5 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
        <p>
          <strong style={{ color: 'var(--text)' }}>Tip:</strong> Intenta resolver mentalmente o en papel antes de escribir.
          Si te equivocas, lee el paso a paso completo — el error suele estar en la conversión de unidades de tiempo o tasas.
        </p>
      </div>
    </div>
  )
}
