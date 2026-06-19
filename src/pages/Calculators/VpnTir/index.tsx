import { useState, useRef } from 'react'
import { Plus, Trash2, Printer, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts'
import { PageHeader, Field, InfoTip } from '../../../components/ui'
import { fmtCOP, fmtPct } from '../../../utils/format'
import { useHistoryStore } from '../../../store/historyStore'

// ── Financial Calculations ────────────────────────────────────────────────────

function calcNPV(cashFlows: number[], tioDecimal: number): number {
  return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + tioDecimal, t), 0)
}

function calcIRR(cashFlows: number[]): number | null {
  if (cashFlows.length < 2) return null
  const hasPositive = cashFlows.slice(1).some((cf) => cf > 0)
  if (!hasPositive || cashFlows[0] >= 0) return null

  const npvFn = (r: number) =>
    cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0)
  const dnpvFn = (r: number) =>
    cashFlows.reduce(
      (acc, cf, t) => (t === 0 ? acc : acc - (t * cf) / Math.pow(1 + r, t + 1)),
      0
    )

  const GUESSES = [0.1, 0.5, 0.05, 0.25, 0.01, 0.75, 1.0]
  for (const r0 of GUESSES) {
    let r = r0
    for (let i = 0; i < 300; i++) {
      const f = npvFn(r)
      const df = dnpvFn(r)
      if (Math.abs(df) < 1e-12) break
      const step = f / df
      r -= step
      if (r < -0.9999 || r > 10 || isNaN(r) || !isFinite(r)) break
      if (Math.abs(step) < 1e-9) {
        if (Math.abs(npvFn(r)) < 1e-2) return r * 100
        break
      }
    }
  }
  return null
}

function calcPayback(cashFlows: number[]): number | null {
  if (cashFlows[0] >= 0) return null
  const investment = Math.abs(cashFlows[0])
  let cumulative = 0
  for (let t = 1; t < cashFlows.length; t++) {
    const prev = cumulative
    cumulative += cashFlows[t]
    if (cumulative >= investment) {
      const fraction = (investment - prev) / cashFlows[t]
      return t - 1 + fraction
    }
  }
  return null
}

