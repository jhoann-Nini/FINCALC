// ============================================================
// FINANCE TYPES — shared across all calculation modules
// ============================================================

export type Period =
  | 'day'
  | 'week'
  | 'fortnight'
  | 'month'
  | 'bimonth'
  | 'quarter'
  | 'quadrimester'
  | 'semester'
  | 'year'
export type RateMode = 'vencido' | 'anticipado'
export type CapFreq = 1 | 2 | 4 | 12 | 52 | 365

export interface CalcError {
  field: string
  message: string
}

// --- Paso a paso (explicación didáctica de un cálculo) ---
export interface CalcStep {
  title: string // "Paso 1 — Pasar la tasa a decimal"
  expr?: string // "i = 2,5% ÷ 100 = 0,025"
  detail?: string // explicación en lenguaje sencillo
}

// --- Simple Interest ---
export interface SimpleResult {
  P: number
  F: number
  I: number
  i: number
  n: number
  iPct: number
}

// --- Compound Interest ---
export interface CompoundResult {
  P: number
  F: number
  I: number
  i: number
  n: number
  factor: number
  iSimple: number
  series: { period: number; balance: number; interestSimple: number }[]
}

// --- Rate Conversion ---
export interface RateConversionResult {
  inputLabel: string
  inputPct: number
  outputLabel: string
  outputPct: number
  formula: string
  equivalences: {
    label: string
    pct: number
    mode?: string
  }[]
  EA: number
  monthly: number
}

// --- Amortization ---
export interface AmortRow {
  period: number
  initialBalance: number
  payment: number
  interest: number
  principal: number
  finalBalance: number
}

export interface AmortResult {
  payment: number
  totalPaid: number
  totalInterest: number
  totalPrincipal: number
  rows: AmortRow[]
  system: 'fixed-payment' | 'constant-principal'
  interestType: 'compound' | 'simple'
  mode: RateMode
}

// --- Annuities ---
export interface AnnuityResult {
  PV: number
  FV: number
  PMT: number
  n: number
  i: number
  totalPaid: number
  totalInterest: number
  series: { period: number; payment: number; balance: number }[]
}

// --- Inflation ---
export interface InflationResult {
  nominalRate: number
  inflationRate: number
  realRate: number
  realRatePct: number
  nominalFV: number
  realFV: number
  purchasingPowerLoss: number
}

// --- History ---
export interface HistoryEntry {
  id: string
  module: string
  label: string
  inputs: Record<string, number | string>
  result: Record<string, number | string>
  timestamp: number
}
