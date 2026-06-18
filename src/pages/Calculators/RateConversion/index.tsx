import { useState } from 'react'
import {
  PageHeader,
  Field,
  Select,
  ModeTabs,
  FormulaBox,
  Callout,
  Divider,
  ErrorBox,
  InfoTip,
  StepByStep,
  ModuleNav,
  useCarryReceive,
  ModeSwitch,
  WizardShell,
  BigChoice,
  BigSlider,
  type UiMode,
  type BigChoiceOption,
} from '../../../components/ui'
import {
  convertEAtoNominal,
  convertNominalToEA,
  convertEAtoEffective,
  convertEffectiveToEA,
  convertAnticipatedToVencida,
  convertVencidaToAnticipated,
  buildRateSteps,
} from '../../../lib/rateConversion'
import { fmtPct, fmtPctShort } from '../../../utils/format'
import type { RateConversionResult, CapFreq } from '../../../types/finance.types'

const CONVERSIONS = [
  { value: 'EA-NOM', label: 'EA → Nominal' },
  { value: 'NOM-EA', label: 'Nominal → EA' },
  { value: 'EA-EFF', label: 'EA → Efectiva/período' },
  { value: 'EFF-EA', label: 'Efectiva/período → EA' },
  { value: 'ANT-VEN', label: 'Anticipada → Vencida' },
  { value: 'VEN-ANT', label: 'Vencida → Anticipada' },
]

const FREQS = [
  { value: '12', label: '12 — Mensual' },
  { value: '4', label: '4 — Trimestral' },
  { value: '2', label: '2 — Semestral' },
  { value: '365', label: '365 — Diaria' },
  { value: '52', label: '52 — Semanal' },
  { value: '1', label: '1 — Anual' },
]

const LABELS: Record<string, string> = {
  'EA-NOM': 'Tasa EA (%)',
  'NOM-EA': 'Tasa Nominal (%)',
  'EA-EFF': 'Tasa EA (%)',
  'EFF-EA': 'Tasa efectiva por período (%)',
  'ANT-VEN': 'Tasa Anticipada MA (%)',
  'VEN-ANT': 'Tasa Vencida MV (%)',
}

const needsFreq = (t: string) => !['ANT-VEN', 'VEN-ANT'].includes(t)

function runConv(conv: string, v: number, m: CapFreq): RateConversionResult {
  if (conv === 'EA-NOM') return convertEAtoNominal(v, m)
  if (conv === 'NOM-EA') return convertNominalToEA(v, m)
  if (conv === 'EA-EFF') return convertEAtoEffective(v, m)
  if (conv === 'EFF-EA') return convertEffectiveToEA(v, m)
  if (conv === 'ANT-VEN') return convertAnticipatedToVencida(v)
  return convertVencidaToAnticipated(v)
}

const CHOICES: BigChoiceOption[] = [
  {
    value: 'NOM-EA',
    emoji: '🔄',
    label: 'Nominal → Efectiva (EA)',
    desc: 'Tengo una nominal y quiero la EA real.',
  },
  {
    value: 'EA-NOM',
    emoji: '🔁',
    label: 'Efectiva (EA) → Nominal',
    desc: 'Tengo una EA y quiero la nominal.',
  },
  {
    value: 'EA-EFF',
    emoji: '📐',
    label: 'EA → tasa de un período',
    desc: 'Tengo la EA y quiero la de cada período.',
  },
  {
    value: 'EFF-EA',
    emoji: '📏',
    label: 'Tasa de un período → EA',
    desc: 'Tengo la de un período y quiero la EA.',
  },
  {
    value: 'ANT-VEN',
    emoji: '⏪',
    label: 'Anticipada → Vencida',
    desc: 'La tasa se cobra al inicio del período.',
  },
  {
    value: 'VEN-ANT',
    emoji: '⏩',
    label: 'Vencida → Anticipada',
    desc: 'La tasa se cobra al final del período.',
  },
]

const FREQ_CHOICES: BigChoiceOption[] = [
  { value: '12', emoji: '📅', label: 'Mensual', desc: '12 veces al año' },
  { value: '4', emoji: '🗓️', label: 'Trimestral', desc: '4 veces al año' },
  { value: '2', emoji: '📆', label: 'Semestral', desc: '2 veces al año' },
  { value: '1', emoji: '🗒️', label: 'Anual', desc: '1 vez al año' },
  { value: '365', emoji: '☀️', label: 'Diaria', desc: '365 veces al año' },
  { value: '52', emoji: '📈', label: 'Semanal', desc: '52 veces al año' },
]

