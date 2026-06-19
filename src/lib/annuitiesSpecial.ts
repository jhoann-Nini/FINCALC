import type { CalcStep } from '../types/finance.types'
import { fmtCOP, fmtNumber, fmtPct } from '../utils/format'

// ============================================================
// ANUALIDADES ESPECIALES — variantes de la serie uniforme:
//   • Ordinaria (vencida): pago al final de cada período.
//   • Anticipada:          pago al inicio → cada cuota gana un período
//                          extra de interés → se multiplica por (1+i).
//   • Diferida:            los pagos empiezan tras k períodos de gracia
//                          → el VP se descuenta k períodos más, ÷ (1+i)^k.
//   • Perpetua:            pagos infinitos → VP = PMT / i (sin VF finito).
// ============================================================

export type AnnuityType = 'ordinaria' | 'anticipada' | 'diferida' | 'perpetua'
export type AnnuityMode = 'PV' | 'FV' | 'PMT'

export interface AnnuityVariantResult {
  type: AnnuityType
  mode: AnnuityMode
  PMT: number
  PV: number
  FV: number | null // null en perpetua
  i: number
  iPct: number
  n: number
  defer: number
  totalPaid: number | null
  note: string
}

const NOTE: Record<AnnuityType, (defer: number) => string> = {
  ordinaria: () => 'Pagos al final de cada período (lo más común en créditos).',
  anticipada: () =>
    'Pagos al INICIO de cada período: cada cuota gana un período extra de interés, por eso el valor presente es mayor (se multiplica por (1+i)).',
  diferida: (d) =>
    `Los pagos empiezan tras ${d} período(s) de gracia: el valor presente se descuenta ${d} período(s) más, ÷ (1+i)^${d}.`,
  perpetua: () =>
    'Una perpetuidad paga para siempre: su valor presente es PMT ÷ i y no tiene valor futuro finito.',
}

export function calcAnnuityVariant(
  mode: AnnuityMode,
  type: AnnuityType,
  v: { PMT: number; PV: number; iPct: number; n: number; defer: number }
): AnnuityVariantResult {
  const i = v.iPct / 100
  const n = v.n
  const defer = Math.max(0, Math.round(v.defer))
  const pvFactor = (1 - Math.pow(1 + i, -n)) / i // (P/A, i, n)
  const fvFactor = (Math.pow(1 + i, n) - 1) / i // (F/A, i, n)

  // ── Perpetua: solo PV <-> PMT ──
  if (type === 'perpetua') {
    if (mode === 'PMT') {
      const PMT = v.PV * i
      return mk(type, 'PMT', PMT, v.PV, null, i, v.iPct, n, defer, null)
    }
    const PV = v.PMT / i
    return mk(type, 'PV', v.PMT, PV, null, i, v.iPct, n, defer, null)
  }

  const dueMul = type === 'anticipada' ? 1 + i : 1
  const deferDiv = type === 'diferida' ? Math.pow(1 + i, defer) : 1

  if (mode === 'PV') {
    const PMT = v.PMT
    const PV = (PMT * pvFactor * dueMul) / deferDiv
    const FV = PMT * fvFactor * dueMul
    return mk(type, 'PV', PMT, PV, FV, i, v.iPct, n, defer, PMT * n)
  }

  if (mode === 'FV') {
    const PMT = v.PMT
    const FV = PMT * fvFactor * dueMul // el diferimiento no cambia el VF al final de los pagos
    const PV = (PMT * pvFactor * dueMul) / deferDiv
    return mk(type, 'FV', PMT, PV, FV, i, v.iPct, n, defer, PMT * n)
  }

  // mode === 'PMT' (dado PV, hallar la cuota)
  const PMT = (v.PV * deferDiv) / (pvFactor * dueMul)
  const FV = PMT * fvFactor * dueMul
  return mk(type, 'PMT', PMT, v.PV, FV, i, v.iPct, n, defer, PMT * n)
}

function mk(
  type: AnnuityType,
  mode: AnnuityMode,
  PMT: number,
  PV: number,
  FV: number | null,
  i: number,
  iPct: number,
  n: number,
  defer: number,
  totalPaid: number | null
): AnnuityVariantResult {
  return { type, mode, PMT, PV, FV, i, iPct, n, defer, totalPaid, note: NOTE[type](defer) }
}

export function buildVariantSteps(r: AnnuityVariantResult): CalcStep[] {
  const iDec = fmtNumber(r.i, 6, 0)
  const steps: CalcStep[] = [
    { title: 'Paso 1 — Pasar la tasa a decimal', expr: `i = ${fmtPct(r.iPct, 2)} ÷ 100 = ${iDec}` },
  ]

  if (r.type === 'perpetua') {
    if (r.mode === 'PMT') {
      steps.push({
        title: 'Paso 2 — Cuota de una perpetuidad',
        expr: `PMT = PV × i = ${fmtCOP(r.PV)} × ${iDec} = ${fmtCOP(r.PMT)}`,
        detail: 'En una perpetuidad, la cuota es simplemente el interés que produce el capital.',
      })
    } else {
      steps.push({
        title: 'Paso 2 — Valor presente de una perpetuidad',
        expr: `PV = PMT ÷ i = ${fmtCOP(r.PMT)} ÷ ${iDec} = ${fmtCOP(r.PV)}`,
        detail: 'Pagos infinitos: el VP es finito porque los pagos lejanos casi no valen hoy.',
      })
    }
    return steps
  }

  const pvFactor = (1 - Math.pow(1 + r.i, -r.n)) / r.i
  steps.push({
    title: 'Paso 2 — Factor de la serie ordinaria (P/A)',
    expr: `(P/A) = [1 − (1+i)^-n] ÷ i = ${fmtNumber(pvFactor, 6, 0)}`,
  })

  if (r.type === 'anticipada') {
    steps.push({
      title: 'Paso 3 — Ajuste por anticipada',
      expr: `× (1 + i) = × ${fmtNumber(1 + r.i, 6, 0)}`,
      detail: 'Como se paga al inicio, cada cuota rinde un período más: se multiplica por (1+i).',
    })
  } else if (r.type === 'diferida') {
    steps.push({
      title: `Paso 3 — Ajuste por ${r.defer} período(s) de gracia`,
      expr: `÷ (1 + i)^${r.defer} = ÷ ${fmtNumber(Math.pow(1 + r.i, r.defer), 6, 0)}`,
      detail: 'Los pagos empiezan más tarde, así que se descuentan períodos adicionales.',
    })
  }

  if (r.mode === 'PMT') {
    steps.push({
      title: 'Paso final — Despejar la cuota',
      expr: `PMT = ${fmtCOP(r.PMT)}`,
    })
  } else {
    steps.push({
      title: 'Paso final — Multiplicar por la cuota',
      expr: `${r.mode === 'FV' ? 'FV' : 'PV'} = ${fmtCOP(r.mode === 'FV' ? (r.FV ?? 0) : r.PV)}`,
    })
  }
  return steps
}
