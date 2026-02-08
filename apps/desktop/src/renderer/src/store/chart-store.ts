import { create } from 'zustand'
import type { NormalizedBar, Timeframe } from '@finterm/shared'

interface ChartState {
  bars: Record<string, NormalizedBar[]> // key: `${symbol}-${timeframe}`
  loading: Record<string, boolean>

  loadBars: (symbol: string, timeframe: Timeframe) => Promise<void>
  updateBar: (bar: NormalizedBar) => void
}

function getDateRange(timeframe: Timeframe): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (timeframe) {
    case '1m':
    case '5m':
      start.setDate(start.getDate() - 2)
      break
    case '15m':
    case '30m':
      start.setDate(start.getDate() - 7)
      break
    case '1h':
    case '4h':
      start.setDate(start.getDate() - 30)
      break
    case '1D':
      start.setFullYear(start.getFullYear() - 1)
      break
    case '1W':
      start.setFullYear(start.getFullYear() - 3)
      break
    case '1M':
      start.setFullYear(start.getFullYear() - 10)
      break
    default:
      start.setFullYear(start.getFullYear() - 1)
  }

  return { start, end }
}

export const useChartStore = create<ChartState>((set, get) => ({
  bars: {},
  loading: {},

  loadBars: async (symbol, timeframe) => {
    const key = `${symbol}-${timeframe}`
    if (get().loading[key]) return

    set((state) => ({
      loading: { ...state.loading, [key]: true },
    }))

    try {
      if (window.api?.market?.getBars) {
        const { start, end } = getDateRange(timeframe)
        const res = await window.api.market.getBars(
          symbol,
          timeframe,
          start.toISOString(),
          end.toISOString()
        )

        if (res.success && res.data) {
          set((state) => ({
            bars: { ...state.bars, [key]: res.data as NormalizedBar[] },
            loading: { ...state.loading, [key]: false },
          }))
          return
        }
      }
    } catch (err) {
      console.error('[ChartStore] Failed to load bars:', err)
    }

    set((state) => ({
      loading: { ...state.loading, [key]: false },
    }))
  },

  updateBar: (bar) => {
    // Find matching keys and append/update last bar
    set((state) => {
      const updated = { ...state.bars }
      for (const key of Object.keys(updated)) {
        if (key.startsWith(`${bar.symbol}-`)) {
          const existing = [...updated[key]]
          const lastBar = existing[existing.length - 1]

          if (lastBar && lastBar.timestamp === bar.timestamp) {
            // Update existing bar
            existing[existing.length - 1] = bar
          } else {
            // Append new bar
            existing.push(bar)
          }

          updated[key] = existing
        }
      }
      return { bars: updated }
    })
  },
}))
