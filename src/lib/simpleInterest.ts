import type { SimpleResult, CalcStep } from '../types/finance.types'
import { fmtCOP, fmtNumber, fmtPct } from '../utils/format'

// ============================================================
// SIMPLE INTEREST — Pure functions, no React dependencies
// I = P * i * n
// F = P * (1 + i * n)
// ============================================================

function validate(vals: Record<string, number | undefined>) {
  for (const [k, v] of Object.entries(vals)) {
    if (v === undefined || isNaN(v)) throw new Error(`El campo "${k}" es requerido`)
    if (v < 0) throw new Error(`"${k}" no puede ser negativo`)
  }
}

export function calcSimpleF(P: number, iPct: number, n: number): SimpleResult {
  validate({ P, 'Tasa i': iPct, n })
  const i = iPct / 100
  const I = P * i * n
  const F = P + I
  return { P, F, I, i, n, iPct }
}

export function calcSimpleP(F: number, iPct: number, n: number): SimpleResult {
  validate({ F, 'Tasa i': iPct, n })
  if (n === 0) throw new Error('n no puede ser 0 al despejar P')
  const i = iPct / 100
  const P = F / (1 + i * n)
  const I = F - P
  return { P, F, I, i, n, iPct }
}

export function calcSimpleN(P: number, F: number, iPct: number): SimpleResult {
  validate({ P, F, 'Tasa i': iPct })
  if (iPct === 0) throw new Error('La tasa no puede ser 0 al despejar n')
  if (F <= P) throw new Error('F debe ser mayor que P para calcular n')
  const i = iPct / 100
  const I = F - P
  const n = I / (P * i)
  return { P, F, I, i, n, iPct }
}

export function calcSimpleI(P: number, F: number, n: number): SimpleResult {
  validate({ P, F, n })
  if (n === 0) throw new Error('n no puede ser 0 al despejar la tasa')
  if (F <= P) throw new Error('F debe ser mayor que P')
  const I = F - P
  const i = I / (P * n)
  const iPct = i * 100
  return { P, F, I, i, n, iPct }
}

// ============================================================
// PASO A PASO — explicación didáctica del cálculo
// `mode` indica qué variable se despejó; `nUnit` es la unidad (meses, años…)
// ============================================================
export function buildSimpleSteps(
  r: SimpleResult,
  mode: 'F' | 'P' | 'n' | 'i',
  nUnit = 'períodos'
): CalcStep[] {
  const iDec = fmtNumber(r.i, 6, 0)
  const n = fmtNumber(r.n, 2, 0)

  if (mode === 'F') {
    return [
      {
        title: 'Paso 1 — Pasar la tasa a decimal',
        expr: `i = ${fmtPct(r.iPct, 2)} ÷ 100 = ${iDec}`,
        detail: 'Los porcentajes se dividen entre 100 para poder multiplicar.',
      },
      {
        title: 'Paso 2 — Calcular el interés ganado',
        expr: `I = P × i × n = ${fmtCOP(r.P)} × ${iDec} × ${n} = ${fmtCOP(r.I)}`,
        detail: `Como es interés simple, el interés es igual cada ${nUnit.replace(/s$/, '')}.`,
      },
      {
        title: 'Paso 3 — Sumar el interés al capital',
        expr: `F = P + I = ${fmtCOP(r.P)} + ${fmtCOP(r.I)} = ${fmtCOP(r.F)}`,
        detail: 'El valor final es lo que pusiste más lo que ganaste.',
      },
    ]
  }

  if (mode === 'P') {
    const factor = fmtNumber(1 + r.i * r.n, 6, 0)
    return [
      {
        title: 'Paso 1 — Pasar la tasa a decimal',
        expr: `i = ${fmtPct(r.iPct, 2)} ÷ 100 = ${iDec}`,
      },
      {
        title: 'Paso 2 — Calcular el factor de crecimiento',
        expr: `1 + i × n = 1 + ${iDec} × ${n} = ${factor}`,
        detail: 'Este número dice cuántas veces creció el capital.',
      },
      {
        title: 'Paso 3 — Dividir el valor final entre el factor',
        expr: `P = F ÷ (1 + i × n) = ${fmtCOP(r.F)} ÷ ${factor} = ${fmtCOP(r.P)}`,
        detail: 'Así averiguamos cuánto necesitas poner hoy.',
      },
    ]
  }

  if (mode === 'n') {
    return [
      {
        title: 'Paso 1 — Pasar la tasa a decimal',
        expr: `i = ${fmtPct(r.iPct, 2)} ÷ 100 = ${iDec}`,
      },
      {
        title: 'Paso 2 — Calcular cuánto interés se debe ganar',
        expr: `I = F − P = ${fmtCOP(r.F)} − ${fmtCOP(r.P)} = ${fmtCOP(r.I)}`,
      },
      {
        title: 'Paso 3 — Dividir el interés entre lo que se gana por período',
        expr: `n = I ÷ (P × i) = ${fmtCOP(r.I)} ÷ ${fmtCOP(r.P * r.i)} = ${n} ${nUnit}`,
        detail: 'Cada período ganas P × i; dividimos para saber cuántos faltan.',
      },
    ]
  }

  // mode === 'i'
  return [
    {
      title: 'Paso 1 — Calcular el interés total ganado',
      expr: `I = F − P = ${fmtCOP(r.F)} − ${fmtCOP(r.P)} = ${fmtCOP(r.I)}`,
    },
    {
      title: 'Paso 2 — Repartir el interés entre capital y tiempo',
      expr: `i = I ÷ (P × n) = ${fmtCOP(r.I)} ÷ ${fmtCOP(r.P * r.n)} = ${iDec}`,
    },
    {
      title: 'Paso 3 — Convertir a porcentaje',
      expr: `i = ${iDec} × 100 = ${fmtPct(r.iPct, 2)}`,
      detail: 'Multiplicamos por 100 para volver a verlo como tasa.',
    },
  ]
}