function buildSensitivity(cashFlows: number[]) {
  return Array.from({ length: 51 }, (_, i) => ({
    tio: i,
    VPN: Math.round(calcNPV(cashFlows, i / 100) * 100) / 100,
  }))
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalcResult {
  vpn: number
  tir: number | null
  payback: number | null
  sensitivity: { tio: number; VPN: number }[]
  cashFlows: number[]
  tio: number
}

// ── Tooltip custom ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--chart-tooltip-bg)',
        border: '1px solid var(--chart-tooltip-border)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p style={{ color: 'var(--muted)', marginBottom: 2 }}>TIO = {label}%</p>
      <p style={{ color: payload[0].value >= 0 ? 'var(--accent)' : 'var(--destructive)', fontWeight: 600 }}>
        VPN = {fmtCOP(payload[0].value)}
      </p>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VpnTirPage() {
  const addHistory = useHistoryStore((s) => s.add)
  const printRef = useRef<HTMLDivElement>(null)

  const [investment, setInvestment] = useState('50000000')
  const [flows, setFlows] = useState<string[]>(['20000000', '20000000', '20000000'])
  const [tio, setTio] = useState('12')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [error, setError] = useState('')

  function addFlow() {
    setFlows((prev) => [...prev, ''])
  }

  function removeFlow(i: number) {
    setFlows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateFlow(i: number, val: string) {
    setFlows((prev) => prev.map((f, idx) => (idx === i ? val : f)))
  }

  function calculate() {
    setError('')
    const inv = parseFloat(investment.replace(/[^0-9.-]/g, ''))
    const tioPct = parseFloat(tio)

    if (!inv || inv <= 0) {
      setError('Ingresa una inversión inicial válida (mayor que 0).')
      return
    }
    if (isNaN(tioPct) || tioPct < 0) {
      setError('Ingresa una TIO válida (mayor o igual a 0).')
      return
    }
    const parsedFlows = flows.map((f) => parseFloat(f.replace(/[^0-9.-]/g, '') || '0'))
    if (parsedFlows.length === 0) {
      setError('Agrega al menos un flujo de caja.')
      return
    }

    const cashFlows = [-inv, ...parsedFlows]
    const vpn = calcNPV(cashFlows, tioPct / 100)
    const tir = calcIRR(cashFlows)
    const payback = calcPayback(cashFlows)
    const sensitivity = buildSensitivity(cashFlows)

    const r: CalcResult = { vpn, tir, payback, sensitivity, cashFlows, tio: tioPct }
    setResult(r)

    addHistory({
      module: 'VPN / TIR',
      label: `VPN=${fmtCOP(vpn)}, TIR=${tir !== null ? fmtPct(tir, 2) : 'N/A'}, TIO=${tioPct}%`,
      inputs: { inversion: inv, periodos: parsedFlows.length, TIO: tioPct },
      result: { VPN: vpn, TIR: tir ?? 'N/A', payback: payback ?? 'No recupera' },
    })
  }

  function exportPDF() {
    window.print()
  }

  const viable = result && result.vpn > 0

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <PageHeader
        chip="Calculadora"
        title="VPN / TIR"
        description="Evalúa la viabilidad de proyectos de inversión mediante Valor Presente Neto y Tasa Interna de Retorno."
      />

      {/* ── Input Section ─────────────────────────────────────────── */}
      <div className="card p-5 mb-5 no-print">
        <p className="text-xs uppercase tracking-widest mb-4 mono" style={{ color: 'var(--muted)' }}>
          Parámetros del proyecto
        </p>

        {/* TIO */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
              TIO — Tasa de interés de oportunidad
            </label>
            <InfoTip>La tasa mínima de rentabilidad que exiges al proyecto. Si el VPN &gt; 0 a esta tasa, el proyecto crea valor.</InfoTip>
          </div>
          <Field label="" value={tio} onChange={setTio} placeholder="12" unit="% E.A." />
        </div>

        {/* Initial Investment */}
        <div className="mb-4">
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
            Inversión inicial (período 0)
          </label>
          <Field label="" value={investment} onChange={setInvestment} placeholder="50000000" unit="$" />
        </div>

        {/* Cash Flows */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium mono" style={{ color: 'var(--muted)' }}>
              Flujos de caja (períodos 1 … {flows.length})
            </label>
            <button
              onClick={addFlow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              <Plus size={12} />
              Agregar período
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {flows.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="text-xs mono w-16 flex-shrink-0 text-right"
                  style={{ color: 'var(--muted)' }}
                >
                  Período {i + 1}
                </span>
                <div className="flex-1">
                  <input
                    type="number"
                    value={f}
                    onChange={(e) => updateFlow(i, e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      outline: 'none',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                </div>
                <button
                  onClick={() => removeFlow(i)}
                  disabled={flows.length <= 1}
                  className="p-2 rounded-lg transition-all cursor-pointer flex-shrink-0"
                  style={{
                    color: flows.length <= 1 ? 'var(--border)' : 'var(--destructive)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--destructive)', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: 'var(--destructive)' }}>{error}</p>
          </div>
        )}

        <button
          onClick={calculate}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
        >
          Calcular VPN y TIR
        </button>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      {result && (
        <>
          {/* Viability badge */}
          <div
            className="rounded-xl p-4 mb-5 flex items-center gap-3"
            style={{
              background: viable ? 'var(--accent-bg)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${viable ? 'var(--accent-border)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            {viable ? (
              <CheckCircle2 size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={20} style={{ color: 'var(--destructive)', flexShrink: 0 }} />
            )}
            <div>
              <p className="font-semibold text-sm" style={{ color: viable ? 'var(--accent)' : 'var(--destructive)' }}>
                Proyecto {viable ? 'VIABLE' : 'NO VIABLE'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {viable
                  ? `El VPN positivo indica que el proyecto supera la TIO del ${result.tio}% y crea valor.`
                  : `El VPN negativo indica que el proyecto no alcanza la TIO exigida del ${result.tio}%.`}
              </p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {/* VPN */}
            <div
              className="card p-4"
              style={viable ? { borderColor: 'var(--accent-border)', background: 'var(--accent-bg)' } : {}}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-xs uppercase tracking-widest mono" style={{ color: viable ? 'var(--accent)' : 'var(--muted)' }}>
                  VPN
                </p>
                <InfoTip>Valor Presente Neto: suma de los flujos descontados a la TIO. Si VPN &gt; 0, el proyecto es rentable.</InfoTip>
              </div>
              <p className="result-number text-2xl" style={{ color: viable ? 'var(--accent)' : 'var(--destructive)' }}>
                {fmtCOP(result.vpn)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                a TIO = {result.tio}%
              </p>
            </div>

            {/* TIR */}
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-xs uppercase tracking-widest mono" style={{ color: 'var(--muted)' }}>
                  TIR
                </p>
                <InfoTip>Tasa Interna de Retorno: tasa que hace VPN = 0. Si TIR &gt; TIO, el proyecto es viable.</InfoTip>
              </div>
              {result.tir !== null ? (
                <>
                  <p
                    className="result-number text-2xl"
                    style={{ color: result.tir > result.tio ? 'var(--accent)' : 'var(--destructive)' }}
                  >
                    {fmtPct(result.tir, 2)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {result.tir > result.tio ? `TIR > TIO (${result.tio}%) ✓` : `TIR < TIO (${result.tio}%) ✗`}
                  </p>
                </>
              ) : (
                <>
                  <p className="result-number text-xl" style={{ color: 'var(--muted)' }}>N/A</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>No convergente</p>
                </>
              )}
            </div>

            {/* Payback */}
            <div className="card p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <p className="text-xs uppercase tracking-widest mono" style={{ color: 'var(--muted)' }}>
                  Período de Recuperación
                </p>
                <InfoTip>Tiempo necesario para recuperar la inversión inicial con los flujos nominales (sin descontar).</InfoTip>
              </div>
              {result.payback !== null ? (
                <>
                  <p className="result-number text-2xl" style={{ color: 'var(--text)' }}>
                    {result.payback.toFixed(2)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    períodos para recuperar la inversión
                  </p>
                </>
              ) : (
                <>
                  <p className="result-number text-xl" style={{ color: 'var(--muted)' }}>No recupera</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>con los flujos ingresados</p>
                </>
              )}
            </div>
          </div>

          {/* Cash flow table */}
          <div className="card overflow-hidden mb-5">
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Tabla de flujos descontados (TIO = {result.tio}%)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    {['Período', 'Flujo', 'Factor descuento', 'Flujo descontado', 'Acumulado'].map((h) => (
                      <th
                        key={h}
                        className="py-2.5 px-4 text-right first:text-center mono uppercase tracking-wider"
                        style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', fontWeight: 400 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.cashFlows.map((cf, t) => {
                    const factor = 1 / Math.pow(1 + result.tio / 100, t)
                    const discounted = cf * factor
                    const accumulated = result.cashFlows
                      .slice(0, t + 1)
                      .reduce((acc, c, i) => acc + c / Math.pow(1 + result.tio / 100, i), 0)
                    return (
                      <tr
                        key={t}
                        style={{
                          background: t % 2 === 0 ? 'transparent' : 'var(--surface2)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <td className="py-2 px-4 text-center" style={{ color: 'var(--muted)' }}>
                          {t === 0 ? 'Inversión' : t}
                        </td>
                        <td className="py-2 px-4 text-right mono" style={{ color: cf < 0 ? 'var(--destructive)' : 'var(--text)' }}>
                          {fmtCOP(cf)}
                        </td>
                        <td className="py-2 px-4 text-right mono" style={{ color: 'var(--muted)' }}>
                          {factor.toFixed(6)}
                        </td>
                        <td
                          className="py-2 px-4 text-right mono"
                          style={{ color: discounted >= 0 ? 'var(--accent)' : 'var(--destructive)' }}
                        >
                          {fmtCOP(discounted)}
                        </td>
                        <td
                          className="py-2 px-4 text-right mono font-medium"
                          style={{ color: accumulated >= 0 ? 'var(--accent)' : 'var(--destructive)' }}
                        >
                          {fmtCOP(accumulated)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sensitivity Analysis Chart */}
          <div className="card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
                <p className="text-xs uppercase tracking-widest mono" style={{ color: 'var(--muted)' }}>
                  Perfil del VPN — Análisis de Sensibilidad
                </p>
              </div>
              <InfoTip>Muestra cómo el VPN cambia según la TIO. El cruce con cero corresponde a la TIR del proyecto.</InfoTip>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={result.sensitivity} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="tio"
                  tick={{ fill: 'var(--chart-tick)', fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                  label={{ value: 'TIO (%)', position: 'insideBottom', offset: -4, fill: 'var(--muted)', fontSize: 10 }}
                />
                <YAxis
                  width={72}
                  tick={{ fill: 'var(--chart-tick)', fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                />
                <Tooltip content={<ChartTooltip />} />
                {/* Zero line */}
                <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="4 4" />
                {/* Current TIO */}
                <ReferenceLine
                  x={result.tio}
                  stroke="var(--gold)"
                  strokeWidth={1.5}
                  label={{ value: `TIO ${result.tio}%`, position: 'top', fill: 'var(--gold)', fontSize: 9 }}
                />
                {/* TIR marker */}
                {result.tir !== null && result.tir >= 0 && result.tir <= 50 && (
                  <ReferenceDot
                    x={Math.round(result.tir)}
                    y={0}
                    r={5}
                    fill="var(--destructive)"
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: `TIR≈${result.tir.toFixed(1)}%`,
                      position: 'top',
                      fill: 'var(--destructive)',
                      fontSize: 9,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="VPN"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--accent)' }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{ background: 'var(--accent)' }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Curva VPN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{ background: 'var(--gold)' }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>TIO actual ({result.tio}%)</span>
              </div>
              {result.tir !== null && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: 'var(--destructive)' }} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>TIR ({result.tir.toFixed(2)}%)</span>
                </div>
              )}
            </div>
          </div>

          {/* Export button */}
          <div className="flex justify-end no-print">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Printer size={15} />
              Exportar Reporte Ejecutivo
            </button>
          </div>

          {/* ── Print-only Executive Report ─────────────────────── */}
          <div ref={printRef} className="print-only executive-report">
            <div className="report-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontFamily: 'Fraunces, serif', color: '#1a1a2e', margin: 0 }}>
                    Fin<span style={{ color: '#4f46e5' }}>Calc</span>
                  </h1>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                    Ingeniería Económica · Reporte Ejecutivo
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                    {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Análisis VPN / TIR</p>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '2px solid #4f46e5', marginBottom: 24 }} />
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
              1. Resumen Ejecutivo
            </h2>
            <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
              El proyecto evaluado con una inversión inicial de{' '}
              <strong>{fmtCOP(Math.abs(result.cashFlows[0]))}</strong> y una Tasa de Interés de Oportunidad
              (TIO) del <strong>{result.tio}%</strong> arroja un Valor Presente Neto de{' '}
              <strong style={{ color: result.vpn >= 0 ? '#059669' : '#dc2626' }}>{fmtCOP(result.vpn)}</strong>.{' '}
              {result.vpn >= 0
                ? `La viabilidad financiera queda confirmada: el proyecto genera valor por encima de la tasa mínima requerida.`
                : `El proyecto no alcanza la rentabilidad mínima exigida y se recomienda revisar los supuestos o buscar alternativas.`}
            </p>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
              2. Indicadores Clave
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'VPN', value: fmtCOP(result.vpn), sub: `a TIO ${result.tio}%`, color: result.vpn >= 0 ? '#059669' : '#dc2626' },
                { label: 'TIR', value: result.tir !== null ? `${result.tir.toFixed(2)}%` : 'N/A', sub: result.tir !== null ? (result.tir > result.tio ? 'TIR > TIO ✓' : 'TIR < TIO ✗') : 'No convergente', color: result.tir !== null && result.tir > result.tio ? '#059669' : '#6b7280' },
                { label: 'Período de Recuperación', value: result.payback !== null ? `${result.payback.toFixed(2)} períodos` : 'No recupera', sub: 'con flujos nominales', color: '#1a1a2e' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px' }}>
                  <p style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color, margin: '0 0 2px', fontFamily: 'JetBrains Mono, monospace' }}>{value}</p>
                  <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
              3. Flujos de Caja del Proyecto
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  {['Período', 'Flujo', 'Factor (1+TIO)⁻ᵗ', 'Flujo descontado', 'VPN Acumulado'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#6b7280', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e5e7eb' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.cashFlows.map((cf, t) => {
                  const factor = 1 / Math.pow(1 + result.tio / 100, t)
                  const discounted = cf * factor
                  const accumulated = result.cashFlows.slice(0, t + 1).reduce((acc, c, i) => acc + c / Math.pow(1 + result.tio / 100, i), 0)
                  return (
                    <tr key={t} style={{ borderBottom: '1px solid #f3f4f6', background: t % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '7px 12px', textAlign: 'center', color: '#6b7280' }}>{t === 0 ? 'Inversión' : t}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: cf < 0 ? '#dc2626' : '#111827' }}>{fmtCOP(cf)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: '#9ca3af' }}>{factor.toFixed(6)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', color: discounted >= 0 ? '#059669' : '#dc2626' }}>{fmtCOP(discounted)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: accumulated >= 0 ? '#059669' : '#dc2626' }}>{fmtCOP(accumulated)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
              4. Conclusión y Recomendación
            </h2>
            <div style={{ border: `2px solid ${result.vpn >= 0 ? '#059669' : '#dc2626'}`, borderRadius: 8, padding: '14px 16px', background: result.vpn >= 0 ? '#f0fdf4' : '#fef2f2' }}>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                {result.vpn >= 0
                  ? `Con un VPN de ${fmtCOP(result.vpn)} y una TIR del ${result.tir?.toFixed(2) ?? 'N/A'}%, el proyecto supera la TIO exigida del ${result.tio}%. Se RECOMIENDA su ejecución. La inversión se recupera en aproximadamente ${result.payback?.toFixed(2) ?? '—'} períodos.`
                  : `Con un VPN de ${fmtCOP(result.vpn)}, el proyecto destruye valor a la TIO del ${result.tio}%. Se recomienda NO ejecutarlo en las condiciones actuales. Considere revisar los flujos de caja o buscar una TIO menor.`}
              </p>
            </div>

            <div style={{ marginTop: 32, paddingTop: 12, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 9, color: '#9ca3af', margin: 0 }}>Generado por Finametrics · Ingeniería Económica</p>
              <p style={{ fontSize: 9, color: '#9ca3af', margin: 0 }}>Documento académico — No constituye asesoría financiera</p>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && (
        <div className="card p-10 flex flex-col items-center gap-4 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
          >
            <Info size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Ingresa los datos del proyecto
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Define la TIO, la inversión inicial y los flujos por período. El análisis de sensibilidad
              aparecerá automáticamente al calcular.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
