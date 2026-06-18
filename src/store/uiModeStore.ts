import { create } from 'zustand'

export type AppMode = 'normal' | 'practica' | 'examen'

interface UIModeStore {
  mode: AppMode
  setMode: (m: AppMode) => void
}

export const useUIModeStore = create<UIModeStore>((set) => ({
  mode: 'normal',
  setMode: (mode) => set({ mode }),
}))

// Helpers — usar en calculadoras y layout
export const useShouldShowFormulas  = () => useUIModeStore((s) => s.mode !== 'examen')
export const useShouldShowChatbot   = () => useUIModeStore((s) => s.mode === 'normal')
export const useShouldShowStepHints = () => useUIModeStore((s) => s.mode === 'normal')
export const usePracticaMode        = () => useUIModeStore((s) => s.mode === 'practica')
export const useExamenMode          = () => useUIModeStore((s) => s.mode === 'examen')
