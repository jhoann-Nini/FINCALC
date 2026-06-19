import { useState } from 'react'
import {
  PageHeader,
  Field,
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
  BigSlider,
  MoneyField,
  type UiMode,
} from '../../../components/ui'
import { calcRealRate, buildInflationSteps } from '../../../lib/financial'
import { fmtCOP, fmtPct, fmtNumber, fmtPctShort } from '../../../utils/format'
import type { InflationResult } from '../../../types/finance.types'
import { useHistoryStore } from '../../../store/historyStore'
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

const money0 = (v: number) => `$ ${fmtNumber(v, 0, 0)}`

type FieldKey = 'nominal' | 'inflation' | 'P' | 'n'
const FIELDS: FieldKey[] = ['nominal', 'inflation', 'P', 'n']
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
  nominal: {
    q: '¿Cuánto rinde tu dinero al año?',
    hint: 'La tasa que te da el banco o la inversión (nominal EA).',
    min: 0,
    max: 40,
    step: 0.5,
    fmt: fmtPctShort,
    init: 14,
  },
  inflation: {
    q: '¿Cuánto suben los precios al año?',
    hint: 'La inflación esperada (en Colombia suele rondar el 5-7%).',
    min: 0,
    max: 30,
    step: 0.5,
    fmt: fmtPctShort,
    init: 6.5,
  },
  P: {
    q: '¿Cuánta plata inviertes?',
    hint: 'El capital con el que empiezas.',
    min: 100000,
    max: 100000000,
    step: 100000,
    fmt: money0,
    init: 10000000,
  },
  n: {
    q: '¿Por cuántos años?',
    hint: 'El tiempo que dejas la inversión.',
    min: 1,
    max: 30,
    step: 1,
    fmt: (v) => `${v} ${v === 1 ? 'año' : 'años'}`,
    init: 5,
  },
}

