import { useState } from 'react'
import {
  PageHeader,
  Field,
  Select,
  ModeTabs,
  ResultCard,
  FormulaBox,
  Callout,
  ErrorBox,
  StepByStep,
  GlossaryChips,
  MicroQuiz,
} from '../../../components/ui'
import { useHistoryStore } from '../../../store/historyStore'
import {
  calcArithmeticGradient,
  calcGeometricGradient,
  buildArithmeticSteps,
  buildGeometricSteps,
  type GradientArithmeticResult,
  type GradientGeometricResult,
} from '../../../lib/gradients'
import { fmtCOP, fmtPct, fmtNumber } from '../../../utils/format'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Mode = 'aritmetico' | 'geometrico'

const MODES = [
  { value: 'aritmetico', label: 'Gradiente aritmético (+G fijo)' },
  { value: 'geometrico', label: 'Gradiente geométrico (+g %)' },
]

const PERIODS = [
  { value: 'meses', label: 'Meses' },
  { value: 'bimestres', label: 'Bimestres' },
  { value: 'trimestres', label: 'Trimestres' },
  { value: 'semestres', label: 'Semestres' },
  { value: 'años', label: 'Años' },
]

export default function GradientsPage() {
  const [mode, setMode] = useState<Mode>('aritmetico')
  const [base, setBase] = useState('1000000') // A (aritmético) / A1 (geométrico)
  const [grad, setGrad] = useState('100000') // G en $ (aritmético)
  const [gPct, setGPct] = useState('5') // g en % (geométrico)
  const [iPct, setIPct] = useState('2')
  const [n, setN] = useState('12')
  const [period, setPeriod] = useState('meses')
  const [error, setError] = useState('')
  const [ari, setAri] = useState<GradientArithmeticResult | null>(null)
  const [geo, setGeo] = useState<GradientGeometricResult | null>(null)

  const addHistory = useHistoryStore((s) => s.add)

  function calcular() {
    setError('')
    setAri(null)
    setGeo(null)

    const A = Number(base)
    const i = Number(iPct)
    const N = Number(n)

    if (!(A > 0)) return setError('El pago base debe ser mayor que 0.')
    if (!(i > 0)) return setError('La tasa de interés debe ser mayor que 0.')
    if (!(N >= 1)) return setError('El número de períodos debe ser al menos 1.')

    if (mode === 'aritmetico') {
      const G = Number(grad)
      if (Number.isNaN(G)) return setError('El gradiente G no es válido.')
      const r = calcArithmeticGradient(A, G, i, N)
      setAri(r)
      addHistory({
        module: 'Gradientes',
        label: `Aritmético: P = ${fmtCOP(r.P)} (A=${fmtCOP(A)}, G=${fmtCOP(G)}, ${N} ${period})`,
        inputs: { A, G, i, n: N, period },
        result: { P: r.P, F: r.F, A_eq: r.Aeq },
      })
    } else {
      const g = Number(gPct)
      if (Number.isNaN(g)) return setError('El crecimiento g no es válido.')
      const r = calcGeometricGradient(A, g, i, N)
      setGeo(r)
      addHistory({
        module: 'Gradientes',
        label: `Geométrico: P = ${fmtCOP(r.P)} (A₁=${fmtCOP(A)}, g=${g}%, ${N} ${period})`,
        inputs: { A1: A, g, i, n: N, period },
        result: { P: r.P, F: r.F },
      })
    }
  }

  const series = ari?.series ?? geo?.series ?? []
  const chartData = series.map((s) => ({ period: s.period, Flujo: s.cashflow }))

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <PageHeader
        chip="Módulo 08"
        title="Gradientes"
        description="Series de pagos que crecen período a período: por una cantidad fija (aritmético) o por un porcentaje fijo (geométrico). Útiles para costos e ingresos que escalan con el tiempo."
      />

      <GlossaryChips terms={['gradiente', 'anualidad', 'capital', 'tasa-periodica']} />

      <ModeTabs options={MODES} value={mode} onChange={(v) => setMode(v as Mode)} />

      <FormulaBox
        title={mode === 'aritmetico' ? 'Gradiente aritmético' : 'Gradiente geométrico'}
        formula={
          mode === 'aritmetico'
            ? 'P = A·(P/A) + G·(P/G)   ·   flujoₖ = A + (k−1)·G'
            : 'P = A₁ · [1 − ((1+g)/(1+i))ⁿ] / (i − g)   ·   flujoₖ = A₁·(1+g)^(k−1)'
        }
      />

      <div className="card p-5 mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label={mode === 'aritmetico' ? 'Pago base A (período 1)' : 'Primer pago A₁'}
            value={base}
            onChange={setBase}
            unit="$"
            placeholder="ej: 1000000"
          />
          {mode === 'aritmetico' ? (
            <Field
              label="Gradiente G (aumento por período)"
              value={grad}
              onChange={setGrad}
              unit="$"
              placeholder="ej: 100000"
              hint="Cuánto sube el pago cada período (puede ser negativo)."
            />
          ) : (
            <Field
              label="Crecimiento g (% por período)"
              value={gPct}
              onChange={setGPct}
              unit="%"
              placeholder="ej: 5"
              hint="Porcentaje en que crece el pago cada período."
            />
          )}
          <Field
            label="Tasa de interés por período (i)"
            value={iPct}
            onChange={setIPct}
            unit="%"
            placeholder="ej: 2"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Períodos (n)" value={n} onChange={setN} placeholder="ej: 12" />
            <Select
              label="Unidad"
              value={period}
              onChange={setPeriod}
              options={PERIODS}
            />
          </div>
        </div>

        <div className="mt-5">
          <button className="btn-primary" onClick={calcular}>
            → Calcular
          </button>
        </div>
        {error && <ErrorBox message={error} />}
      </div>

      {/* ── Resultados ── */}
      {ari && (
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
            <ResultCard accent label="Valor presente (P)" value={fmtCOP(ari.P)} />
            <ResultCard label="Valor futuro (F)" value={fmtCOP(ari.F)} />
            <ResultCard
              label="Serie uniforme equiv. (A_eq)"
              value={fmtCOP(ari.Aeq)}
              sub={[
                { label: 'VP base (A)', value: fmtCOP(ari.PA) },
                { label: 'VP gradiente (G)', value: fmtCOP(ari.PG) },
              ]}
            />
          </div>

          <Callout color="accent">
            <strong>En palabras: </strong>
            Una serie que empieza en {fmtCOP(ari.A)} y sube {fmtCOP(ari.G)} cada período durante{' '}
            {fmtNumber(ari.n, 0)} {period} vale hoy {fmtCOP(ari.P)}. Equivale a recibir un pago fijo
            de {fmtCOP(ari.Aeq)} todos los períodos.
          </Callout>

          <StepByStep steps={buildArithmeticSteps(ari)} contexto="gradiente aritmético" />
        </div>
      )}

      {geo && (
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
            <ResultCard accent label="Valor presente (P)" value={fmtCOP(geo.P)} />
            <ResultCard label="Valor futuro (F)" value={fmtCOP(geo.F)} />
          </div>

          <Callout color="accent">
            <strong>En palabras: </strong>
            Una serie que empieza en {fmtCOP(geo.A1)} y crece {fmtPct(geo.gPct, 2)} cada período
            durante {fmtNumber(geo.n, 0)} {period} vale hoy {fmtCOP(geo.P)}.
            {geo.equalRate && ' (Como g = i, se usó la fórmula simplificada.)'}
          </Callout>

          <StepByStep steps={buildGeometricSteps(geo)} contexto="gradiente geométrico" />
        </div>
      )}

      {/* ── Gráfica y tabla de la serie ── */}
      {series.length > 0 && (
        <>
          <div className="card p-5 mt-6">
            <p
              className="text-xs mono uppercase tracking-widest mb-4"
              style={{ color: 'var(--muted)' }}
            >
              Flujo de caja período a período
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="period"
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
                  formatter={(v: number) => [fmtCOP(v), 'Flujo']}
                  labelFormatter={(l) => `Período ${l}`}
                />
                <Bar dataKey="Flujo" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden mt-6">
            <div className="px-5 py-3" style={{ background: 'var(--surface2)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                Flujo período a período — {series.length} {period}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['#', 'Flujo del período'].map((h) => (
                      <th
                        key={h}
                        className="text-right px-5 py-2 mono text-xs uppercase tracking-wider"
                        style={{ color: 'var(--muted)', fontWeight: 500 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {series.map((row) => (
                    <tr key={row.period} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-5 py-2 text-right mono" style={{ color: 'var(--muted)' }}>
                        {row.period}
                      </td>
                      <td className="px-5 py-2 text-right mono" style={{ color: 'var(--text)' }}>
                        {fmtCOP(row.cashflow)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <MicroQuiz module="gradiente" />
        </>
      )}
    </div>
  )
}
