// ============================================================
// FORMATTERS & UTILITIES
// Los decimales de moneda y tasas son configurables en Ajustes
// (ver store/settingsStore). Las llamadas con decimales explícitos
// mantienen su precisión; solo el valor por defecto es configurable.
// ============================================================

import { getMoneyDecimals, getRateDecimals } from '../store/settingsStore'

export function fmtCOP(n: number) {
  const d = getMoneyDecimals()
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
    useGrouping: true,
  }).format(n)
}
export function fmtUSD(n: number) {
  const d = getMoneyDecimals()
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: d,
    maximumFractionDigits: d,
    useGrouping: true,
  }).format(n)
}
export function fmtNumber(n: number, decimals = 2, minDecimals = 0) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: minDecimals,
    useGrouping: true,
  }).format(n)
}

export function fmtPct(n: number, d?: number) {
  const dec = d ?? getRateDecimals()
  return `${fmtNumber(n, dec, dec)}%`
}
export function fmtPctShort(n: number) {
  return `${fmtNumber(n, 2, 2)}%`
}

export function fmtCurrency(n: number, currency: 'COP' | 'USD' = 'COP') {
  return currency === 'COP' ? fmtCOP(n) : fmtUSD(n)
}

export function parseNumber(s: string): number {
  return parseFloat(s.replace(/[^0-9.-]/g, ''))
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max)
}

/**
 * Formatea una cadena de dígitos en pesos con separadores de miles y millones (puntos).
 * Ejemplo: "1000000" -> "1.000.000"
 */
export function formatMoneyInput(val: string): string {
  if (!val) return ''
  const clean = val.replace(/\D/g, '')
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Limpia cualquier separador para obtener una cadena de números pura.
 * Ejemplo: "1.000.000" -> "1000000"
 */
export function parseMoneyInput(val: string): string {
  return val.replace(/\D/g, '')
}

