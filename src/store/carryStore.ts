import { create } from 'zustand'

// Datos que un módulo "pasa" al siguiente (o anterior) para continuar el ejercicio.
export interface CarryPayload {
  rate?: number      // tasa en %
  amount?: number    // monto / capital en $
  periods?: number   // número de períodos
  from?: string      // ruta del módulo de origen
  rateLabel?: string // nombre descriptivo de la tasa (ej: "Mensual MV: 2.0000%")
}

// Orden didáctico de los módulos (define qué es "anterior" y "siguiente").
export const MODULE_ORDER: { path: string; label: string }[] = [
  { path: '/tasas', label: 'Conversión de Tasas' },
  { path: '/simple', label: 'Interés Simple' },
  { path: '/compuesto', label: 'Interés Compuesto' },
  { path: '/anualidades', label: 'Anualidades' },
  { path: '/amortizacion', label: 'Amortización' },
  { path: '/inflacion', label: 'Inflación & Tasas Reales' },
]

interface CarryStore {
  payload: CarryPayload | null
  set: (p: CarryPayload) => void
  consume: () => CarryPayload | null // devuelve el dato pendiente y lo limpia (se usa una sola vez)
}

export const useCarryStore = create<CarryStore>((set, get) => ({
  payload: null,
  set: (p) => set({ payload: p }),
  consume: () => {
    const p = get().payload
    if (p) set({ payload: null })
    return p
  },
}))
