import type {
  AmortResult,
  AmortRow,
  AnnuityResult,
  InflationResult,
  RateMode,
  CalcStep,
} from '../types/finance.types'
import { fmtCOP, fmtNumber, fmtPct } from '../utils/format'

// ============================================================
// AMORTIZATION
// ============================================================

export function calcFrenchAmortization(
  P: number,
  iPct: number,
  n: number,
  mode: RateMode
): AmortResult {
  const i = iPct / 100
  let payment: number

  if (mode === 'vencido') {
    payment = (P * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1)
  } else {
    payment = (P * (i * Math.pow(1 + i, n))) / ((Math.pow(1 + i, n) - 1) * (1 + i))
  }

  const rows: AmortRow[] = []
  let balance = P

  for (let k = 1; k <= n; k++) {
    let interest: number
    let principal: number

    if (mode === 'vencido') {
      interest = balance * i
      principal = payment - interest
    } else {
      principal = payment - (balance * i) / (1 + i)
      interest = payment - principal
    }

    // Última cuota: ajustar exactamente al saldo restante
    if (k === n) {
      principal = balance
      interest = balance * (mode === 'vencido' ? i : i / (1 + i))
    }

    const actualPayment = k === n ? principal + interest : payment
    const finalBalance = Math.max(0, balance - principal)

    rows.push({
      period: k,
      initialBalance: balance,
      payment: actualPayment,
      interest,
      principal,
      finalBalance,
    })
    balance = finalBalance
  }

  const totalPaid = payment * n
  const totalInterest = totalPaid - P
  return {
    payment,
    totalPaid,
    totalInterest,
    totalPrincipal: P,
    rows,
    system: 'fixed-payment',
    interestType: 'compound',
    mode,
  }
}

export function calcGermanAmortization(P: number, iPct: number, n: number): AmortResult {
  const i = iPct / 100
  const principalPerPeriod = P / n
  const rows: AmortRow[] = []
  let balance = P
  let totalPaid = 0

  for (let k = 1; k <= n; k++) {
    const interest = balance * i
    const payment = principalPerPeriod + interest
    const finalBalance = Math.max(0, balance - principalPerPeriod)
    rows.push({
      period: k,
      initialBalance: balance,
      payment,
      interest,
      principal: principalPerPeriod,
      finalBalance,
    })
    balance = finalBalance
    totalPaid += payment
  }

  return {
    payment: rows[0].payment,
    totalPaid,
    totalInterest: totalPaid - P,
    totalPrincipal: P,
    rows,
    system: 'constant-principal',
    interestType: 'compound',
    mode: 'vencido',
  }
}

export function calcSimpleFixedAmort(P: number, iPct: number, n: number): AmortResult {
  // Cuota Fija con interés simple (sistema "add-on", el estándar didáctico):
  // El interés total = P · i · n se calcula sobre el capital ORIGINAL y se reparte
  // por igual en las n cuotas. Por eso cada cuota tiene:
  //   • interés constante  = P · i
  //   • abono a capital constante = P / n
  // El total pagado = P · (1 + i · n) y el crédito se cancela exactamente en n cuotas.
  const i = iPct / 100
  const interestPerPeriod = P * i
  const principalPerPeriod = P / n
  const payment = principalPerPeriod + interestPerPeriod
  const rows: AmortRow[] = []
  let balance = P
  let totalPaid = 0

  for (let k = 1; k <= n; k++) {
    // La última cuota cierra exactamente el saldo (corrige redondeos)
    const principal = k === n ? balance : principalPerPeriod
    const actualPayment = principal + interestPerPeriod
    const finalBalance = Math.max(0, balance - principal)

    rows.push({
      period: k,
      initialBalance: balance,
      payment: actualPayment,
      interest: interestPerPeriod,
      principal,
      finalBalance,
    })
    balance = finalBalance
    totalPaid += actualPayment
  }

  return {
    payment,
    totalPaid,
    totalInterest: totalPaid - P,
    totalPrincipal: P,
    rows,
    system: 'fixed-payment',
    interestType: 'simple',
    mode: 'vencido',
  }
}

