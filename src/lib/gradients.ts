import type { CalcStep } from '../types/finance.types'
import { fmtCOP, fmtNumber, fmtPct } from '../utils/format'

// ============================================================
// GRADIENTES — series de pagos que crecen período a período.
//   • Aritmético: cada pago aumenta una cantidad fija G.
//   • Geométrico: cada pago aumenta un porcentaje fijo g.
// El flujo del período k es:
//   aritmético  →  A + (k−1)·G
//   geométrico  →  A1 · (1+g)^(k−1)
// ============================================================

export interface GradientArithmeticResult {
  A: number
  G: number
  iPct: number
  i: number
  n: number
  PA: number // valor presente de la base uniforme A
  PG: number // valor presente del gradiente
  P: number // total = PA + PG
  FA: number
  FG: number
  F: number // total futuro
  Aeq: number // serie uniforme equivalente
  factorPG: number
  factorAG: number
  series: { period: number; cashflow: number }[]
}

export interface GradientGeometricResult {
  A1: number
  gPct: number
  g: number
  iPct: number
  i: number
  n: number
  P: number
  F: number
  equalRate: boolean
  series: { period: number; cashflow: number }[]
}

function seriesArr(fn: (k: number) => number, n: number) {
  return Array.from({ length: Math.min(Math.ceil(n), 60) }, (_, k) => ({
    period: k + 1,
    cashflow: fn(k + 1),
  }))
}

export function calcArithmeticGradient(
  A: number,
  G: number,
  iPct: number,
  n: number
): GradientArithmeticResult {
  const i = iPct / 100
  const pow = Math.pow(1 + i, n)
  // Factores estándar de ingeniería económica
  const factorPA = (1 - Math.pow(1 + i, -n)) / i // (P/A, i, n)
  const factorFA = (pow - 1) / i // (F/A, i, n)
  const factorPG = (pow - i * n - 1) / (i * i * pow) // (P/G, i, n)
  const factorFG = (pow - 1 - i * n) / (i * i) // (F/G, i, n)
  const factorAG = 1 / i - n / (pow - 1) // (A/G, i, n)

  const PA = A * factorPA
  const PG = G * factorPG
  const FA = A * factorFA
  const FG = G * factorFG
  const Aeq = A + G * factorAG

  return {
    A,
    G,
    iPct,
    i,
    n,
    PA,
    PG,
    P: PA + PG,
    FA,
    FG,
    F: FA + FG,
    Aeq,
    factorPG,
    factorAG,
    series: seriesArr((k) => A + (k - 1) * G, n),
  }
}

export function calcGeometricGradient(
  A1: number,
  gPct: number,
  iPct: number,
  n: number
): GradientGeometricResult {
  const i = iPct / 100
  const g = gPct / 100
  const equalRate = Math.abs(i - g) < 1e-9
  let P: number
  if (equalRate) {
    // Caso especial g = i
    P = (A1 * n) / (1 + i)
  } else {
    P = (A1 * (1 - Math.pow((1 + g) / (1 + i), n))) / (i - g)
  }
  const F = P * Math.pow(1 + i, n)
  return {
    A1,
    gPct,
    g,
    iPct,
    i,
    n,
    P,
    F,
    equalRate,
    series: seriesArr((k) => A1 * Math.pow(1 + g, k - 1), n),
  }
}

// ── Paso a paso ──────────────────────────────────────────────

export function buildArithmeticSteps(r: GradientArithmeticResult): CalcStep[] {
  const iDec = fmtNumber(r.i, 6, 0)
  return [
    {
      title: 'Paso 1 — Pasar la tasa a decimal',
      expr: `i = ${fmtPct(r.iPct, 2)} ÷ 100 = ${iDec}`,
    },
    {
      title: 'Paso 2 — Valor presente de la base uniforme (A)',
      expr: `P_A = A × (P/A) = ${fmtCOP(r.A)} × ${fmtNumber((1 - Math.pow(1 + r.i, -r.n)) / r.i, 6, 0)} = ${fmtCOP(r.PA)}`,
      detail: 'Es el pago igual que se repite todos los períodos (la parte fija).',
    },
    {
      title: 'Paso 3 — Valor presente del gradiente (G)',
      expr: `P_G = G × (P/G) = ${fmtCOP(r.G)} × ${fmtNumber(r.factorPG, 6, 0)} = ${fmtCOP(r.PG)}`,
      detail: 'El gradiente es el aumento constante que se suma cada período.',
    },
    {
      title: 'Paso 4 — Sumar ambas partes',
      expr: `P = P_A + P_G = ${fmtCOP(r.PA)} + ${fmtCOP(r.PG)} = ${fmtCOP(r.P)}`,
    },
    {
      title: 'Paso 5 — Serie uniforme equivalente',
      expr: `A_eq = A + G × (A/G) = ${fmtCOP(r.A)} + ${fmtCOP(r.G)} × ${fmtNumber(r.factorAG, 6, 0)} = ${fmtCOP(r.Aeq)}`,
      detail: 'El pago fijo único que equivale a toda la serie creciente.',
    },
  ]
}

export function buildGeometricSteps(r: GradientGeometricResult): CalcStep[] {
  const iDec = fmtNumber(r.i, 6, 0)
  const gDec = fmtNumber(r.g, 6, 0)
  if (r.equalRate) {
    return [
      {
        title: 'Paso 1 — Pasar tasa e incremento a decimal',
        expr: `i = ${fmtPct(r.iPct, 2)} = ${iDec}   ·   g = ${fmtPct(r.gPct, 2)} = ${gDec}`,
      },
      {
        title: 'Paso 2 — Caso especial: g = i',
        expr: `P = A₁ × n ÷ (1 + i) = ${fmtCOP(r.A1)} × ${fmtNumber(r.n, 0, 0)} ÷ ${fmtNumber(1 + r.i, 4, 0)} = ${fmtCOP(r.P)}`,
        detail: 'Cuando el crecimiento iguala a la tasa, la fórmula general se simplifica.',
      },
      {
        title: 'Paso 3 — Llevar a valor futuro',
        expr: `F = P × (1 + i)ⁿ = ${fmtCOP(r.F)}`,
      },
    ]
  }
  const ratio = Math.pow((1 + r.g) / (1 + r.i), r.n)
  return [
    {
      title: 'Paso 1 — Pasar tasa e incremento a decimal',
      expr: `i = ${fmtPct(r.iPct, 2)} = ${iDec}   ·   g = ${fmtPct(r.gPct, 2)} = ${gDec}`,
    },
    {
      title: 'Paso 2 — Calcular la razón [(1+g)/(1+i)]ⁿ',
      expr: `[(1+g)/(1+i)]ⁿ = ${fmtNumber(ratio, 6, 0)}`,
    },
    {
      title: 'Paso 3 — Aplicar la fórmula del gradiente geométrico',
      expr: `P = A₁ × [1 − razón] ÷ (i − g) = ${fmtCOP(r.A1)} × ${fmtNumber(1 - ratio, 6, 0)} ÷ ${fmtNumber(r.i - r.g, 6, 0)} = ${fmtCOP(r.P)}`,
      detail: 'Trae a hoy una serie que crece un porcentaje fijo cada período.',
    },
    {
      title: 'Paso 4 — Llevar a valor futuro',
      expr: `F = P × (1 + i)ⁿ = ${fmtCOP(r.F)}`,
    },
  ]
}
