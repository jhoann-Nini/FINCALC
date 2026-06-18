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
import {
  calcSimpleF,
  calcSimpleP,
  calcSimpleN,
  calcSimpleI,
  buildSimpleSteps,
} from '../../../lib/simpleInterest'
import { fmtCOP, fmtPct, fmtNumber, fmtPctShort } from '../../../utils/format'
import type { SimpleResult } from '../../../types/finance.types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Mode = 'F' | 'P' | 'n' | 'i'

const MODES = [
  { value: 'F', label: 'Calcular F (Valor Futuro)' },
  { value: 'P', label: 'Calcular P (Capital)' },
  { value: 'n', label: 'Calcular n (Tiempo)' },
  { value: 'i', label: 'Calcular i (tasa de interés)' },
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

// Períodos por año — para conversión proporcional de tasas (interés simple)
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

// Traduce errores técnicos a mensajes amables
function friendlyError(msg: string): string {
  if (/F debe ser mayor que P/i.test(msg))
    return 'El valor final debe ser mayor que el inicial. Revisa los datos 🙂'
  if (/no puede ser 0/i.test(msg)) return 'Ese campo no puede ser 0. Prueba con otro número 🙂'
  if (/requerido/i.test(msg)) return 'Falta llenar un campo. Complétalo para calcular 🙂'
  if (/negativo/i.test(msg)) return 'Los valores no pueden ser negativos. Usa números positivos 🙂'
  return msg
}

// Cálculo compartido por el modo experto y el asistente
function runCalc(m: Mode, v: { P: number; F: number; iPct: number; n: number }): SimpleResult {
  if (m === 'F') return calcSimpleF(v.P, v.iPct, v.n)
  if (m === 'P') return calcSimpleP(v.F, v.iPct, v.n)
  if (m === 'n') return calcSimpleN(v.P, v.F, v.iPct)
  return calcSimpleI(v.P, v.F, v.n)
}

// ── Configuración del asistente (modo simple) ────────────────
const money0 = (v: number) => `$ ${fmtNumber(v, 0, 0)}`

const CHOICES: BigChoiceOption[] = [
  {
    value: 'F',
    emoji: '💰',
    label: '¿Cuánto tendré al final?',
    desc: 'Sé cuánto pongo hoy y quiero ver a cuánto llega.',
  },
  {
    value: 'P',
    emoji: '🎯',
    label: '¿Cuánto debo poner hoy?',
    desc: 'Sé la meta y quiero saber con cuánto empezar.',
  },
  {
    value: 'n',
    emoji: '⏳',
    label: '¿Cuánto tiempo necesito?',
    desc: 'Quiero saber en cuántos meses llego a la meta.',
  },
  {
    value: 'i',
    emoji: '📈',
    label: '¿Qué tasa necesito?',
    desc: 'Quiero saber qué interés me hace falta.',
  },
]

type FieldKey = 'P' | 'F' | 'i' | 'n'
const WIZ_FIELDS: Record<Mode, FieldKey[]> = {
  F: ['P', 'i', 'n'],
  P: ['F', 'i', 'n'],
  n: ['P', 'F', 'i'],
  i: ['P', 'F', 'n'],
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
    q: '¿Cuánta plata tienes hoy?',
    hint: 'El dinero con el que empiezas (capital).',
    min: 100000,
    max: 50000000,
    step: 100000,
    fmt: money0,
    init: 1000000,
  },
  F: {
    q: '¿A cuánto quieres llegar?',
    hint: 'El valor final que esperas tener.',
    min: 100000,
    max: 80000000,
    step: 100000,
    fmt: money0,
    init: 1500000,
  },
  i: {
    q: '¿Cuánto crece cada mes?',
    hint: 'La tasa de interés mensual, en porcentaje.',
    min: 0.1,
    max: 10,
    step: 0.1,
    fmt: fmtPctShort,
    init: 2.5,
  },
  n: {
    q: '¿Por cuántos meses?',
    hint: 'El tiempo que dejas el dinero.',
    min: 1,
    max: 60,
    step: 1,
    fmt: (v) => `${v} ${v === 1 ? 'mes' : 'meses'}`,
    init: 12,
  },
}