export function calcSimpleConstantPrincipalAmort(P: number, iPct: number, n: number): AmortResult {
  // Capital Constante + Intereses con interés simple:
  // Capital por período = P/n (constante)
  // Interés calculado sobre el saldo RESTANTE (decreciente)
  // Cuota decrece cada período
  const i = iPct / 100
  const principalPerPeriod = P / n
  const rows: AmortRow[] = []
  let balance = P
  let totalPaid = 0

  for (let k = 1; k <= n; k++) {
    const interest = balance * i // sobre saldo restante
    const payment = principalPerPeriod + interest
    const finalBalance = Math.max(0, balance - principalPerPeriod)
    rows.push({
      period: k,
      initialBalance: balance,
      payment,
      interest,
      principal: principalPerPeriod,
      finalBalance,
    })
    balance = finalBalance
    totalPaid += payment
  }

  return {
    payment: rows[0].payment,
    totalPaid,
    totalInterest: totalPaid - P,
    totalPrincipal: P,
    rows,
    system: 'constant-principal',
    interestType: 'simple',
    mode: 'vencido',
  }
}

// ============================================================
// ANNUITIES / SERIES UNIFORMES
// PV = PMT * [1 - (1+i)^-n] / i
// FV = PMT * [(1+i)^n - 1] / i
// ============================================================

export function calcAnnuityPV(PMT: number, iPct: number, n: number): AnnuityResult {
  const i = iPct / 100
  const PV = (PMT * (1 - Math.pow(1 + i, -n))) / i
  const FV = (PMT * (Math.pow(1 + i, n) - 1)) / i
  const totalPaid = PMT * n
  // Balance tras k pagos = VP de los (n-k) pagos restantes
  const series = Array.from({ length: Math.min(n, 60) }, (_, k) => ({
    period: k + 1,
    payment: PMT,
    balance: k < n ? (PMT * (1 - Math.pow(1 + i, -(n - k - 1)))) / i : 0,
  }))
  return { PV, FV, PMT, n, i, totalPaid, totalInterest: totalPaid - PV, series }
}

export function calcAnnuityFV(PMT: number, iPct: number, n: number): AnnuityResult {
  const i = iPct / 100
  const FV = (PMT * (Math.pow(1 + i, n) - 1)) / i
  const PV = (PMT * (1 - Math.pow(1 + i, -n))) / i
  const totalPaid = PMT * n
  // Saldo acumulado período a período: FV parcial del ahorro
  const series = Array.from({ length: Math.min(n, 60) }, (_, k) => ({
    period: k + 1,
    payment: PMT,
    balance: (PMT * (Math.pow(1 + i, k + 1) - 1)) / i,
  }))
  return { PV, FV, PMT, n, i, totalPaid, totalInterest: FV - totalPaid, series }
}

export function calcAnnuityPMT(PV: number, iPct: number, n: number): AnnuityResult {
  const i = iPct / 100
  const PMT = (PV * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1)
  const FV = (PMT * (Math.pow(1 + i, n) - 1)) / i
  // Saldo del crédito pendiente período a período
  const series = Array.from({ length: Math.min(n, 60) }, (_, k) => ({
    period: k + 1,
    payment: PMT,
    balance: PV * Math.pow(1 + i, k + 1) - (PMT * (Math.pow(1 + i, k + 1) - 1)) / i,
  }))
  return { PV, FV, PMT, n, i, totalPaid: PMT * n, totalInterest: PMT * n - PV, series }
}

// ============================================================
// INFLATION — Fisher equation
// (1 + iReal) = (1 + iNominal) / (1 + inflacion)
// ============================================================

