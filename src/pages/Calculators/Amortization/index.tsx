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
  InfoTip,
  StepByStep,
  ModuleNav,
  useCarryReceive,
  ModeSwitch,
  MoneyField,
  type UiMode,
} from '../../../components/ui'
import {
  calcFrenchAmortization,
  calcGermanAmortization,
  buildAmortSteps,
} from '../../../lib/financial'
import { fmtCOP, fmtPct, fmtNumber } from '../../../utils/format'
import type { AmortResult } from '../../../types/finance.types'

// ─── Tipos de tasa que puede ingresar el usuario ──────────────────────────────
const RATE_TYPES = [
  { value: 'em', label: 'Efectiva mensual (EM)' },
  { value: 'ea', label: 'Efectiva anual (EA)' },
  { value: 'nom', label: 'Nominal mensual (NMV)' },
]

const SYSTEMS = [
  { value: 'fixed-payment', label: 'Cuota Fija (Francés)' },
  { value: 'constant-principal', label: 'Capital Constante (Alemán)' },
]

const PAGE_SIZE = 20

// ─── Conversión de tasa a tasa mensual efectiva ───────────────────────────────
function toMonthlyEffective(iPct: number, rateType: string): { monthly: number; convMsg: string | null } {
  if (rateType === 'em') {
    return { monthly: iPct, convMsg: null }
  }
  if (rateType === 'ea') {
    const monthly = (Math.pow(1 + iPct / 100, 1 / 12) - 1) * 100
    return {
      monthly,
      convMsg: `Tasa EA ${fmtNumber(iPct, 4)}% convertida a efectiva mensual: ${fmtNumber(monthly, 6)}% EM`,
    }
  }
  // nom = nominal mensual vencida → dividir entre 12 meses → ya es mensual
  const monthly = iPct / 12
  return {
    monthly,
    convMsg: `Tasa nominal mensual ${fmtNumber(iPct, 4)}% NMV convertida a efectiva mensual: ${fmtNumber(monthly, 6)}% EM`,
  }
}

function runCalc(system: string, P: number, monthlyPct: number, n: number): AmortResult {
  return system === 'fixed-payment'
    ? calcFrenchAmortization(P, monthlyPct, n, 'vencido')
    : calcGermanAmortization(P, monthlyPct, n)
}

const money0 = (v: number) => `$ ${fmtNumber(v, 0, 0)}`