export default function SimpleInterestPage() {
  const [uiMode, setUiMode] = useState<UiMode>('simple')
  const [mode, setMode] = useState<Mode>('F')
  const [P, setP] = useState('1000000')
  const [iPct, setIPct] = useState('2.5')
  const [n, setN] = useState('12')
  const [F, setF] = useState('')
  const [period, setPeriod] = useState('mes')
  const [result, setResult] = useState<SimpleResult | null>(null)
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

  const carried = useCarryReceive((p) => {
    setUiMode('experto')
    const np = p.amount != null ? String(Math.round(p.amount)) : P
    const ni = p.rate != null ? String(+p.rate.toFixed(6)) : iPct
    const nn = p.periods != null ? String(Math.round(p.periods)) : n
    setMode('F')
    setP(np)
    setIPct(ni)
    setN(nn)
    try {
      setResult(calcSimpleF(+np, +ni, +nn))
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

  // Convierte la tasa proporcionalmente cuando cambia el período (modo experto)
  function handlePeriodChange(newPeriod: string) {
    const parsed = parseFloat(iPct)
    if (parsed > 0 && !isNaN(parsed)) {
      const oldFreq = PERIOD_FREQ[period]
      const newFreq = PERIOD_FREQ[newPeriod]
      const converted = parsed * (oldFreq / newFreq)
      setIPct(parseFloat(converted.toFixed(6)).toString())
    }
    setPeriod(newPeriod)
    setResult(null)
    setError('')
  }

  function calculate() {
    setError('')
    try {
      setResult(runCalc(mode, { P: +P, F: +F, iPct: +iPct, n: +n }))
    } catch (e: any) {
      setError(friendlyError(e.message))
    }
  }

  function loadExample() {
    setUiMode('experto')
    setMode('F')
    setPeriod('mes')
    setP('1000000')
    setIPct('2.5')
    setN('12')
    setF('')
    setError('')
    try {
      setResult(calcSimpleF(1000000, 2.5, 12))
    } catch {
      /* noop */
    }
  }

  // ── Asistente: navegación ──
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
    // Último paso → calcular
    try {
      const res = runCalc(wizMode, {
        P: wizVals.P,
        F: wizVals.F,
        iPct: wizVals.i,
        n: wizVals.n,
      })
      setMode(wizMode)
      setPeriod('mes')
      setResult(res)
      setError('')
    } catch (e: any) {
      setError(friendlyError(e.message))
    }
  }

  const chartData = result
    ? Array.from({ length: Math.min(Math.ceil(result.n) + 1, 25) }, (_, k) => ({
      n: k,
      'Monto (M)': Math.round(result.P + result.P * result.i * k),
    }))
    : []

  const rateLabel = `Tasa de interés ${PERIOD_RATE_LABEL[period]} (i)`
  const nLabel = `Número de ${PERIOD_N_LABEL[period]} n`
  const nUnit = PERIOD_N_LABEL[period]

  function downloadExcel() {
    import('xlsx').then((XLSX) => {
      const data = Array.from({ length: Math.min(Math.ceil(result!.n), 60) }, (_, k) => {
        const per = k + 1
        const isLast = per === Math.ceil(result!.n)
        const initBalance = result!.P * (1 + result!.i * k)
        const intPeriod =
          isLast && result!.n !== Math.ceil(result!.n)
            ? result!.P * result!.i * (result!.n - k)
            : result!.P * result!.i
        const finalBal = isLast ? result!.F : result!.P * (1 + result!.i * per)
        return {
          '#': per,
          'Saldo inicial': initBalance,
          'Interés del período': intPeriod,
          'Saldo final': finalBal,
        }
      })
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Interés Simple')
      XLSX.writeFile(wb, 'tabla_interes_simple.xlsx')
    })
  }

  // ── Render del asistente (modo simple) ──
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
        chip="Módulo 02"
        title="Interés Simple"
        description="El interés se calcula siempre sobre el capital inicial. No hay capitalización: los intereses no generan más intereses."
      />

      <ModeSwitch value={uiMode} onChange={switchUiMode} />

      {carried && (
        <Callout color="accent">
          📥 Trajimos los datos del módulo anterior y los calculamos por ti. Puedes ajustarlos.
        </Callout>
      )}

      {uiMode === 'simple' ? (
        <>
          <Callout color="blue">
            <strong>Modo simple:</strong> te haré unas preguntas, una por una. Mueve la barra para
            elegir cada número y al final verás el resultado explicado paso a paso. 🙂
          </Callout>
          {renderWizard()}
          {error && <ErrorBox message={error} />}
        </>
      ) : (
        <>
          <Callout color="blue">
            <strong>¿Cómo funciona?</strong> — En interés simple, el rendimiento es proporcional al
            tiempo y al capital. Si tienes $1.000.000 al 2% mensual durante 6 meses, cada mes ganas
            exactamente $20.000, sin importar el período. Total de intereses: $120.000. El dinero
            crece de forma <em>lineal</em>.
          </Callout>

          <div className="space-y-2 mb-6">
            <FormulaBox title="Interés generado" formula="I = P × i × n" />
            <FormulaBox title="Valor futuro / Monto" formula="M = VF = P × (1 + i × n)" />
            <FormulaBox title="Capital inicial" formula="P = M / (1 + i × n)" />
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
                      Capital Inicial P{' '}
                      <InfoTip>
                        El <strong>capital</strong> es el dinero con el que empiezas hoy, antes de
                        ganar intereses.
                      </InfoTip>
                    </>
                  }
                  value={P}
                  onChange={setP}
                  placeholder="ej: 1000000"
                />
              )}
              {(mode === 'P' || mode === 'n' || mode === 'i') && (
                <MoneyField
                  label={
                    <>
                      Valor Futuro F{' '}
                      <InfoTip>
                        El <strong>valor futuro</strong> es cuánto dinero tendrás al final, sumando
                        capital e intereses.
                      </InfoTip>
                    </>
                  }
                  value={F}
                  onChange={setF}
                  placeholder="ej: 1300000"
                />
              )}
              {mode !== 'i' && (
                <Field
                  label={
                    <>
                      {rateLabel}{' '}
                      <InfoTip>
                        La <strong>tasa</strong> dice cuánto crece tu dinero por período. Debe estar
                        en la misma unidad que el tiempo (si n está en meses, la tasa es mensual).
                      </InfoTip>
                    </>
                  }
                  value={iPct}
                  onChange={setIPct}
                  placeholder="ej: 2.5"
                  unit="%"
                  hint="La tasa debe corresponder al período seleccionado"
                />
              )}
              {mode !== 'n' && (
                <Field label={nLabel} value={n} onChange={setN} placeholder="ej: 12" />
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
            iPct={result.iPct}
            n={result.n}
            periodType={period}
            type="simple"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <ResultCard
              accent
              label={
                mode === 'F'
                  ? 'Monto M = VF'
                  : mode === 'P'
                    ? 'Capital Inicial (P)'
                    : mode === 'n'
                      ? `Tiempo (n) en ${nUnit}`
                      : 'Tasa de interés (i)'
              }
              value={
                mode === 'F'
                  ? fmtCOP(result.F)
                  : mode === 'P'
                    ? fmtCOP(result.P)
                    : mode === 'n'
                      ? `${fmtNumber(result.n, 2, 2)} ${nUnit}`
                      : fmtPct(result.iPct)
              }
            />
            <ResultCard
              label="Interés total generado"
              value={fmtCOP(result.I)}
              sub={[
                { label: 'Capital inicial', value: fmtCOP(result.P) },
                { label: 'Valor futuro', value: fmtCOP(result.F) },
              ]}
            />
          </div>

          <StepByStep steps={buildSimpleSteps(result, mode, nUnit)} />

          <FormulaBox
            formula={`M = VF = ${fmtCOP(result.P)} × (1 + ${fmtPct(result.iPct, 2)} × ${fmtNumber(result.n, 2, 2)}) = ${fmtCOP(result.F)}`}
          />

          {chartData.length > 1 && (
            <div className="card p-5 mt-6">
              <p
                className="text-xs mono uppercase tracking-widest mb-4"
                style={{ color: 'var(--muted)' }}
              >
                Evolución del capital en el tiempo
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="n"
                    tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: nUnit,
                      position: 'insideBottom',
                      offset: -10,
                      fill: 'var(--chart-tick)',
                      fontSize: 10,
                    }}
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
                    formatter={(v: number) => [fmtCOP(v), 'Capital']}
                    labelFormatter={(l) => `${l} ${nUnit}`}
                  />
                  <Line
                    type="linear"
                    dataKey="Monto (M)"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {result.n >= 1 && result.n <= 120 && (
            <div className="card overflow-hidden mt-6">
              <div
                className="px-5 py-3 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <p
                  className="text-xs mono uppercase tracking-widest"
                  style={{ color: 'var(--muted)' }}
                >
                  Tabla período a período — {Math.min(Math.ceil(result.n), 60)} {nUnit}
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
                    {Array.from({ length: Math.min(Math.ceil(result.n), 60) }, (_, k) => {
                      const per = k + 1
                      const isLast = per === Math.ceil(result.n)
                      const initBalance = result.P * (1 + result.i * k)
                      const intPeriod =
                        isLast && result.n !== Math.ceil(result.n)
                          ? result.P * result.i * (result.n - k)
                          : result.P * result.i
                      const finalBal = isLast ? result.F : result.P * (1 + result.i * per)
                      return (
                        <tr
                          key={per}
                          style={{
                            background: k % 2 === 0 ? 'transparent' : 'var(--surface2)',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <td
                            className="py-2.5 px-4 text-center mono text-xs"
                            style={{ color: 'var(--muted)' }}
                          >
                            {per}
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
                            {fmtCOP(finalBal)}
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
          current="/simple"
          buildCarry={() => ({
            rate: result.iPct,
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
          ¿Cuándo se usa interés simple?
        </h3>
        <p>
          El interés simple se aplica principalmente en operaciones de{' '}
          <strong style={{ color: 'var(--text)' }}>corto plazo</strong>: préstamos de consumo,
          descuentos comerciales, operaciones del mercado monetario y papeles de deuda con
          vencimiento menor a un año. En Colombia, la cartera de crédito de consumo a menos de 30
          días generalmente maneja interés simple.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Variables de la fórmula
        </h3>
        <ul className="space-y-2 list-none">
          {[
            [
              'P (Capital / Valor Presente)',
              'Dinero inicial o monto del préstamo. Siempre en la misma moneda.',
            ],
            [
              'i (Tasa de interés)',
              'Debe coincidir en unidad de tiempo con n. Si n está en meses, i debe ser mensual.',
            ],
            [
              'n (Número de períodos)',
              'Tiempo transcurrido. Pueden ser días, semanas, meses, años. La unidad importa.',
            ],
            ['M = VF (Monto / Valor Futuro)', 'Capital más intereses acumulados. M = P + I.'],
            ['I (Interés)', 'Rentabilidad o costo financiero total. I = P × i × n.'],
          ].map(([term, def]) => (
            <li key={term} className="flex gap-3">
              <span className="mono text-xs pt-1 flex-shrink-0" style={{ color: 'var(--accent)' }}>
                ▸
              </span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{term}:</strong> {def}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Conversión entre períodos
        </h3>
        <p>
          En interés simple, la conversión de tasas es{' '}
          <strong style={{ color: 'var(--text)' }}>proporcional</strong>: una tasa mensual del 2%
          equivale a 24% anual (2% × 12) o a 0.0657% diario (2% × 12/365). Al cambiar la unidad de
          período en la calculadora, la tasa se convierte automáticamente.
        </p>
      </div>
    </div>
  )
}