export default function RateConversionPage() {
  const [uiMode, setUiMode] = useState<UiMode>('simple')
  const [conv, setConv] = useState('EA-NOM')
  const [inputVal, setInputVal] = useState('24')
  const [freq, setFreq] = useState('12')
  const [result, setResult] = useState<RateConversionResult | null>(null)
  const [error, setError] = useState('')

  // Asistente
  const [wizConv, setWizConv] = useState<string | null>(null)
  const [wizStep, setWizStep] = useState(0) // 0 = elegir conversión, 1 = tasa, 2 = frecuencia
  const [wizRate, setWizRate] = useState(24)

  const carried = useCarryReceive((p) => {
    setUiMode('experto')
    if (p.rate != null) {
      const nr = String(+p.rate.toFixed(6))
      setInputVal(nr)
      try {
        setResult(runConv(conv, +nr, +freq as CapFreq))
      } catch {
        /* noop */
      }
    }
  })

  function resetAll() {
    setResult(null)
    setError('')
    setWizConv(null)
    setWizStep(0)
  }
  function switchUiMode(m: UiMode) {
    setUiMode(m)
    resetAll()
  }

  function calculate() {
    setError('')
    try {
      setResult(runConv(conv, +inputVal, +freq as CapFreq))
    } catch (e: any) {
      setError(e.message)
    }
  }

  function loadExample() {
    setUiMode('experto')
    setConv('NOM-EA')
    setInputVal('24')
    setFreq('12')
    setError('')
    try {
      setResult(convertNominalToEA(24, 12))
    } catch {
      /* noop */
    }
  }

  function compute(convType: string, rate: number, m: number) {
    try {
      setConv(convType)
      setInputVal(String(rate))
      setFreq(String(m))
      setResult(runConv(convType, rate, m as CapFreq))
      setError('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  // ── Asistente ──
  function pickConv(value: string) {
    setWizConv(value)
    setWizRate(24)
    setWizStep(1)
    setError('')
  }
  function wizBack() {
    if (wizStep <= 1) {
      setWizConv(null)
      setWizStep(0)
    } else {
      setWizStep((s) => s - 1)
    }
  }
  function rateNext() {
    if (!wizConv) return
    if (needsFreq(wizConv)) {
      setWizStep(2)
    } else {
      compute(wizConv, wizRate, 12) // las anticipada/vencida no usan m en el cálculo principal
    }
  }
  function pickFreq(value: string) {
    if (!wizConv) return
    compute(wizConv, wizRate, +value)
  }

  function renderWizard() {
    if (wizStep === 0 || !wizConv) {
      return (
        <WizardShell
          step={1}
          total={3}
          question="¿Qué conversión necesitas?"
          hint="Elige el tipo de tasa que tienes y la que quieres obtener."
        >
          <BigChoice options={CHOICES} onPick={pickConv} />
        </WizardShell>
      )
    }
    const total = needsFreq(wizConv) ? 3 : 2
    if (wizStep === 1) {
      return (
        <WizardShell
          step={2}
          total={total}
          question="¿Cuál es el valor de la tasa?"
          hint="Mueve la barra hasta tu tasa (en porcentaje)."
          onBack={wizBack}
          onNext={rateNext}
          nextLabel={needsFreq(wizConv) ? 'Siguiente' : 'Ver resultado'}
          onRestart={resetAll}
        >
          <BigSlider
            value={wizRate}
            onChange={setWizRate}
            min={0.1}
            max={60}
            step={0.1}
            format={fmtPctShort}
          />
        </WizardShell>
      )
    }
    // wizStep === 2 → frecuencia
    return (
      <WizardShell
        step={3}
        total={total}
        question="¿Cada cuánto se capitaliza?"
        hint="Cuántas veces al año se liquidan los intereses."
        onBack={wizBack}
        onRestart={resetAll}
      >
        <BigChoice options={FREQ_CHOICES} onPick={pickFreq} />
      </WizardShell>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        chip="Módulo 01"
        title="Conversión de Tasas"
        description="Convierte entre tasa efectiva anual (EA), nominal, tasa por período, y entre modalidades anticipada y vencida."
      />

      <ModeSwitch value={uiMode} onChange={switchUiMode} />

      {carried && (
        <Callout color="gold">
          📥 Trajimos la tasa del módulo anterior y la convertimos. Puedes ajustarla.
        </Callout>
      )}

      {uiMode === 'simple' ? (
        <>
          <Callout color="gold">
            <strong>Modo simple:</strong> dime qué tasa tienes y cuál quieres, elige los valores y
            te muestro el resultado explicado paso a paso. 🙂
          </Callout>
          {renderWizard()}
          {error && <ErrorBox message={error} />}
        </>
      ) : (
        <>
          <Callout color="gold">
            <strong>¿Por qué convertir tasas?</strong> — Las tasas se pueden expresar de múltiples
            formas, pero para calcular el costo real de un crédito o la rentabilidad de una
            inversión, siempre debemos trabajar con la{' '}
            <em>tasa efectiva del período de capitalización</em>. Una tasa nominal de 24% anual
            capitalizable mensualmente NO equivale a 24% anual efectivo.
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-xs mono uppercase tracking-widest mb-2"
                style={{ color: 'var(--gold)' }}
              >
                Mes Vencido (MV)
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                El interés se cobra al <strong style={{ color: 'var(--text)' }}>final</strong> del
                período. Es la modalidad más común en créditos de consumo y cartera hipotecaria en
                Colombia.
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            >
              <p
                className="text-xs mono uppercase tracking-widest mb-2"
                style={{ color: 'var(--gold)' }}
              >
                Mes Anticipado (MA)
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                El interés se descuenta al <strong style={{ color: 'var(--text)' }}>inicio</strong>{' '}
                del período. Común en títulos de descuento, factoring y algunos CDT.
              </p>
            </div>
          </div>

          <Divider label="Calculadora" />

          <div className="card p-6 mb-6">
            <ModeTabs
              options={CONVERSIONS}
              value={conv}
              onChange={(v) => {
                setConv(v)
                setResult(null)
                setError('')
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <Field
                label={
                  <>
                    {LABELS[conv]}{' '}
                    <InfoTip>
                      Escribe el valor de la tasa que ya tienes. El resultado será la tasa
                      equivalente que pediste.
                    </InfoTip>
                  </>
                }
                value={inputVal}
                onChange={setInputVal}
                placeholder="ej: 24"
                unit="%"
              />
              {needsFreq(conv) && (
                <Select
                  label="Capitalización (veces/año)"
                  value={freq}
                  onChange={setFreq}
                  options={FREQS}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" onClick={calculate}>
                → Convertir
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
        <div className="animate-fade-up space-y-5">
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p
                  className="text-xs mono uppercase tracking-widest mb-1"
                  style={{ color: 'var(--muted)' }}
                >
                  {result.inputLabel}
                </p>
                <p className="result-number text-2xl" style={{ color: 'var(--text)' }}>
                  {fmtPct(result.inputPct, 4)}
                </p>
              </div>
              <div className="text-2xl" style={{ color: 'var(--accent)' }}>
                →
              </div>
              <div className="flex-1">
                <p
                  className="text-xs mono uppercase tracking-widest mb-1"
                  style={{ color: 'var(--muted)' }}
                >
                  {result.outputLabel}
                </p>
                <p className="result-number text-2xl" style={{ color: 'var(--accent)' }}>
                  {fmtPct(result.outputPct, 6)}
                </p>
              </div>
            </div>
          </div>

          <StepByStep steps={buildRateSteps(conv, +inputVal, +freq)} />

          <FormulaBox formula={result.formula} />

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p
                className="text-xs mono uppercase tracking-widest"
                style={{ color: 'var(--muted)' }}
              >
                Tabla de equivalencias — todas las tasas equivalentes
              </p>
              <button
                onClick={() => {
                  if (!result) return
                  import('xlsx').then((XLSX) => {
                    const data = result.equivalences.map((eq) => ({
                      'Tipo de tasa': eq.label,
                      'Tasa (%)': eq.pct,
                    }))
                    const ws = XLSX.utils.json_to_sheet(data)
                    const wb = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(wb, ws, 'Equivalencias')
                    XLSX.writeFile(wb, 'tabla_equivalencias.xlsx')
                  })
                }}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {result.equivalences.map((eq) => (
                <div
                  key={eq.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs mono mb-1" style={{ color: 'var(--muted)' }}>
                    {eq.label}
                  </p>
                  <p className="text-sm mono font-semibold" style={{ color: 'var(--accent)' }}>
                    {fmtPct(eq.pct, 6)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && <ModuleNav current="/tasas" buildCarry={() => ({ rate: result.monthly })} />}

      <Divider label="Teoría completa" />
      <div
        className="card p-6 space-y-4 text-sm"
        style={{ color: 'var(--muted)', lineHeight: 1.75 }}
      >
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Tasa Nominal vs Tasa Efectiva
        </h3>
        <p>
          La <strong style={{ color: 'var(--text)' }}>tasa nominal</strong> es una tasa anunciada
          que no considera la capitalización. Una tasa nominal del 24% NMV (nominal mensual vencida)
          equivale a una tasa mensual del 2%, pero el costo anual real es mayor al 24% porque cada
          mes los intereses se capitalizan.
        </p>
        <p>
          La <strong style={{ color: 'var(--text)' }}>tasa efectiva anual (EA)</strong> sí refleja
          el efecto de la capitalización. Permite comparar productos financieros con diferentes
          frecuencias de capitalización en igualdad de condiciones. En Colombia, la Superfinanciera
          exige reportar las tasas de crédito en términos EA.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Fórmulas de conversión
        </h3>
        <div className="space-y-2">
          <FormulaBox formula="EA → Nominal: iₙ = m × [(1 + EA)^(1/m) − 1]" />
          <FormulaBox formula="Nominal → EA: EA = (1 + iₙ/m)^m − 1" />
          <FormulaBox formula="Vencida → Anticipada: iₐ = iᵥ / (1 + iᵥ)" />
          <FormulaBox formula="Anticipada → Vencida: iᵥ = iₐ / (1 − iₐ)" />
        </div>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Regla de oro
        </h3>
        <p>
          Antes de cualquier cálculo de interés compuesto, asegúrate de que la tasa y el número de
          períodos estén en
          <strong style={{ color: 'var(--text)' }}> la misma unidad de tiempo</strong>. Una tasa
          mensual con n mensual, o una tasa trimestral con n trimestral. Jamás mezclar unidades sin
          convertir primero.
        </p>
      </div>
    </div>
  )
}
