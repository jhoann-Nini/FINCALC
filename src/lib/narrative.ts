// ============================================================
// NARRATIVA — traduce un resultado numérico a una frase en
// lenguaje sencillo, para que el estudiante entienda QUÉ significa
// el número, no solo cuál es.
// ============================================================
import { fmtCOP, fmtPct, fmtNumber } from '../utils/format'

export function narrateGrowth(opts: {
  P: number
  F: number
  I: number
  iPct: number
  n: number
  periodLabel: string
  kind: 'simple' | 'compuesto'
}): string {
  const { P, F, I, iPct, n, periodLabel, kind } = opts
  const growthPct = P > 0 ? ((F - P) / P) * 100 : 0
  const tipo =
    kind === 'compuesto'
      ? 'los intereses se capitalizan (interés sobre interés)'
      : 'el interés siempre se calcula sobre el capital original (crecimiento lineal)'
  return (
    `Si colocas ${fmtCOP(P)} a una tasa de ${fmtPct(iPct, 2)} por período durante ` +
    `${fmtNumber(n, 0)} ${periodLabel}, al final tendrás ${fmtCOP(F)}. ` +
    `Ganas ${fmtCOP(I)} en intereses —tu dinero crece un ${fmtPct(growthPct, 1)}— porque ${tipo}.`
  )
}
