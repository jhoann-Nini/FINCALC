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
}))