export default function InflationPage() {
  const addHistory = useHistoryStore((s) => s.add)
  const [uiMode, setUiMode] = useState<UiMode>('simple')
  const [nominal, setNominal] = useState('14')
  const [inflation, setInflation] = useState('6.5')
  const [P, setP] = useState('10000000')
  const [n, setN] = useState('5')
  const [result, setResult] = useState<InflationResult | null>(null)
  const [error, setError] = useState('')

  // Asistente
  const [wizStep, setWizStep] = useState(1)
  const [wizVals, setWizVals] = useState({
    nominal: SLIDER.nominal.init,
    inflation: SLIDER.inflation.init,
    P: SLIDER.P.init,
    n: SLIDER.n.init,
  })

  const carried = useCarryReceive((p) => {
    setUiMode('experto')
    const nNominal = p.rate != null ? String(+p.rate.toFixed(6)) : nominal
    const np = p.amount != null ? String(Math.round(p.amount)) : P
    const nPeriods = p.periods != null ? String(Math.round(p.periods)) : n
    setNominal(nNominal)
    setP(np)
    setN(nPeriods)
    try {
      setResult(calcRealRate(+nNominal, +inflation, +np, +nPeriods))
    } catch {
      /* noop */
    }
  })

  function resetAll() {
    setResult(null)
    setError('')
    setWizStep(1)
  }
  function switchUiMode(m: UiMode) {
    setUiMode(m)
    resetAll()
  }

  function calculate() {
    setError('')
    try {
      const r = calcRealRate(+nominal, +inflation, +P, +n)
      setResult(r)
      addHistory({
        module: 'Inflación & Tasas Reales',
        label: `Tasa real: ${fmtPct(r.realRatePct, 4)} (nominal ${nominal}%, inflación ${inflation}%)`,
        inputs: { nominal: +nominal, inflacion: +inflation, P: +P, n: +n },
        result: { tasa_real: r.realRatePct, FV_real: r.realFV, FV_nominal: r.nominalFV },
      })
    } catch (e: any) {
      setError(e.message)
    }
  }

  function loadExample() {
    setUiMode('experto')
    setNominal('14')
    setInflation('6.5')
    setP('10000000')
    setN('5')
    setError('')
    try {
      setResult(calcRealRate(14, 6.5, 10000000, 5))
    } catch {
      /* noop */
    }
  }

  function wizBack() {
    setWizStep((s) => Math.max(1, s - 1))
  }
  function wizNext() {
    if (wizStep < FIELDS.length) {
      setWizStep((s) => s + 1)
      return
    }
    setNominal(String(wizVals.nominal))
    setInflation(String(wizVals.inflation))
    setP(String(wizVals.P))
    setN(String(wizVals.n))
    try {
      setResult(calcRealRate(wizVals.nominal, wizVals.inflation, wizVals.P, wizVals.n))
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const chartData = result
    ? Array.from({ length: +n + 1 }, (_, k) => ({
        año: k,
        'FV Nominal': Math.round(+P * Math.pow(1 + result.nominalRate, k)),
        'FV Real (poder adquisitivo)': Math.round(+P * Math.pow(1 + result.realRate, k)),
      }))
    : []

  function renderWizard() {
    const key = FIELDS[wizStep - 1]
    const cfg = SLIDER[key]
    const isLast = wizStep === FIELDS.length
    return (
      <WizardShell
        step={wizStep}
        total={FIELDS.length}
        question={cfg.q}
        hint={cfg.hint}
        onBack={wizStep > 1 ? wizBack : undefined}
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
        chip="Módulo 06"
        title="Inflación & Tasas Reales"
        description="La inflación erosiona el poder adquisitivo del dinero. La tasa real mide el rendimiento verdadero después de descontar el efecto inflacionario."
      />

      <ModeSwitch value={uiMode} onChange={switchUiMode} />

      {carried && (
        <Callout color="gold">
          📥 Trajimos los datos del módulo anterior. La inflación quedó en {inflation}% — ajústala
          si quieres.
        </Callout>
      )}

      {uiMode === 'simple' ? (
        <>
          <Callout color="gold">
            <strong>Modo simple:</strong> responde 4 preguntas moviendo la barra y verás cuánto
            rinde de verdad tu dinero, explicado paso a paso. 🙂
          </Callout>
          {renderWizard()}
          {error && <ErrorBox message={error} />}
        </>
      ) : (
        <>
          <Callout color="gold">
            <strong>Ecuación de Fisher:</strong> una tasa nominal del 14% EA con inflación del 6.5%
            no implica que ganaste 14% en términos reales. La tasa real es aproximadamente 7%, pero
            la fórmula exacta de Fisher da un resultado más preciso: (1 + iᵣ) = (1 + iₙ) / (1 + π).
          </Callout>

          <div className="space-y-2 mb-6">
            <FormulaBox
              title="Ecuación de Fisher exacta"
              formula="(1 + iReal) = (1 + iNominal) / (1 + π)"
            />
            <FormulaBox title="Aproximación lineal de Fisher" formula="iReal ≈ iNominal - π" />
          </div>

          <Divider label="Calculadora" />

          <div className="card p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field
                label={
                  <>
                    Tasa nominal EA (%){' '}
                    <InfoTip>
                      La <strong>tasa nominal</strong> es lo que te ofrece el banco, sin descontar
                      la inflación.
                    </InfoTip>
                  </>
                }
                value={nominal}
                onChange={setNominal}
                unit="%"
                hint="Tasa del banco o inversión"
              />
              <Field
                label={
                  <>
                    Inflación anual (%){' '}
                    <InfoTip>
                      La <strong>inflación</strong> es cuánto suben los precios al año. Le resta
                      poder de compra a tu dinero.
                    </InfoTip>
                  </>
                }
                value={inflation}
                onChange={setInflation}
                unit="%"
                hint="IPC o inflación proyectada"
              />
              <MoneyField label="Capital inicial P" value={P} onChange={setP} />
              <Field label="Años n" value={n} onChange={setN} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={calculate}>
                → Calcular tasa real
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
            p={+P}
            nominalFV={result.nominalFV}
            realFV={result.realFV}
            iPct={result.realRatePct}
            n={+n}
            periodType="año"
            type="inflation"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <ResultCard accent label="Tasa Real (Fisher)" value={fmtPct(result.realRatePct, 4)} />
            <ResultCard
              label="FV nominal"
              value={fmtCOP(result.nominalFV)}
              sub={[{ label: 'Tasa nominal', value: fmtPct(result.nominalRate * 100, 2) }]}
            />
            <ResultCard
              label="FV en poder adquisitivo real"
              value={fmtCOP(result.realFV)}
              sub={[
                { label: 'Pérdida de poder de compra', value: `${result.purchasingPowerLoss}%` },
              ]}
            />
          </div>

          <StepByStep steps={buildInflationSteps(result)} />

          <FormulaBox
            formula={`iReal = (1 + ${fmtPct(+nominal)}) / (1 + ${fmtPct(+inflation)}) − 1 = ${fmtPct(result.realRatePct, 4)}`}
          />

          {chartData.length > 1 && (
            <div className="card p-5 mt-6">
              <p
                className="text-xs mono uppercase tracking-widest mb-4"
                style={{ color: 'var(--muted)' }}
              >
                FV nominal vs poder adquisitivo real
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis
                    dataKey="año"
                    tick={{ fill: 'var(--chart-tick)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    label={{
                      value: 'Años',
                      position: 'insideBottom',
                      offset: -4,
                      fill: 'var(--chart-tick)',
                      fontSize: 10,
                    }}
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
                    labelFormatter={(l) => `Año ${l}`}
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
                    dataKey="FV Nominal"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="FV Real (poder adquisitivo)"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                La brecha entre ambas curvas representa el{' '}
                <strong style={{ color: 'var(--gold)' }}>poder adquisitivo perdido</strong> por la
                inflación.
              </p>
            </div>
          )}
        </div>
      )}

      {result && (
        <ModuleNav
          current="/inflacion"
          buildCarry={() => ({
            rate: result.nominalRate * 100,
            amount: +P,
            periods: +n,
          })}
        />
      )}

      <Divider label="Teoría completa" />
      <div
        className="card p-6 space-y-4 text-sm"
        style={{ color: 'var(--muted)', lineHeight: 1.75 }}
      >
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          ¿Por qué importa la inflación?
        </h3>
        <p>
          Si una inversión rinde el 10% anual pero la inflación es del 8%, el rendimiento real es
          apenas del ~1.85%. Estás ganando dinero nominalmente, pero tu poder adquisitivo creció muy
          poco. En períodos de alta inflación (como Colombia en los 90s con más del 25%), muchas
          inversiones &quot;rentables&quot; en pesos generaban pérdida real.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Ecuación de Fisher
        </h3>
        <p>
          Desarrollada por Irving Fisher, la ecuación relaciona tasas nominales y reales:
          <strong style={{ color: 'var(--text)' }}> (1 + iₙ) = (1 + iᵣ) × (1 + π)</strong>. La
          aproximación lineal iᵣ ≈ iₙ − π funciona bien cuando las tasas son bajas, pero introduce
          error significativo en entornos inflacionarios. Siempre es mejor usar la fórmula exacta.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Tasas en Colombia
        </h3>
        <p>
          El Banco de la República fija la tasa de intervención (tasa repo), que influye en todas
          las demás tasas del sistema. Las tasas de crédito nominal siempre incluyen: tasa real
          esperada + inflación esperada + prima de riesgo del deudor. En análisis de proyectos, se
          puede trabajar con flujos en pesos corrientes (nominales) o en pesos constantes (reales),
          pero la tasa de descuento debe ser consistente con la decisión.
        </p>
      </div>
    </div>
  )
}
