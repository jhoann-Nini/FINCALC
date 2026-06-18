import { useState } from 'react'
import {
  PageHeader,
  Field,
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
  calcAnnuityPV,
  calcAnnuityFV,
  calcAnnuityPMT,
  buildAnnuitySteps,
} from '../../../lib/financial'
import { fmtCOP, fmtNumber, fmtPctShort } from '../../../utils/format'
import type { AnnuityResult } from '../../../types/finance.types'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Mode = 'PV' | 'FV' | 'PMT'

const MODES = [
  { value: 'PV', label: 'Valor Presente (PV)' },
  { value: 'FV', label: 'Valor Futuro (FV)' },
  { value: 'PMT', label: 'Cuota (PMT)' },
]

function friendlyError(msg: string): string {
  if (/no puede ser 0/i.test(msg)) return 'Ese campo no puede ser 0. Prueba con otro número 🙂'
  return msg
}

function runCalc(m: Mode, v: { PMT: number; PV: number; iPct: number; n: number }): AnnuityResult {
  if (m === 'FV') return calcAnnuityFV(v.PMT, v.iPct, v.n)
  if (m === 'PV') return calcAnnuityPV(v.PMT, v.iPct, v.n)
  return calcAnnuityPMT(v.PV, v.iPct, v.n)
}

const money0 = (v: number) => `$ ${fmtNumber(v, 0, 0)}`

const CHOICES: BigChoiceOption[] = [
  {
    value: 'FV',
    emoji: '🐷',
    label: '¿Cuánto ahorraré?',
    desc: 'Guardo la misma cuota cada mes: cuánto junto al final.',
  },
  {
    value: 'PMT',
    emoji: '🧾',
    label: '¿De cuánto será mi cuota?',
    desc: 'Sé el préstamo y quiero saber cuánto pago cada mes.',
  },
  {
    value: 'PV',
    emoji: '📅',
    label: '¿Cuánto valen hoy esos pagos?',
    desc: 'Tengo una serie de pagos y quiero su valor de hoy.',
  },
]

type FieldKey = 'PMT' | 'PV' | 'i' | 'n'
const WIZ_FIELDS: Record<Mode, FieldKey[]> = {
  FV: ['PMT', 'i', 'n'],
  PV: ['PMT', 'i', 'n'],
  PMT: ['PV', 'i', 'n'],
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
  PMT: {
    q: '¿Cuánto aportas cada mes?',
    hint: 'El pago o cuota periódica.',
    min: 50000,
    max: 5000000,
    step: 50000,
    fmt: money0,
    init: 500000,
  },
  PV: {
    q: '¿De cuánto es el préstamo?',
    hint: 'El valor presente o monto prestado hoy.',
    min: 500000,
    max: 100000000,
    step: 500000,
    fmt: money0,
    init: 10000000,
  },
  i: {
    q: '¿Cuánto es la tasa por mes?',
    hint: 'La tasa efectiva mensual, en porcentaje.',
    min: 0.1,
    max: 10,
    step: 0.1,
    fmt: fmtPctShort,
    init: 1.5,
  },
  n: {
    q: '¿Cuántas cuotas (meses)?',
    hint: 'El número de pagos.',
    min: 1,
    max: 120,
    step: 1,
    fmt: (v) => `${v} ${v === 1 ? 'cuota' : 'cuotas'}`,
    init: 36,
  },
}

