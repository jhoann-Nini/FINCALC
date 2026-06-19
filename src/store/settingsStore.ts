import { create } from 'zustand'

const STORAGE_KEY = 'finametrics_settings'

export interface Settings {
  moneyDecimals: number // decimales para montos en $ (default 2)
  rateDecimals: number // decimales para tasas en % (default 4)
}

const DEFAULTS: Settings = { moneyDecimals: 2, rateDecimals: 4 }

function load(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      moneyDecimals: clampDec(raw.moneyDecimals, DEFAULTS.moneyDecimals),
      rateDecimals: clampDec(raw.rateDecimals, DEFAULTS.rateDecimals),
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function clampDec(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : fallback
  return Math.min(8, Math.max(0, Math.round(n)))
}

interface SettingsStore extends Settings {
  setMoneyDecimals: (n: number) => void
  setRateDecimals: (n: number) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...load(),
  setMoneyDecimals(n) {
    const moneyDecimals = clampDec(n, DEFAULTS.moneyDecimals)
    persist({ moneyDecimals, rateDecimals: get().rateDecimals })
    set({ moneyDecimals })
  },
  setRateDecimals(n) {
    const rateDecimals = clampDec(n, DEFAULTS.rateDecimals)
    persist({ moneyDecimals: get().moneyDecimals, rateDecimals })
    set({ rateDecimals })
  },
  reset() {
    persist(DEFAULTS)
    set({ ...DEFAULTS })
  },
}))

function persist(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

// Accesores no reactivos para usar dentro de funciones puras (formatters)
export const getMoneyDecimals = () => useSettingsStore.getState().moneyDecimals
export const getRateDecimals = () => useSettingsStore.getState().rateDecimals
