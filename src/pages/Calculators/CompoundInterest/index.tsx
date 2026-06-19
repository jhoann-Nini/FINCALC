import { useState } from 'react'
import {
  PageHeader,
  Field,
  Select,
  ModeTabs,
  ResultCard,
  FormulaBox,
  Callout,
  Divider,
  ErrorBox,
  CashFlowDiagram,
  InfoTip,
  GlossaryChips,
  MicroQuiz,
  StepByStep,
  ModuleNav,
  useCarryReceive,
  ModeSwitch,
  WizardShell,
  BigChoice,
  BigSlider,
  MoneyField,
  type UiMode,
  type BigChoiceOption,
} from '../../../components/ui'
import { useHistoryStore } from '../../../store/historyStore'
import {
  calcCompF,
  calcCompP,
  calcCompI,
  calcCompN,
  buildCompoundSteps,
} from '../../../lib/compoundInterest'
import { narrateGrowth } from '../../../lib/narrative'
import { fmtCOP, fmtPct, fmtNumber, fmtPctShort } from '../../../utils/format'
import type { CompoundResult } from '../../../types/finance.types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Mode = 'F' | 'P' | 'i' | 'n'

const MODES = [
  { value: 'F', label: 'Valor Futuro (F)' },
  { value: 'P', label: 'Valor Presente (P)' },
  { value: 'i', label: 'Calcular i (tasa de interés)' },
  { value: 'n', label: 'Períodos (n)' },
]

const PERIODS = [
  { value: 'día', label: 'Días' },
  { value: 'semana', label: 'Semanas' },
  { value: 'quincena', label: 'Quincenas' },
  { value: 'mes', label: 'Meses' },
  { value: 'bimestre', label: 'Bimestres' },
  { value: 'trimestre', label: 'Trimestres' },
  { value: 'cuatrimestre', label: 'Cuatrimestres' },
  { value: 'semestre', label: 'Semestres' },
  { value: 'año', label: 'Años' },
]

// Períodos por año — para conversión efectiva de tasas (interés compuesto)
const PERIOD_FREQ: Record<string, number> = {
  día: 365,
  semana: 52,
  quincena: 24,
  mes: 12,
  bimestre: 6,
  trimestre: 4,
  cuatrimestre: 3,
  semestre: 2,
  año: 1,
}

const PERIOD_RATE_LABEL: Record<string, string> = {
  día: 'diaria',
  semana: 'semanal',
  quincena: 'quincenal',
  mes: 'mensual',
  bimestre: 'bimestral',
  trimestre: 'trimestral',
  cuatrimestre: 'cuatrimestral',
  semestre: 'semestral',
  año: 'anual',
}

const PERIOD_N_LABEL: Record<string, string> = {
  día: 'días',
  semana: 'semanas',
  quincena: 'quincenas',
  mes: 'meses',
  bimestre: 'bimestres',
  trimestre: 'trimestres',
  cuatrimestre: 'cuatrimestres',
  semestre: 'semestres',
  año: 'años',
}

function friendlyError(msg: string): string {
  if (/F debe ser mayor que P/i.test(msg))
    return 'El valor final debe ser mayor que el inicial. Revisa los datos 🙂'
  if (/positivos/i.test(msg)) return 'Usa números positivos para el capital y el valor futuro 🙂'
  if (/no puede ser 0/i.test(msg)) return 'Ese campo no puede ser 0. Prueba con otro número 🙂'
  return msg
}

function runCalc(m: Mode, v: { P: number; F: number; iPct: number; n: number }): CompoundResult {
  if (m === 'F') return calcCompF(v.P, v.iPct, v.n)
  if (m === 'P') return calcCompP(v.F, v.iPct, v.n)
  if (m === 'i') return calcCompI(v.P, v.F, v.n)
  return calcCompN(v.P, v.F, v.iPct)
}

// ── Configuración del asistente (modo simple) ────────────────
const money0 = (v: number) => `$ ${fmtNumber(v, 0, 0)}`

const CHOICES: BigChoiceOption[] = [
  {
    value: 'F',
    emoji: '🚀',
    label: '¿Cuánto tendré al final?',
    desc: 'Pongo una cantidad hoy y la dejo crecer con capitalización.',
  },
  {
    value: 'P',
    emoji: '🎯',
    label: '¿Cuánto debo poner hoy?',
    desc: 'Sé la meta futura y quiero saber con cuánto empezar.',
  },
  {
    value: 'i',
    emoji: '📈',
    label: '¿Qué tasa necesito?',
    desc: 'Sé el inicio y la meta, quiero saber el interés.',
  },
  {
    value: 'n',
    emoji: '⏳',
    label: '¿Cuánto tiempo necesito?',
    desc: 'Quiero saber en cuántos meses llego a la meta.',
  },
]