export default function AnnuitiesPage() {
  const [uiMode, setUiMode] = useState<UiMode>('simple')
  const [mode, setMode] = useState<Mode>('FV')
  const [PMT, setPMT] = useState('500000')
  const [iPct, setIPct] = useState('1.5')
  const [n, setN] = useState('36')
  const [PV, setPV] = useState('10000000')
  const [result, setResult] = useState<AnnuityResult | null>(null)
  const [error, setError] = useState('')

  // Asistente
  const [wizMode, setWizMode] = useState<Mode | null>(null)
  const [wizStep, setWizStep] = useState(0)
  const [wizVals, setWizVals] = useState({
    PMT: SLIDER.PMT.init,
    PV: SLIDER.PV.init,
    i: SLIDER.i.init,
    n: SLIDER.n.init,
  })

  const carried = useCarryReceive((p) => {
    setUiMode('experto')
    const ni = p.rate != null ? String(+p.rate.toFixed(6)) : iPct
    const nn = p.periods != null ? String(Math.round(p.periods)) : n
    setIPct(ni)
    setN(nn)
    if (p.amount != null) {
      const npv = String(Math.round(p.amount))
      setMode('PMT')
      setPV(npv)
      try {
        setResult(calcAnnuityPMT(+npv, +ni, +nn))
      } catch {
        /* noop */
      }
    } else {
      try {
        setResult(runCalc(mode, { PMT: +PMT, PV: +PV, iPct: +ni, n: +nn }))
      } catch {
        /* noop */
      }
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

  function calculate() {
    setError('')
    try {
      setResult(runCalc(mode, { PMT: +PMT, PV: +PV, iPct: +iPct, n: +n }))
    } catch (e: any) {
      setError(friendlyError(e.message))
    }
  }

  function loadExample() {
    setUiMode('experto')
    setMode('FV')
    setPMT('500000')
    setIPct('1.5')
    setN('36')
    setError('')
    try {
      setResult(calcAnnuityFV(500000, 1.5, 36))
    } catch {
      /* noop */
    }
  }

  function pickWhat(value: string) {
    const m = value as Mode
    setWizMode(m)
    setWizVals({ PMT: SLIDER.PMT.init, PV: SLIDER.PV.init, i: SLIDER.i.init, n: SLIDER.n.init })
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
      const res = runCalc(wizMode, {
        PMT: wizVals.PMT,
        PV: wizVals.PV,
        iPct: wizVals.i,
        n: wizVals.n,
      })
      setMode(wizMode)
      setPMT(String(wizVals.PMT))
      setPV(String(wizVals.PV))
      setIPct(String(wizVals.i))
      setN(String(wizVals.n))
      setResult(res)
      setError('')
    } catch (e: any) {
      setError(friendlyError(e.message))
    }
  }

  const chartData = result?.series
    ? result.series.slice(0, 60).map((s) => ({
        período: s.period,
        'Saldo acumulado': Math.round(s.balance),
        'Aportes acumulados': Math.round(result.PMT * s.period),
      }))
    : []

  function downloadExcel() {
    import('xlsx').then((XLSX) => {
      const data = (result?.series ?? []).map((s) => ({
        Período: s.period,
        'Cuota (PMT)': result!.PMT,
        'Saldo acumulado': s.balance,
        'Aportes acumulados': result!.PMT * s.period,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Anualidades')
      XLSX.writeFile(wb, 'tabla_anualidades.xlsx')
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
        chip="Módulo 04"
        title="Anualidades y Series Uniformes"
        description="Una serie uniforme es un conjunto de pagos iguales realizados en intervalos iguales de tiempo. Permiten calcular créditos, ahorros programados y planes de pensión."
      />

      <ModeSwitch value={uiMode} onChange={switchUiMode} />

      {carried && (
        <Callout color="blue">
          📥 Trajimos los datos del módulo anterior y los calculamos por ti. Puedes ajustarlos.
        </Callout>
      )}

      {uiMode === 'simple' ? (
        <>
          <Callout color="blue">
            <strong>Modo simple:</strong> elige qué quieres saber, responde moviendo la barra y
            verás el resultado explicado paso a paso. 🙂
          </Callout>
          {renderWizard()}
          {error && <ErrorBox message={error} />}
        </>
      ) : (
        <>
          <Callout color="blue">
            <strong>Serie uniforme ordinaria:</strong> pagos iguales PMT al final de cada período.
            El valor presente PV es el valor hoy de todos esos pagos. El valor futuro FV es la
            acumulación de todos los pagos con sus intereses. Esta es la base matemática de todo
            crédito y plan de ahorro.
          </Callout>

          <div className="space-y-2 mb-6">
            <FormulaBox
              title="Valor presente de la serie"
              formula="PV = PMT × [1 - (1+i)^-n] / i"
            />
            <FormulaBox title="Valor futuro de la serie" formula="FV = PMT × [(1+i)^n - 1] / i" />
            <FormulaBox
              title="Cuota dada el valor presente"
              formula="PMT = PV × [i(1+i)^n] / [(1+i)^n - 1]"
            />
          </div>

          <Divider label="Calculadora" />

          <div className="card p-6 mb-6">
            <ModeTabs
              options={MODES}
              value={mode}
              onChange={(v) => {
                setMode(v as Mode)
                setResult(null)
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {mode !== 'PMT' && (
                <MoneyField
                  label={
                    <>
                      Pago periódico PMT{' '}
                      <InfoTip>
                        El <strong>PMT</strong> es la cuota: el pago igual que haces cada período.
                      </InfoTip>
                    </>
                  }
                  value={PMT}
                  onChange={setPMT}
                />
              )}
              {mode === 'PMT' && (
                <MoneyField
                  label={
                    <>
                      Valor Presente PV{' '}
                      <InfoTip>
                        El <strong>valor presente</strong> es el monto del préstamo o el valor hoy
                        de la serie.
                      </InfoTip>
                    </>
                  }
                  value={PV}
                  onChange={setPV}
                />
              )}
              <Field
                label={
                  <>
                    Tasa de interés (i){' '}
                    <InfoTip>
                      La tasa efectiva por período (si las cuotas son mensuales, mensual).
                    </InfoTip>
                  </>
                }
                value={iPct}
                onChange={setIPct}
                unit="%"
                hint="Tasa efectiva por período"
              />
              <Field label="Número de períodos n" value={n} onChange={setN} />
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
          <div className="flex justify-end mb-4">
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
          <CashFlowDiagram
            p={result.PV}
            f={result.FV}
            pmt={result.PMT}
            iPct={+iPct}
            n={result.n}
            periodType="período"
            type="annuities"
            annuityMode={mode}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <ResultCard
              accent
              label={
                mode === 'FV'
                  ? 'Valor Futuro (FV)'
                  : mode === 'PV'
                    ? 'Valor Presente (PV)'
                    : 'Cuota (PMT)'
              }
              value={
                mode === 'FV'
                  ? fmtCOP(result.FV)
                  : mode === 'PV'
                    ? fmtCOP(result.PV)
                    : fmtCOP(result.PMT)
              }
            />
            <ResultCard label="Cuota PMT" value={fmtCOP(result.PMT)} />
            <ResultCard label="Total pagado" value={fmtCOP(result.totalPaid)} />
            <ResultCard label="Intereses totales" value={fmtCOP(result.totalInterest)} />
          </div>

          <StepByStep steps={buildAnnuitySteps(result, mode)} />

          {chartData.length > 1 && (
            <div className="card p-5 mt-6">
              <p
                className="text-xs mono uppercase tracking-widest mb-4"
                style={{ color: 'var(--muted)' }}
              >
                Evolución del valor acumulado vs aportes
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAportes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="período"
                    tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    width={56}
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
                  <Area
                    type="monotone"
                    dataKey="Saldo acumulado"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#colorSaldo)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Aportes acumulados"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="url(#colorAportes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                La diferencia entre las dos curvas es el{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  rendimiento generado por los intereses
                </strong>
                .
              </p>
            </div>
          )}
        </div>
      )}

      {result && (
        <ModuleNav
          current="/anualidades"
          buildCarry={() => ({
            rate: result.i * 100,
            amount: result.PV,
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
          ¿Qué es una anualidad?
        </h3>
        <p>
          Una <strong style={{ color: 'var(--text)' }}>anualidad</strong> (o serie uniforme) es
          cualquier sucesión de pagos iguales en intervalos iguales de tiempo. El nombre puede ser
          confuso: no tienen que ser anuales — pueden ser mensuales, trimestrales o semanales. Lo
          que define la serie es que los pagos son <em>iguales</em>y ocurren en períodos{' '}
          <em>regulares</em>.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Tipos de anualidades
        </h3>
        <ul className="space-y-2 list-none">
          {[
            [
              'Ordinaria (vencida)',
              'El pago ocurre al FINAL de cada período. Es la más común: créditos hipotecarios, tarjetas de crédito, planes de ahorro.',
            ],
            [
              'Anticipada',
              'El pago ocurre al INICIO de cada período. Ejemplo: arrendamientos pagados por adelantado.',
            ],
            [
              'Diferida',
              'La serie comienza después de un período de gracia. El primer pago ocurre k períodos después del presente.',
            ],
            [
              'Perpetua',
              'La serie no tiene fecha de vencimiento: los pagos continúan para siempre. PV = PMT / i.',
            ],
          ].map(([name, desc]) => (
            <li key={name} className="flex gap-3">
              <span className="mono text-xs pt-1 flex-shrink-0" style={{ color: 'var(--blue)' }}>
                ▸
              </span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{name}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Aplicaciones reales
        </h3>
        <p>
          Todo crédito bancario en Colombia usa la fórmula de anualidad ordinaria para calcular la
          cuota mensual. Los planes de pensión voluntaria calculan el valor futuro de una serie de
          aportes. Los fondos de inversión colectiva proyectan el crecimiento con aportes periódicos
          usando estas mismas fórmulas.
        </p>
      </div>
    </div>
  )
}
