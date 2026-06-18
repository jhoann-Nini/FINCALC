import type { CompoundResult, CalcStep } from '../types/finance.types'
import { fmtCOP, fmtNumber, fmtPct } from '../utils/format'

// ============================================================
// COMPOUND INTEREST — F = P(1+i)^n
// ============================================================

function buildSeries(P: number, i: number, n: number) {
  const simple = P * i
  return Array.from({ length: Math.min(Math.ceil(n), 60) }, (_, k) => ({
    period: k + 1,
    balance: P * Math.pow(1 + i, k + 1),
    interestSimple: P + simple * (k + 1),
  }))
}

export function calcCompF(P: number, iPct: number, n: number): CompoundResult {
  const i = iPct / 100
  const factor = Math.pow(1 + i, n)
  const F = P * factor
  return { P, F, I: F - P, i, n, factor, iSimple: P * i * n, series: buildSeries(P, i, n) }
}

export function calcCompP(F: number, iPct: number, n: number): CompoundResult {
  const i = iPct / 100
  const factor = Math.pow(1 + i, n)
  const P = F / factor
  return { P, F, I: F - P, i, n, factor, iSimple: P * i * n, series: buildSeries(P, i, n) }
}

export function calcCompI(P: number, F: number, n: number): CompoundResult {
  if (F <= 0 || P <= 0) throw new Error('P y F deben ser positivos')
  if (n === 0) throw new Error('n no puede ser 0')
  const factor = F / P
  const i = Math.pow(factor, 1 / n) - 1
  return { P, F, I: F - P, i, n, factor, iSimple: P * i * n, series: buildSeries(P, i, n) }
}

export function calcCompN(P: number, F: number, iPct: number): CompoundResult {
  const i = iPct / 100
  if (i === 0) throw new Error('La tasa no puede ser 0')
  if (F <= P) throw new Error('F debe ser mayor que P')
  const factor = F / P
  const n = Math.log(factor) / Math.log(1 + i)
  return {
    P,
    F,
    I: F - P,
    i,
    n,
    factor,
    iSimple: P * i * n,
    series: buildSeries(P, i, Math.ceil(n)),
  }
}

// ============================================================
// PASO A PASO — explicación didáctica del cálculo
// ============================================================
export function buildCompoundSteps(
  r: CompoundResult,
  mode: 'F' | 'P' | 'i' | 'n',
  nUnit = 'períodos'
): CalcStep[] {
  const iDec = fmtNumber(r.i, 6, 0)
  const iPctTxt = fmtPct(r.i * 100, 2)
  const n = fmtNumber(r.n, 2, 0)
  const base = fmtNumber(1 + r.i, 6, 0)
  const factor = fmtNumber(Math.pow(1 + r.i, r.n), 6, 0)

  if (mode === 'F') {
    return [
      { title: 'Paso 1 — Pasar la tasa a decimal', expr: `i = ${iPctTxt} ÷ 100 = ${iDec}` },
      {
        title: 'Paso 2 — Sumar 1 a la tasa',
        expr: `1 + i = 1 + ${iDec} = ${base}`,
        detail: 'Cada período el dinero se multiplica por este número.',
      },
      {
        title: `Paso 3 — Elevar a la cantidad de ${nUnit}`,
        expr: `(1 + i)^n = ${base}^${n} = ${factor}`,
        detail: 'Aquí aparece la capitalización: interés sobre interés.',
      },
      {
        title: 'Paso 4 — Multiplicar por el capital',
        expr: `F = P × (1 + i)^n = ${fmtCOP(r.P)} × ${factor} = ${fmtCOP(r.F)}`,
      },
    ]
  }

  if (mode === 'P') {
    return [
      { title: 'Paso 1 — Pasar la tasa a decimal', expr: `i = ${iPctTxt} ÷ 100 = ${iDec}` },
      { title: 'Paso 2 — Sumar 1 a la tasa', expr: `1 + i = ${base}` },
      {
        title: `Paso 3 — Elevar a la cantidad de ${nUnit}`,
        expr: `(1 + i)^n = ${base}^${n} = ${factor}`,
      },
      {
        title: 'Paso 4 — Dividir el valor futuro entre el factor',
        expr: `P = F ÷ (1 + i)^n = ${fmtCOP(r.F)} ÷ ${factor} = ${fmtCOP(r.P)}`,
        detail: 'Esto se llama "traer a valor presente" o descontar.',
      },
    ]
  }

  if (mode === 'i') {
    const ratio = fmtNumber(r.F / r.P, 6, 0)
    const root = fmtNumber(Math.pow(r.F / r.P, 1 / r.n), 6, 0)
    return [
      {
        title: 'Paso 1 — Dividir el valor futuro entre el capital',
        expr: `F ÷ P = ${fmtCOP(r.F)} ÷ ${fmtCOP(r.P)} = ${ratio}`,
      },
      {
        title: `Paso 2 — Sacar la raíz ${nUnit} (elevar a 1/n)`,
        expr: `(F/P)^(1/n) = ${ratio}^(1/${n}) = ${root}`,
      },
      { title: 'Paso 3 — Restar 1', expr: `i = ${root} − 1 = ${iDec}` },
      { title: 'Paso 4 — Convertir a porcentaje', expr: `i = ${iDec} × 100 = ${iPctTxt}` },
    ]
  }

  // mode === 'n'
  const ratio = fmtNumber(r.F / r.P, 6, 0)
  const lnRatio = fmtNumber(Math.log(r.F / r.P), 6, 0)
  const lnBase = fmtNumber(Math.log(1 + r.i), 6, 0)
  return [
    {
      title: 'Paso 1 — Dividir el valor futuro entre el capital',
      expr: `F ÷ P = ${fmtCOP(r.F)} ÷ ${fmtCOP(r.P)} = ${ratio}`,
    },
    {
      title: 'Paso 2 — Aplicar logaritmo natural arriba y abajo',
      expr: `n = ln(F/P) ÷ ln(1 + i) = ln(${ratio}) ÷ ln(${base})`,
      detail: 'El logaritmo nos ayuda a "bajar" el exponente para despejar n.',
    },
    {
      title: 'Paso 3 — Calcular y dividir',
      expr: `n = ${lnRatio} ÷ ${lnBase} = ${n} ${nUnit}`,
    },
  ]
}