export function calcRealRate(
  nominalPct: number,
  inflationPct: number,
  P: number,
  n: number
): InflationResult {
  const nom = nominalPct / 100
  const inf = inflationPct / 100
  const real = (1 + nom) / (1 + inf) - 1
  const nomFV = P * Math.pow(1 + nom, n)
  const realFV = P * Math.pow(1 + real, n)
  return {
    nominalRate: nom,
    inflationRate: inf,
    realRate: real,
    realRatePct: +(real * 100).toFixed(6),
    nominalFV: nomFV,
    realFV: realFV,
    purchasingPowerLoss: +(((nomFV - realFV) / nomFV) * 100).toFixed(2),
  }
}

// ============================================================
// PASO A PASO — explicaciones didácticas
// ============================================================

export function buildInflationSteps(r: InflationResult): CalcStep[] {
  const nomDec = fmtNumber(r.nominalRate, 4, 0)
  const infDec = fmtNumber(r.inflationRate, 4, 0)
  const ratio = fmtNumber((1 + r.nominalRate) / (1 + r.inflationRate), 6, 0)
  return [
    {
      title: 'Paso 1 — Pasar las dos tasas a decimal',
      expr: `iₙ = ${fmtPct(r.nominalRate * 100, 2)} → ${nomDec}   ·   π = ${fmtPct(r.inflationRate * 100, 2)} → ${infDec}`,
    },
    {
      title: 'Paso 2 — Dividir (1 + nominal) entre (1 + inflación)',
      expr: `(1 + iₙ) ÷ (1 + π) = ${fmtNumber(1 + r.nominalRate, 4, 0)} ÷ ${fmtNumber(1 + r.inflationRate, 4, 0)} = ${ratio}`,
      detail: 'Le quitamos a tu rendimiento el efecto de que todo sube de precio.',
    },
    {
      title: 'Paso 3 — Restar 1 para obtener la tasa real',
      expr: `iReal = ${ratio} − 1 = ${fmtPct(r.realRatePct, 4)}`,
      detail: 'Esta es la ganancia verdadera en poder de compra.',
    },
    {
      title: 'Paso 4 — Ver el poder adquisitivo',
      expr: `${fmtCOP(r.nominalFV)} del futuro valen como ${fmtCOP(r.realFV)} de hoy`,
      detail: `Se pierde ${r.purchasingPowerLoss}% de poder de compra por la inflación.`,
    },
  ]
}

