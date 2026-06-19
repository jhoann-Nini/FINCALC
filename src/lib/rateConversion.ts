import type { RateConversionResult, CapFreq, CalcStep } from '../types/finance.types'
import { fmtNumber, fmtPct } from '../utils/format'

// ============================================================
// RATE CONVERSION
// EA → Nominal: iN = m * [(1+EA)^(1/m) - 1]
// Nominal → EA: EA = (1 + iN/m)^m - 1
// Anticipada ↔ Vencida: iV = iA/(1-iA), iA = iV/(1+iV)
// ============================================================

const freqLabel: Record<number, string> = {
  1: 'anual',
  2: 'semestral',
  4: 'trimestral',
  12: 'mensual',
  52: 'semanal',
  365: 'diaria',
}

function allEquivalences(EA: number) {
  const freqs: { m: number; label: string }[] = [
    { m: 365, label: 'Diaria' },
    { m: 52, label: 'Semanal' },
    { m: 12, label: 'Mensual MV' },
    { m: 4, label: 'Trimestral' },
    { m: 2, label: 'Semestral' },
    { m: 1, label: 'Anual EA' },
  ]
  const monthly = Math.pow(1 + EA, 1 / 12) - 1
  const iMA = monthly / (1 + monthly)
  const results = freqs.map(({ m, label }) => {
    const eff = Math.pow(1 + EA, 1 / m) - 1
    return { label, pct: +(eff * 100).toFixed(8) }
  })
  results.splice(2, 0, { label: 'Mensual MA', pct: +(iMA * 100).toFixed(8) })
  return { equivalences: results, monthly }
}

export function convertEAtoNominal(EAPct: number, m: CapFreq): RateConversionResult {
  const EA = EAPct / 100
  const effPer = Math.pow(1 + EA, 1 / m) - 1
  const iNom = effPer * m
  const { equivalences, monthly } = allEquivalences(EA)
  return {
    inputLabel: `Tasa EA`,
    inputPct: EAPct,
    outputLabel: `Nominal ${freqLabel[m] || m + 'x/año'}`,
    outputPct: +(iNom * 100).toFixed(8),
    formula: `iₙ = ${m} × [(1 + ${EAPct}%)^(1/${m}) − 1] = ${(iNom * 100).toFixed(6)}%`,
    equivalences,
    EA: EAPct,
    monthly: +(monthly * 100).toFixed(8),
  }
}

export function convertNominalToEA(nomPct: number, m: CapFreq): RateConversionResult {
  const effPer = nomPct / 100 / m
  const EA = Math.pow(1 + effPer, m) - 1
  const { equivalences, monthly } = allEquivalences(EA)
  return {
    inputLabel: `Nominal ${freqLabel[m] || m + 'x/año'}`,
    inputPct: nomPct,
    outputLabel: 'Tasa EA',
    outputPct: +(EA * 100).toFixed(8),
    formula: `EA = (1 + ${nomPct}%/${m})^${m} − 1 = ${(EA * 100).toFixed(6)}%`,
    equivalences,
    EA: +(EA * 100).toFixed(8),
    monthly: +(monthly * 100).toFixed(8),
  }
}

export function convertEAtoEffective(EAPct: number, m: CapFreq): RateConversionResult {
  const EA = EAPct / 100
  const effPer = Math.pow(1 + EA, 1 / m) - 1
  const { equivalences, monthly } = allEquivalences(EA)
  return {
    inputLabel: 'Tasa EA',
    inputPct: EAPct,
    outputLabel: `Efectiva ${freqLabel[m] || 'por período'}`,
    outputPct: +(effPer * 100).toFixed(8),
    formula: `iₑ = (1 + EA)^(1/${m}) − 1 = ${(effPer * 100).toFixed(6)}%`,
    equivalences,
    EA: EAPct,
    monthly: +(monthly * 100).toFixed(8),
  }
}

export function convertEffectiveToEA(effPct: number, m: CapFreq): RateConversionResult {
  const eff = effPct / 100
  const EA = Math.pow(1 + eff, m) - 1
  const { equivalences, monthly } = allEquivalences(EA)
  return {
    inputLabel: `Efectiva ${freqLabel[m] || 'por período'}`,
    inputPct: effPct,
    outputLabel: 'Tasa EA',
    outputPct: +(EA * 100).toFixed(8),
    formula: `EA = (1 + ${effPct}%)^${m} − 1 = ${(EA * 100).toFixed(6)}%`,
    equivalences,
    EA: +(EA * 100).toFixed(8),
    monthly: +(monthly * 100).toFixed(8),
  }
}