export default function AmortizationPage() {
  const [uiMode, setUiMode] = useState<UiMode>('experto')
  const [system, setSystem] = useState('fixed-payment')
  const [rateType, setRateType] = useState('em')
  const [P, setP] = useState('72000')
  const [iPct, setIPct] = useState('0.18')
  const [n, setN] = useState('36')
  const [result, setResult] = useState<AmortResult | null>(null)
  const [convMsg, setConvMsg] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)

  useCarryReceive((p) => {
    setUiMode('experto')
    const np = p.amount != null ? String(Math.round(p.amount)) : P
    const ni = p.rate != null ? String(+p.rate.toFixed(6)) : iPct
    const nn = p.periods != null ? String(Math.round(p.periods)) : n
    setRateType('em')
    setSystem('fixed-payment')
    setP(np)
    setIPct(ni)
    setN(nn)
    setPage(0)
    try {
      const { monthly, convMsg: cm } = toMonthlyEffective(+ni, 'em')
      setConvMsg(cm)
      setResult(calcFrenchAmortization(+np, monthly, +nn, 'vencido'))
    } catch {
      /* noop */
    }
  })

  function resetAll() {
    setResult(null)
    setError('')
    setConvMsg(null)
    setPage(0)
  }
  function switchUiMode(m: UiMode) {
    setUiMode(m)
    resetAll()
  }

  function calculate() {
    setError('')
    setPage(0)
    setConvMsg(null)
    const pVal = +P
    const iVal = +iPct
    const nVal = +n
    if (!pVal || !iVal || !nVal || pVal <= 0 || iVal <= 0 || nVal <= 0) {
      setError('Ingresa valores válidos para monto, tasa y número de cuotas.')
      return
    }
    try {
      const { monthly, convMsg: cm } = toMonthlyEffective(iVal, rateType)
      setConvMsg(cm)
      setResult(runCalc(system, pVal, monthly, nVal))
    } catch (e: any) {
      setError(e.message)
    }
  }

  function loadExample() {
    setUiMode('experto')
    setSystem('fixed-payment')
    setRateType('em')
    setP('72000')
    setIPct('0.18')
    setN('36')
    setPage(0)
    setError('')
    setConvMsg(null)
    try {
      setResult(calcFrenchAmortization(72000, 0.18, 36, 'vencido'))
    } catch {
      /* noop */
    }
  }

  // Fila 0 = desembolso inicial
  const rows = result
    ? [
        {
          period: 0,
          initialBalance: 0,
          payment: 0,
          interest: 0,
          principal: 0,
          finalBalance: result.totalPrincipal,
        },
        ...result.rows,
      ]
    : []
  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function downloadExcel() {
    import('xlsx').then((XLSX) => {
      const data = rows.map((row) => ({
        Periodo: row.period,
        Cuota: row.period === 0 ? '' : row.payment,
        Intereses: row.period === 0 ? '' : row.interest,
        'Ab. Capital': row.period === 0 ? '' : row.principal,
        Saldo: row.finalBalance,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Amortización')
      XLSX.writeFile(wb, 'tabla_amortizacion.xlsx')
    })
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        chip="Módulo 05"
        title="Tabla de Amortización"
        description="Genera la tabla completa de un crédito: cuotas, intereses, abono a capital y saldo período a período."
      />

      <ModeSwitch value={uiMode} onChange={switchUiMode} />

      {/* ── Formulario ── */}
      <div className="card p-6 mb-6">
        {/* Sistema */}
        <div className="mb-4">
          <p className="text-xs mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
            Sistema de amortización
          </p>
          <ModeTabs options={SYSTEMS} value={system} onChange={(v) => { setSystem(v); setResult(null) }} />
        </div>

        {/* Tipo de tasa */}
        <div className="mb-5">
          <p className="text-xs mono uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
            Tipo de tasa ingresada
          </p>
          <ModeTabs options={RATE_TYPES} value={rateType} onChange={(v) => { setRateType(v); setResult(null) }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <MoneyField
            label={
              <>
                Monto del crédito (P){' '}
                <InfoTip>El capital que se va a amortizar.</InfoTip>
              </>
            }
            value={P}
            onChange={setP}
            placeholder="ej: 72000"
          />
          <Field
            label={
              <>
                Tasa de interés (i){' '}
                <InfoTip>
                  {rateType === 'em'
                    ? 'Tasa efectiva mensual. Ej: 0.18 para 0.18% EM.'
                    : rateType === 'ea'
                    ? 'Tasa efectiva anual. Ej: 20 para 20% EA.'
                    : 'Tasa nominal mensual vencida. Ej: 24 para 24% NMV.'}
                </InfoTip>
              </>
            }
            value={iPct}
            onChange={setIPct}
            placeholder={rateType === 'em' ? 'ej: 0.18' : rateType === 'ea' ? 'ej: 20' : 'ej: 24'}
            unit="%"
          />
          <Field
            label="Número de cuotas (n)"
            value={n}
            onChange={setN}
            placeholder="ej: 36"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={calculate}>
            → Generar tabla
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

      {/* ── Resultado ── */}
      {result && (
        <div className="animate-fade-up">
          {/* Aviso de conversión de tasa */}
          {convMsg && (
            <Callout color="gold">
              🔄 <strong>Conversión de tasa aplicada:</strong> {convMsg}
            </Callout>
          )}

          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ResultCard
              accent
              label={result.system === 'fixed-payment' ? 'Cuota fija' : '1ª Cuota'}
              value={fmtCOP(result.payment)}
            />
            <ResultCard label="Total pagado" value={fmtCOP(result.totalPaid)} />
            <ResultCard label="Total intereses" value={fmtCOP(result.totalInterest)} />
            <ResultCard
              label="Costo financiero"
              value={fmtPct((result.totalInterest / result.totalPrincipal) * 100, 2)}
              sub={[
                {
                  label: 'Sistema',
                  value: result.system === 'fixed-payment' ? 'Francés (Cuota Fija)' : 'Alemán (Capital Cte.)',
                },
              ]}
            />
          </div>

          <StepByStep steps={buildAmortSteps(result, +iPct)} />

          {/* ── TABLA DE AMORTIZACIÓN ── */}
          <div className="card overflow-hidden mt-6">
            <div
              className="px-5 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <p className="text-xs mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Tabla de amortización — {result.rows.length} cuotas ·{' '}
                {result.system === 'fixed-payment' ? 'Sistema Francés' : 'Sistema Alemán'}
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
                    {['Periodo', 'Cuota', 'Interés', 'Ab. Capital', 'Saldo'].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-right first:text-center text-xs mono uppercase tracking-wider"
                        style={{
                          color: 'var(--muted)',
                          borderBottom: '1px solid var(--border)',
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, idx) => (
                    <tr
                      key={row.period}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'var(--surface2)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {/* Periodo */}
                      <td className="py-2 px-4 text-center mono text-xs" style={{ color: 'var(--muted)' }}>
                        {row.period}
                      </td>
                      {/* Cuota */}
                      <td className="py-2 px-4 text-right mono text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                        {row.period === 0 ? '' : fmtNumber(row.payment, 0)}
                      </td>
                      {/* Interés */}
                      <td className="py-2 px-4 text-right mono text-xs" style={{ color: 'var(--destructive)' }}>
                        {row.period === 0 ? '' : fmtNumber(row.interest, 3)}
                      </td>
                      {/* Abono capital */}
                      <td className="py-2 px-4 text-right mono text-xs" style={{ color: 'var(--blue)' }}>
                        {row.period === 0 ? '' : fmtNumber(row.principal, 3)}
                      </td>
                      {/* Saldo */}
                      <td className="py-2 px-4 text-right mono text-xs" style={{ color: 'var(--text)' }}>
                        {fmtNumber(row.finalBalance, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-5 py-3 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: page === 0 ? 'var(--muted)' : 'var(--text)',
                  }}
                >
                  ← Anterior
                </button>
                <span className="text-xs mono" style={{ color: 'var(--muted)' }}>
                  Pág {page + 1} / {totalPages} · mostrando periodos {page * PAGE_SIZE}–{Math.min((page + 1) * PAGE_SIZE - 1, rows.length - 1)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: page === totalPages - 1 ? 'var(--muted)' : 'var(--text)',
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <ModuleNav
          current="/amortizacion"
          buildCarry={() => ({
            rate: +iPct,
            amount: result.totalPrincipal,
            periods: result.rows.length,
          })}
        />
      )}

      <Divider label="Referencia rápida" />
      <div className="card p-6 space-y-4 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.75 }}>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Sistema Francés vs Alemán
        </h3>
        <p>
          <strong style={{ color: 'var(--text)' }}>Francés (Cuota Fija):</strong> el pago total es
          igual en todos los períodos. Al inicio, la mayor parte es interés; al final, mayoritariamente
          capital. Es el sistema más usado en créditos de consumo e hipotecas.
        </p>
        <p>
          <strong style={{ color: 'var(--text)' }}>Alemán (Capital Constante):</strong> el abono al
          capital es el mismo cada período. Como el saldo decrece regularmente, el interés de cada
          período disminuye y la cuota total va bajando. La primera cuota es la más alta.
        </p>
        <h3 className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Conversión de tasas automática
        </h3>
        <div className="space-y-1">
          <FormulaBox formula="EA → EM: i_m = (1 + EA)^(1/12) − 1" />
          <FormulaBox formula="NMV → EM: i_m = NMV / 12" />
        </div>
        <p>
          Cuando ingresas una tasa EA o nominal, el sistema la convierte automáticamente a efectiva
          mensual antes de calcular. El aviso en color dorado te indica qué conversión se realizó.
        </p>
      </div>
    </div>
  )
}
