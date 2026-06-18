import { useState } from 'react'
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
import { PageHeader, Field, ResultCard } from '../../components/ui'
import { fmtCOP } from '../../utils/format'

type CompMode = 'simple_vs_compound' | 'amort_frances_vs_aleman'

export default function ComparatorPage() {
  const [compMode, setCompMode] = useState<CompMode>('simple_vs_compound')

  // ── Simple vs Compound ─────────────────────────────────────────
  const [P, setP] = useState('5000000')
  const [iPct, setIPct] = useState('2')
  const [n, setN] = useState('24')

  // ── Amortization ───────────────────────────────────────────────
  const [aP, setAP] = useState('20000000')
  const [aIPct, setAIPct] = useState('1.5')
  const [aN, setAN] = useState('12')

  function calcSimpleVsCompound() {
    const capital = parseFloat(P) || 0
    const rate = parseFloat(iPct) / 100 || 0
    const periods = parseInt(n) || 0
    if (capital <= 0 || rate <= 0 || periods <= 0) return null

    const data = Array.from({ length: periods + 1 }, (_, k) => ({
      n: k,
      'Interés Simple': Math.round(capital * (1 + rate * k)),
      'Interés Compuesto': Math.round(capital * Math.pow(1 + rate, k)),
    }))

    const fSimple = capital * (1 + rate * periods)
    const fCompound = capital * Math.pow(1 + rate, periods)

    return { data, fSimple, fCompound, diff: fCompound - fSimple }
  }

  function calcAmortFrancesVsAleman() {
    const capital = parseFloat(aP) || 0
    const rate = parseFloat(aIPct) / 100 || 0
    const periods = parseInt(aN) || 0
    if (capital <= 0 || rate <= 0 || periods <= 0) return null

    // French (fixed payment)
    const paymentFrances = capital * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1)
    let balanceFrances = capital
    const franceRows: { n: number; cuota: number; interes: number; capital: number }[] = []
    for (let i = 1; i <= periods; i++) {
      const interes = balanceFrances * rate
      const abono = paymentFrances - interes
      balanceFrances -= abono
      franceRows.push({ n: i, cuota: paymentFrances, interes, capital: abono })
    }

    // German (constant principal)
    const principalAleman = capital / periods
    let balanceAleman = capital
    const alemanRows: { n: number; cuota: number; interes: number; capital: number }[] = []
    for (let i = 1; i <= periods; i++) {
      const interes = balanceAleman * rate
      const cuota = principalAleman + interes
      balanceAleman -= principalAleman
      alemanRows.push({ n: i, cuota, interes, capital: principalAleman })
    }

    const totalFrances = franceRows.reduce((s, r) => s + r.cuota, 0)
    const totalAleman = alemanRows.reduce((s, r) => s + r.cuota, 0)
    const intFrances = franceRows.reduce((s, r) => s + r.interes, 0)
    const intAleman = alemanRows.reduce((s, r) => s + r.interes, 0)

    const chartData = Array.from({ length: periods + 1 }, (_, k) => {
      const balF = k === 0 ? capital : capital - franceRows.slice(0, k).reduce((s, r) => s + r.capital, 0)
      const balA = k === 0 ? capital : capital - principalAleman * k
      return { n: k, 'Saldo Francés': Math.max(0, Math.round(balF)), 'Saldo Alemán': Math.max(0, Math.round(balA)) }
    })

    return {
      france: { rows: franceRows, total: totalFrances, interest: intFrances, payment: paymentFrances },
      aleman: { rows: alemanRows, total: totalAleman, interest: intAleman, firstPayment: alemanRows[0]?.cuota ?? 0 },
      chartData,
      saving: totalFrances - totalAleman,
    }
  }

  const svCResult = compMode === 'simple_vs_compound' ? calcSimpleVsCompound() : null
  const amortResult = compMode === 'amort_frances_vs_aleman' ? calcAmortFrancesVsAleman() : null

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader
        chip="Comparador"
        title="Comparador de Métodos"
        description="Analiza lado a lado los distintos enfoques financieros para tomar la mejor decisión."
      />

      {/* Mode selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          ['simple_vs_compound', 'Simple vs Compuesto'],
          ['amort_frances_vs_aleman', 'Francés vs Alemán'],
        ] as [CompMode, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setCompMode(val)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={
              compMode === val
                ? { background: 'var(--accent)', color: '#fff', border: 'none' }
                : { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Simple vs Compound ─────────────────────────────── */}
      {compMode === 'simple_vs_compound' && (
        <>
          <div className="card p-5 mb-5">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
              Parámetros comunes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Capital inicial P ($)" value={P} onChange={setP} placeholder="5000000" />
              <Field label="Tasa periódica i (%)" value={iPct} onChange={setIPct} placeholder="2" unit="%" />
              <Field label="Períodos n" value={n} onChange={setN} placeholder="24" />
            </div>
          </div>

          {svCResult && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="card p-4">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                    Interés Simple
                  </p>
                  <p className="result-number text-2xl mb-1" style={{ color: 'var(--text)' }}>
                    {fmtCOP(svCResult.fSimple)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    F = P × (1 + i × n)
                  </p>
                </div>
                <div className="card p-4" style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' }}>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>
                    Interés Compuesto
                  </p>
                  <p className="result-number text-2xl mb-1" style={{ color: 'var(--accent)' }}>
                    {fmtCOP(svCResult.fCompound)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    F = P × (1 + i)^n
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-4 mb-5"
                style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--gold)' }}>
                  <strong>Diferencia:</strong> El interés compuesto genera{' '}
                  <strong>{fmtCOP(svCResult.diff)}</strong> más que el simple en {n} períodos.
                  Esta brecha crece exponencialmente con el tiempo.
                </p>
              </div>

              <div className="card p-5 mb-5">
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                  Crecimiento comparado
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={svCResult.data} margin={{ left: 8, right: 8, top: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="n" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
                    <YAxis
                      width={60}
                      tick={{ fill: 'var(--chart-tick)', fontSize: 10 }}
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => fmtCOP(v)}
                    />
                    <Legend />
                    <Line type="linear" dataKey="Interés Simple" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Interés Compuesto" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Francés vs Alemán ──────────────────────────────── */}
      {compMode === 'amort_frances_vs_aleman' && (
        <>
          <div className="card p-5 mb-5">
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
              Parámetros del crédito
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Capital del crédito P ($)" value={aP} onChange={setAP} placeholder="20000000" />
              <Field label="Tasa mensual i (%)" value={aIPct} onChange={setAIPct} placeholder="1.5" unit="%" />
              <Field label="Cuotas n" value={aN} onChange={setAN} placeholder="12" />
            </div>
          </div>

          {amortResult && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <ResultCard
                  label="Total pagado — Francés"
                  value={fmtCOP(amortResult.france.total)}
                  sub={[
                    { label: 'Cuota fija', value: fmtCOP(amortResult.france.payment) },
                    { label: 'Intereses', value: fmtCOP(amortResult.france.interest) },
                  ]}
                />
                <ResultCard
                  accent
                  label="Total pagado — Alemán"
                  value={fmtCOP(amortResult.aleman.total)}
                  sub={[
                    { label: '1ª cuota', value: fmtCOP(amortResult.aleman.firstPayment) },
                    { label: 'Intereses', value: fmtCOP(amortResult.aleman.interest) },
                  ]}
                />
              </div>

              <div
                className="rounded-xl p-4 mb-5"
                style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
              >
                <p className="text-sm" style={{ color: 'var(--gold)' }}>
                  <strong>Ahorro con sistema alemán:</strong>{' '}
                  {fmtCOP(amortResult.saving)} menos en intereses totales.
                  La primera cuota alemana ({fmtCOP(amortResult.aleman.firstPayment)}) es mayor pero las siguientes decrecen.
                </p>
              </div>

              <div className="card p-5 mb-5">
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
                  Evolución del saldo
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={amortResult.chartData} margin={{ left: 8, right: 8, top: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="n" tick={{ fill: 'var(--chart-tick)', fontSize: 10 }} />
                    <YAxis
                      width={60}
                      tick={{ fill: 'var(--chart-tick)', fontSize: 10 }}
                      tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => fmtCOP(v)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Saldo Francés" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Saldo Alemán" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison table (first 8 rows) */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                    Cuotas comparadas (primeras {Math.min(8, amortResult.france.rows.length)})
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        {['#', 'Cuota Francesa', 'Cuota Alemana', 'Diferencia'].map((h) => (
                          <th key={h} className="py-2.5 px-4 text-right first:text-center mono uppercase tracking-wider" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', fontWeight: 400 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {amortResult.france.rows.slice(0, 8).map((row, i) => {
                        const alemanCuota = amortResult.aleman.rows[i]?.cuota ?? 0
                        const diff = row.cuota - alemanCuota
                        return (
                          <tr key={row.n} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                            <td className="py-2 px-4 text-center" style={{ color: 'var(--muted)' }}>{row.n}</td>
                            <td className="py-2 px-4 text-right mono" style={{ color: 'var(--text)' }}>{fmtCOP(row.cuota)}</td>
                            <td className="py-2 px-4 text-right mono" style={{ color: 'var(--accent)' }}>{fmtCOP(alemanCuota)}</td>
                            <td className="py-2 px-4 text-right mono" style={{ color: diff > 0 ? 'var(--destructive)' : 'var(--accent)' }}>
                              {diff > 0 ? '+' : ''}{fmtCOP(diff)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
