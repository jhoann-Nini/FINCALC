import { create } from 'zustand'
import type { HistoryEntry } from '../types/finance.types'

const STORAGE_KEY = 'fincalc_history'

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

interface HistoryStore {
  entries: HistoryEntry[]
  add: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  remove: (id: string) => void
  clear: () => void
  importEntries: (incoming: HistoryEntry[], mode: 'merge' | 'replace') => number
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  entries: loadHistory(),
  add(entry) {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    }
    const entries = [newEntry, ...get().entries].slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    set({ entries })
  },
  remove(id) {
    const entries = get().entries.filter((e) => e.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    set({ entries })
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
    set({ entries: [] })
  },
  importEntries(incoming, mode) {
    // Validación mínima: cada entrada debe tener forma de HistoryEntry
    const valid = (Array.isArray(incoming) ? incoming : []).filter(
      (e): e is HistoryEntry =>
        !!e &&
        typeof e.id === 'string' &&
        typeof e.module === 'string' &&
        typeof e.timestamp === 'number'
    )
    const current = mode === 'replace' ? [] : get().entries
    // Dedup por id, los más recientes primero
    const byId = new Map<string, HistoryEntry>()
    for (const e of [...valid, ...current]) {
      if (!byId.has(e.id)) byId.set(e.id, e)
    }
    const merged = Array.from(byId.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    set({ entries: merged })
    const before = current.length
    return merged.length - before
  },
}))