type FieldKey = 'P' | 'F' | 'i' | 'n'
const WIZ_FIELDS: Record<Mode, FieldKey[]> = {
  F: ['P', 'i', 'n'],
  P: ['F', 'i', 'n'],
  i: ['P', 'F', 'n'],
  n: ['P', 'F', 'i'],
}
const SLIDER: Record<
  FieldKey,
  {
    q: string
    hint: string
    min: number
    max: number
    step: number
    fmt: (v: number) => string
    init: number
  }
> = {
  P: {
    q: '¿Cuánta plata pones hoy?',
    hint: 'El capital o valor presente.',
    min: 100000,
    max: 50000000,
    step: 100000,
    fmt: money0,
    init: 5000000,
  },
  F: {
    q: '¿A cuánto quieres llegar?',
    hint: 'El valor futuro que esperas tener.',
    min: 100000,
    max: 100000000,
    step: 100000,
    fmt: money0,
    init: 8000000,
  },
  i: {
    q: '¿Cuánto crece cada mes?',
    hint: 'La tasa efectiva mensual, en porcentaje.',
    min: 0.1,
    max: 10,
    step: 0.1,
    fmt: fmtPctShort,
    init: 1.8,
  },
  n: {
    q: '¿Por cuántos meses?',
    hint: 'El tiempo que dejas crecer el dinero.',
    min: 1,
    max: 60,
    step: 1,
    fmt: (v) => `${v} ${v === 1 ? 'mes' : 'meses'}`,
    init: 24,
  },
}