export function buildAnnuitySteps(r: AnnuityResult, mode: 'PV' | 'FV' | 'PMT'): CalcStep[] {
  const iDec = fmtNumber(r.i, 6, 0)
  const n = fmtNumber(r.n, 0, 0)
  const pow = Math.pow(1 + r.i, r.n)
  const powTxt = fmtNumber(pow, 6, 0)

  if (mode === 'FV') {
    const factor = fmtNumber((pow - 1) / r.i, 6, 0)
    return [
      {
        title: 'Paso 1 — Pasar la tasa a decimal',
        expr: `i = ${fmtPct(r.i * 100, 2)} ÷ 100 = ${iDec}`,
      },
      {
        title: 'Paso 2 — Elevar (1 + i) a la cantidad de cuotas',
        expr: `(1 + i)^n = ${fmtNumber(1 + r.i, 6, 0)}^${n} = ${powTxt}`,
      },
      {
        title: 'Paso 3 — Calcular el factor de la serie',
        expr: `[(1 + i)^n − 1] ÷ i = (${powTxt} − 1) ÷ ${iDec} = ${factor}`,
        detail: 'Este factor acumula todos los aportes con sus intereses.',
      },
      {
        title: 'Paso 4 — Multiplicar por la cuota',
        expr: `FV = PMT × factor = ${fmtCOP(r.PMT)} × ${factor} = ${fmtCOP(r.FV)}`,
      },
    ]
  }

  if (mode === 'PV') {
    const factor = fmtNumber((1 - Math.pow(1 + r.i, -r.n)) / r.i, 6, 0)
    return [
      {
        title: 'Paso 1 — Pasar la tasa a decimal',
        expr: `i = ${fmtPct(r.i * 100, 2)} ÷ 100 = ${iDec}`,
      },
      {
        title: 'Paso 2 — Elevar (1 + i) a la cantidad de cuotas (negativo)',
        expr: `(1 + i)^-n = ${fmtNumber(Math.pow(1 + r.i, -r.n), 6, 0)}`,
      },
      {
        title: 'Paso 3 — Calcular el factor de la serie',
        expr: `[1 − (1 + i)^-n] ÷ i = ${factor}`,
        detail: 'Trae a hoy el valor de todos los pagos futuros.',
      },
      {
        title: 'Paso 4 — Multiplicar por la cuota',
        expr: `PV = PMT × factor = ${fmtCOP(r.PMT)} × ${factor} = ${fmtCOP(r.PV)}`,
      },
    ]
  }

  // mode === 'PMT'
  const num = fmtNumber(r.i * pow, 6, 0)
  const den = fmtNumber(pow - 1, 6, 0)
  return [
    {
      title: 'Paso 1 — Pasar la tasa a decimal',
      expr: `i = ${fmtPct(r.i * 100, 2)} ÷ 100 = ${iDec}`,
    },
    { title: 'Paso 2 — Elevar (1 + i) a la cantidad de cuotas', expr: `(1 + i)^n = ${powTxt}` },
    {
      title: 'Paso 3 — Armar el factor de la cuota',
      expr: `[i × (1 + i)^n] ÷ [(1 + i)^n − 1] = ${num} ÷ ${den} = ${fmtNumber((r.i * pow) / (pow - 1), 6, 0)}`,
    },
    {
      title: 'Paso 4 — Multiplicar por el valor presente',
      expr: `PMT = PV × factor = ${fmtCOP(r.PV)} × ${fmtNumber((r.i * pow) / (pow - 1), 6, 0)} = ${fmtCOP(r.PMT)}`,
    },
  ]
}

export function buildAmortSteps(r: AmortResult, iPct: number): CalcStep[] {
  const i = iPct / 100
  const iDec = fmtNumber(i, 6, 0)
  const row1 = r.rows[0]
  const steps: CalcStep[] = [
    { title: 'Paso 1 — Pasar la tasa a decimal', expr: `i = ${fmtPct(iPct, 2)} ÷ 100 = ${iDec}` },
  ]

  if (r.system === 'fixed-payment' && r.interestType === 'compound') {
    steps.push({
      title: 'Paso 2 — Calcular la cuota fija',
      expr: `Cuota = P × [i(1+i)ⁿ] ÷ [(1+i)ⁿ − 1] = ${fmtCOP(r.payment)}`,
      detail: 'Es el pago igual de todos los meses.',
    })
  } else if (r.system === 'fixed-payment' && r.interestType === 'simple') {
    steps.push({
      title: 'Paso 2 — Calcular la cuota fija (interés simple)',
      expr: `Cuota = P/n + P×i = ${fmtCOP(r.totalPrincipal / r.rows.length)} + ${fmtCOP(r.totalPrincipal * i)} = ${fmtCOP(r.payment)}`,
    })
  } else {
    steps.push({
      title: 'Paso 2 — Calcular el abono fijo a capital',
      expr: `Abono = P ÷ n = ${fmtCOP(row1.principal)}`,
      detail: 'En capital constante, cada mes abonas lo mismo al capital.',
    })
  }

  steps.push({
    title: 'Paso 3 — Interés del primer mes',
    expr: `Interés = saldo × i = ${fmtCOP(row1.initialBalance)} × ${iDec} = ${fmtCOP(row1.interest)}`,
    detail: 'El interés se cobra sobre lo que aún debes.',
  })
  steps.push({
    title: 'Paso 4 — Cuánto baja la deuda',
    expr: `Saldo final = ${fmtCOP(row1.initialBalance)} − ${fmtCOP(row1.principal)} = ${fmtCOP(row1.finalBalance)}`,
    detail: 'Y así, mes a mes, hasta que el saldo llega a cero.',
  })
  return steps
}