export function convertAnticipatedToVencida(iAPct: number): RateConversionResult {
  const iA = iAPct / 100
  if (iA >= 1) throw new Error('La tasa anticipada debe ser menor al 100%')
  const iV = iA / (1 - iA)
  const EA = Math.pow(1 + iV, 12) - 1
  const { equivalences, monthly } = allEquivalences(EA)
  return {
    inputLabel: 'Tasa Anticipada (MA)',
    inputPct: iAPct,
    outputLabel: 'Tasa Vencida (MV)',
    outputPct: +(iV * 100).toFixed(8),
    formula: `iᵥ = iₐ / (1 − iₐ) = ${iAPct}% / (1 − ${iAPct}%) = ${(iV * 100).toFixed(6)}%`,
    equivalences,
    EA: +(EA * 100).toFixed(8),
    monthly: +(monthly * 100).toFixed(8),
  }
}

export function convertVencidaToAnticipated(iVPct: number): RateConversionResult {
  const iV = iVPct / 100
  const iA = iV / (1 + iV)
  const EA = Math.pow(1 + iV, 12) - 1
  const { equivalences, monthly } = allEquivalences(EA)
  return {
    inputLabel: 'Tasa Vencida (MV)',
    inputPct: iVPct,
    outputLabel: 'Tasa Anticipada (MA)',
    outputPct: +(iA * 100).toFixed(8),
    formula: `iₐ = iᵥ / (1 + iᵥ) = ${iVPct}% / (1 + ${iVPct}%) = ${(iA * 100).toFixed(6)}%`,
    equivalences,
    EA: +(EA * 100).toFixed(8),
    monthly: +(monthly * 100).toFixed(8),
  }
}

// ============================================================
// PASO A PASO — explicación didáctica de cada conversión
// ============================================================
export function buildRateSteps(conv: string, inputPct: number, m: number): CalcStep[] {
  const x = inputPct / 100
  const out = (v: number) => fmtPct(v * 100, 6)
  const dec = (v: number) => fmtNumber(v, 8, 0)

  if (conv === 'NOM-EA') {
    const ip = x / m
    return [
      {
        title: `Paso 1 — Hallar la tasa de cada período (dividir entre ${m})`,
        expr: `i = ${fmtPct(inputPct, 2)} ÷ ${m} = ${out(ip)}`,
        detail: `La tasa nominal se reparte en sus ${m} capitalizaciones del año.`,
      },
      {
        title: `Paso 2 — Capitalizar: elevar a ${m} y restar 1`,
        expr: `EA = (1 + ${dec(ip)})^${m} − 1 = ${out(Math.pow(1 + ip, m) - 1)}`,
        detail: 'Aquí se nota el "interés sobre interés" que la nominal escondía.',
      },
    ]
  }
  if (conv === 'EA-NOM') {
    const ip = Math.pow(1 + x, 1 / m) - 1
    return [
      {
        title: `Paso 1 — Hallar la tasa de cada período (raíz ${m})`,
        expr: `i = (1 + ${fmtPct(inputPct, 2)})^(1/${m}) − 1 = ${out(ip)}`,
      },
      {
        title: `Paso 2 — Multiplicar por ${m} para volverla nominal`,
        expr: `Nominal = ${dec(ip)} × ${m} = ${out(ip * m)}`,
      },
    ]
  }
  if (conv === 'EA-EFF') {
    const ip = Math.pow(1 + x, 1 / m) - 1
    return [
      {
        title: `Paso 1 — Sacar la raíz ${m} de (1 + EA)`,
        expr: `(1 + ${fmtPct(inputPct, 2)})^(1/${m}) = ${dec(Math.pow(1 + x, 1 / m))}`,
      },
      { title: 'Paso 2 — Restar 1', expr: `i = ${dec(Math.pow(1 + x, 1 / m))} − 1 = ${out(ip)}` },
    ]
  }
  if (conv === 'EFF-EA') {
    return [
      {
        title: `Paso 1 — Elevar (1 + i) a ${m}`,
        expr: `(1 + ${fmtPct(inputPct, 2)})^${m} = ${dec(Math.pow(1 + x, m))}`,
      },
      {
        title: 'Paso 2 — Restar 1',
        expr: `EA = ${dec(Math.pow(1 + x, m))} − 1 = ${out(Math.pow(1 + x, m) - 1)}`,
      },
    ]
  }
  if (conv === 'ANT-VEN') {
    return [
      {
        title: 'Paso 1 — Restar la tasa anticipada de 1',
        expr: `1 − iₐ = 1 − ${dec(x)} = ${dec(1 - x)}`,
      },
      {
        title: 'Paso 2 — Dividir la anticipada entre ese resultado',
        expr: `iᵥ = ${dec(x)} ÷ ${dec(1 - x)} = ${out(x / (1 - x))}`,
        detail: 'La vencida siempre es un poco mayor que la anticipada.',
      },
    ]
  }
  // VEN-ANT
  return [
    {
      title: 'Paso 1 — Sumar 1 a la tasa vencida',
      expr: `1 + iᵥ = 1 + ${dec(x)} = ${dec(1 + x)}`,
    },
    {
      title: 'Paso 2 — Dividir la vencida entre ese resultado',
      expr: `iₐ = ${dec(x)} ÷ ${dec(1 + x)} = ${out(x / (1 + x))}`,
      detail: 'La anticipada siempre es un poco menor que la vencida.',
    },
  ]
}