export default function CompoundInterestPage() {
  const addHistory = useHistoryStore((s) => s.add)
  const [uiMode, setUiMode] = useState<UiMode>('simple')
  const [mode, setMode] = useState<Mode>('F')
  const [P, setP] = useState('5000000')
  const [iPct, setIPct] = useState('1.8')
  const [n, setN] = useState('24')
  const [F, setF] = useState('')
  const [period, setPeriod] = useState('mes')
  const [result, setResult] = useState<CompoundResult | null>(null)
  const [error, setError] = useState('')

  // Estado del asistente (modo simple)
  const [wizMode, setWizMode] = useState<Mode | null>(null)
  const [wizStep, setWizStep] = useState(0)
  const [wizVals, setWizVals] = useState({
    P: SLIDER.P.init,
    F: SLIDER.F.init,
    i: SLIDER.i.init,
    n: SLIDER.n.init,
  })

  const [carriedLabel, setCarriedLabel] = useState<string | null>(null)

  const carried = useCarryReceive((p) => {
    setUiMode('experto')
    if (p.rateLabel) setCarriedLabel(p.rateLabel)
    const np = p.amount != null ? String(Math.round(p.amount)) : P
    const ni = p.rate != null ? String(+p.rate.toFixed(6)) : iPct
    const nn = p.periods != null ? String(Math.round(p.periods)) : n
    setMode('F')
    setP(np)
    setIPct(ni)
    setN(nn)
    try {
      setResult(calcCompF(+np, +ni, +nn))
    } catch {
      /* noop */
    }
  })

  function resetAll() {
    setResult(null)
    setError('')
    setWizMode(null)
    setWizStep(0)
  }
  function switchUiMode(m: UiMode) {
    setUiMode(m)
    resetAll()
  }

  function handlePeriodChange(newPeriod: string) {
    const parsed = parseFloat(iPct)
    if (parsed > 0 && !isNaN(parsed)) {
      const oldFreq = PERIOD_FREQ[period]
      const newFreq = PERIOD_FREQ[newPeriod]
      const i_old = parsed / 100
      const i_new = Math.pow(1 + i_old, oldFreq / newFreq) - 1
      setIPct(parseFloat((i_new * 100).toFixed(6)).toString())
    }
    setPeriod(newPeriod)
    setResult(null)
    setError('')
  }

  function calculate() {
    setError('')
    try {
      const r = runCalc(mode, { P: +P, F: +F, iPct: +iPct, n: +n })
      setResult(r)
      addHistory({
        module: 'Interés Compuesto',
        label: `Calcular ${mode} — P=${fmtCOP(r.P)}, i=${fmtPct(+iPct, 2)}, n=${r.n}`,
        inputs: { P: r.P, i: +iPct, n: r.n, mode },
        result: { F: r.F, I: r.I },
      })
    } catch (e: any) {
      setError(friendlyError(e.message))
    }
  }

  function loadExample() {
    setUiMode('experto')
    setMode('F')
    setPeriod('mes')
    setP('5000000')
    setIPct('1.8')
    setN('24')
    setF('')
    setError('')
    try {
      setResult(calcCompF(5000000, 1.8, 24))
    } catch {
      /* noop */
    }
  }

  function pickWhat(value: string) {
    const m = value as Mode
    setWizMode(m)
    setWizVals({ P: SLIDER.P.init, F: SLIDER.F.init, i: SLIDER.i.init, n: SLIDER.n.init })
    setWizStep(1)
    setError('')
  }
  function wizBack() {
    if (wizStep <= 1) {
      setWizMode(null)
      setWizStep(0)
    } else {
      setWizStep((s) => s - 1)
    }
  }
  function wizNext() {
    if (!wizMode) return
    const fields = WIZ_FIELDS[wizMode]
    if (wizStep < fields.length) {
      setWizStep((s) => s + 1)
      return
    }
    try {
      const res = runCalc(wizMode, { P: wizVals.P, F: wizVals.F, iPct: wizVals.i, n: wizVals.n })
      setMode(wizMode)
      setPeriod('mes')
      setResult(res)
      setError('')
    } catch (e: any) {
      setError(friendlyError(e.message))
    }
  }

  const chartData =
    result?.series.map((s) => ({
      n: s.period,
      'Interés Compuesto': Math.round(s.balance),
      'Interés Simple': Math.round(s.interestSimple),
    })) ?? []

  const rateLabel = `Tasa de interés ${PERIOD_RATE_LABEL[period]} (i)`
  const nLabel = `Número de ${PERIOD_N_LABEL[period]} n`
  const nUnit = PERIOD_N_LABEL[period]

  function downloadExcel() {
    import('xlsx').then((XLSX) => {
      const data = result!.series.map((s, idx) => {
        const initBalance = idx === 0 ? result!.P : result!.series[idx - 1].balance
        return {
          '#': s.period,
          'Saldo inicial': initBalance,
          'Interés del período': s.balance - initBalance,
          'Saldo final': s.balance,
        }
      })
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Interés Compuesto')
      XLSX.writeFile(wb, 'tabla_interes_compuesto.xlsx')
    })
  }

  function renderWizard() {
    if (wizStep === 0 || !wizMode) {
      return (
        <WizardShell
          step={1}
          total={4}
          question="¿Qué quieres averiguar?"
          hint="Elige la opción que más se parezca a tu duda."
        >
          <BigChoice options={CHOICES} onPick={pickWhat} />
        </WizardShell>
      )
    }
    const fields = WIZ_FIELDS[wizMode]
    const key = fields[wizStep - 1]
    const cfg = SLIDER[key]
    const isLast = wizStep === fields.length
    return (
      <WizardShell
        step={wizStep + 1}
        total={fields.length + 1}
        question={cfg.q}
        hint={cfg.hint}
        onBack={wizBack}
        onNext={wizNext}
        nextLabel={isLast ? 'Ver resultado' : 'Siguiente'}
        onRestart={resetAll}
      >
        <BigSlider
          value={wizVals[key]}
          onChange={(v) => setWizVals((w) => ({ ...w, [key]: v }))}
          min={cfg.min}
          max={cfg.max}
          step={cfg.step}
          format={cfg.fmt}
        />
      </WizardShell>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        chip="Módulo 03"
        title="Interés Compuesto"
        description="Los intereses generados se suman al capital al final de cada período, generando intereses sobre intereses. El dinero crece exponencialmente."
      />

      <GlossaryChips
        terms={['interes-compuesto', 'capitalizacion', 'capital', 'monto', 'tasa-periodica']}
      />

      <ModeSwitch value={uiMode} onChange={switchUiMode} />

      {carried && (
        <Callout color="accent">
          {carriedLabel
            ? `📥 Tasa cargada desde Conversión de Tasas: ${carriedLabel}. Ajusta los demás datos y calcula.`
            : '📥 Trajimos los datos del módulo anterior y los calculamos por ti. Puedes ajustarlos.'}
        </Callout>
      )}

      {uiMode === 'simple' ? (
        <>
          <Callout color="accent">
            <strong>Modo simple:</strong> responde unas preguntas moviendo la barra y al final verás
            el resultado explicado paso a paso. 🙂
          </Callout>
          {renderWizard()}
          {error && <ErrorBox message={error} />}
        </>
      ) : (
        <>
          <Callout color="accent">
            <strong>La clave:</strong> En interés compuesto, cada período los intereses se
            <em> capitalizan</em> — se agregan al principal. Así, en el período siguiente, los
            intereses se calculan sobre un capital mayor. Esto es lo que genera el crecimiento
            exponencial y lo que hace tan poderoso al ahorro a largo plazo.
          </Callout>

          <div className="space-y-2 mb-6">
            <FormulaBox title="Valor futuro / Monto" formula="F = P × (1 + i)ⁿ" />
            <FormulaBox title="Valor presente / Capital inicial" formula="P = F × (1 + i)⁻ⁿ" />
            <FormulaBox title="Tasa de interés" formula="i = (F/P)^(1/n) − 1" />
            <FormulaBox title="Número de períodos" formula="n = ln(F/P) / ln(1 + i)" />
          </div>

          <Divider label="Calculadora" />

          <div className="card p-6 mb-6">
            <ModeTabs
              options={MODES}
              value={mode}
              onChange={(v) => {
                setMode(v as Mode)
                setResult(null)
                setError('')
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {mode !== 'P' && (
                <MoneyField
                  label={
                    <>
                      Valor Presente P{' '}
                      <InfoTip>
                        El <strong>valor presente</strong> es el dinero que tienes hoy, antes de que
                        gane intereses.
                      </InfoTip>
                    </>
                  }
                  value={P}
                  onChange={setP}
                  placeholder="ej: 5000000"
                />
              )}
              {(mode === 'P' || mode === 'i' || mode === 'n') && (
                <MoneyField
                  label={
                    <>
                      Valor Futuro F{' '}
                      <InfoTip>
                        El <strong>valor futuro</strong> es cuánto dinero tendrás al final, ya con
                        los intereses capitalizados.
                      </InfoTip>
                    </>
                  }
                  value={F}
                  onChange={setF}
                  placeholder="ej: 8000000"
                />
              )}
              {mode !== 'i' && (
                <Field
                  label={
                    <>
                      {rateLabel}{' '}
                      <InfoTip>
                        La <strong>tasa efectiva</strong> es la que ya incluye la capitalización del
                        período. Debe ir en la misma unidad que el tiempo.
                      </InfoTip>
                    </>
                  }
                  value={iPct}
                  onChange={setIPct}
                  placeholder="ej: 1.8"
                  unit="%"
                  hint="Tasa efectiva por período seleccionado"
                />
              )}
              {mode !== 'n' && (
                <Field label={nLabel} value={n} onChange={setN} placeholder="ej: 24" />
              )}
              <Select
                label="Unidad de período"
                value={period}
                onChange={handlePeriodChange}
                options={PERIODS}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={calculate}>
                → Calcular
              </button>
              <button
                onClick={loadExample}
                className="text-sm px-4 py-2.5 rounded-lg cursor-pointer"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                ✨ Cargar ejemplo
              </button>
            </div>
            {error && <ErrorBox message={error} />}
          </div>
        </>
      )}

      {result && (
        <div className="animate-fade-up">
          <CashFlowDiagram
            p={result.P}
            f={result.F}
            iPct={result.i * 100}
            n={result.n}
            periodType={period}
            type="compound"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <ResultCard
              accent
              label={
                mode === 'F'
                  ? 'Valor Futuro (F)'
                  : mode === 'P'
                    ? 'Valor Presente (P)'
                    : mode === 'i'
                      ? `Tasa ${PERIOD_RATE_LABEL[period]} (i)`
                      : `Períodos (${nUnit})`
              }
              value={
                mode === 'F'
                  ? fmtCOP(result.F)
                  : mode === 'P'
                    ? fmtCOP(result.P)
                    : mode === 'i'
                      ? fmtPct(result.i * 100)
                      : `${fmtNumber(result.n, 2, 2)} ${nUnit}`
              }
            />
            <ResultCard label="Interés compuesto" value={fmtCOP(result.I)} />
            <ResultCard
              label="Factor (1+i)ⁿ"
              value={fmtNumber(result.factor, 6, 6)}
              sub={[
                { label: 'Si fuera simple', value: fmtCOP(result.iSimple) },
                { label: 'Ventaja compuesto', value: fmtCOP(result.I - result.iSimple) },
              ]}
            />
          </div>

          <Callout color="accent">
            <strong>En palabras: </strong>
            {narrateGrowth({
              P: result.P,
              F: result.F,
              I: result.I,
              iPct: result.i * 100,
              n: result.n,
              periodLabel: nUnit,
              kind: 'compuesto',
            })}
          </Callout>

          <StepByStep steps={buildCompoundSteps(result, mode, nUnit)} contexto="interés compuesto" />

          <MicroQuiz module="interes-compuesto" />

          <FormulaBox
            formula={`F = ${fmtCOP(result.P)} × (1 + ${fmtPct(result.i * 100, 4)})^${fmtNumber(result.n, 2, 2)} = ${fmtCOP(result.F)}`}
          />

          {chartData.length > 1 && (
            <div className="card p-5 mt-6">
              <p
                className="text-xs mono uppercase tracking-widest mb-4"
                style={{ color: 'var(--muted)' }}
              >
                Compuesto vs Simple — el poder de la capitalización
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="n"
                    tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    width={52}
                    tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--chart-tooltip-bg)',
                      border: '1px solid var(--chart-tooltip-border)',
                      borderRadius: 8,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [fmtCOP(v)]}
                    labelFormatter={(l) => `Período ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      fontFamily: 'JetBrains Mono',
                      color: 'var(--chart-tick)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Interés Compuesto"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="linear"
                    dataKey="Interés Simple"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {result.series.length > 0 && result.n <= 120 && (
            <div className="card overflow-hidden mt-6">
              <div
                className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <p
                  className="text-xs mono uppercase tracking-widest"
                  style={{ color: 'var(--muted)' }}
                >
                  Tabla período a período — {result.series.length} {nUnit}
                  {result.n > 60 ? ' (primeros 60)' : ''}
                </p>
                <button
                  onClick={downloadExcel}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  style={{
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--accent-border)',
                    color: 'var(--accent)',
                  }}
                >
                  ↓ Descargar Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      {['#', 'Saldo inicial', 'Interés del período', 'Saldo final'].map((h) => (
                        <th
                          key={h}
                          className="py-3 px-4 text-right first:text-center text-xs mono uppercase tracking-wider"
                          style={{
                            color: 'var(--muted)',
                            borderBottom: '1px solid var(--border)',
                            fontWeight: 400,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.series.map((s, idx) => {
                      const initBalance = idx === 0 ? result.P : result.series[idx - 1].balance
                      const intPeriod = s.balance - initBalance
                      return (
                        <tr
                          key={s.period}
                          style={{
                            background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <td
                            className="py-2.5 px-4 text-center mono text-xs"
                            style={{ color: 'var(--muted)' }}
                          >
                            {s.period}
                          </td>
                          <td
                            className="py-2.5 px-4 text-right mono text-xs"
                            style={{ color: 'var(--text)' }}
                          >
                            {fmtCOP(initBalance)}
                          </td>
                          <td
                            className="py-2.5 px-4 text-right mono text-xs"
                            style={{ color: 'var(--destructive)' }}
                          >
                            {fmtCOP(intPeriod)}
                          </td>
                          <td
                            className="py-2.5 px-4 text-right mono text-xs"
                            style={{ color: 'var(--text)' }}
                          >
                            {fmtCOP(s.balance)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <ModuleNav
          current="/compuesto"
          buildCarry={() => ({
            rate: result.i * 100,
            amount: result.P,
            periods: Math.round(result.n),
          })}
        />
      )}

      <Divider label="Teoría completa" />
      <div
        className="card p-6 space-y-4 text-sm"
        style={{ color: 'var(--muted)', lineHeight: 1.75 }}
      >
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          La capitalización y el tiempo
        </h3>
        <p>
          La característica definitoria del interés compuesto es que al final de cada período, los
          intereses se <strong style={{ color: 'var(--text)' }}>capitalizan</strong>: se suman al
          capital para formar la base del siguiente período. Esto crea un efecto multiplicador que
          se vuelve más dramático con el tiempo — razón por la que Einstein supuestamente llamó al
          interés compuesto &quot;la octava maravilla del mundo&quot;.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Tasa de interés por período
        </h3>
        <p>
          La tasa <strong style={{ color: 'var(--text)' }}>i</strong> en la fórmula de interés
          compuesto debe ser la tasa
          <em> del período de capitalización</em>. Si el préstamo capitaliza mensualmente,
          i debe ser mensual. Si capitaliza trimestralmente, i debe ser trimestral. Al cambiar la
          unidad de período, la tasa se convierte automáticamente usando la fórmula de equivalencia:
          i_nueva = (1 + i_original)^(factor) − 1.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Valor presente y descuento
        </h3>
        <p>
          Despejar P de la fórmula permite calcular el{' '}
          <strong style={{ color: 'var(--text)' }}>valor presente</strong>: cuánto vale hoy un monto
          futuro descontado a una tasa dada. Esto es fundamental en finanzas: un pago de $5M dentro
          de 3 años no vale $5M hoy, sino P = F × (1+i)⁻ⁿ. Este concepto es la base del VPN.
        </p>
      </div>
    </div>
  )
}
