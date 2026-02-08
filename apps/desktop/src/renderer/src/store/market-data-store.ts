import { create } from 'zustand'
import type { NormalizedQuote, NormalizedTrade } from '@finterm/shared'

interface MarketDataState {
  quotes: Record<string, NormalizedQuote>
  lastTrade: Record<string, NormalizedTrade>
  connected: boolean

  // Actions
  updateQuotes: (quotes: NormalizedQuote[]) => void
  updateTrade: (trade: NormalizedTrade) => void
  setConnected: (connected: boolean) => void
  subscribe: (symbols: string[], types: string[]) => void
  unsubscribe: (symbols: string[], types: string[]) => void
  startListening: () => () => void
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  quotes: {},
  lastTrade: {},
  connected: false,

  updateQuotes: (quotes) =>
    set((state) => {
      const updated = { ...state.quotes }
      for (const q of quotes) {
        const existing = updated[q.symbol]
        // Merge: keep OHLC from REST if WS doesn't provide it
        updated[q.symbol] = {
          ...q,
          open: q.open || existing?.open || 0,
          high: q.high || existing?.high || 0,
          low: q.low || existing?.low || 0,
          prevClose: q.prevClose || existing?.prevClose || 0,
          volume: q.volume || existing?.volume || 0,
          change: q.change || (existing?.prevClose ? q.last - existing.prevClose : 0),
          changePercent:
            q.changePercent ||
            (existing?.prevClose
              ? ((q.last - existing.prevClose) / existing.prevClose) * 100
              : 0),
        }
      }
      return { quotes: updated }
    }),

  updateTrade: (trade) =>
    set((state) => ({
      lastTrade: { ...state.lastTrade, [trade.symbol]: trade },
      quotes: {
        ...state.quotes,
        [trade.symbol]: state.quotes[trade.symbol]
          ? { ...state.quotes[trade.symbol], last: trade.price, timestamp: trade.timestamp }
          : {
              symbol: trade.symbol,
              last: trade.price,
              bid: 0, ask: 0, bidSize: 0, askSize: 0,
              volume: 0, timestamp: trade.timestamp,
              change: 0, changePercent: 0,
              high: 0, low: 0, open: 0, prevClose: 0,
            },
      },
    })),

  setConnected: (connected) => set({ connected }),

  subscribe: (symbols, types) => {
    window.api?.market?.subscribe(symbols, types)
  },

  unsubscribe: (symbols, types) => {
    window.api?.market?.unsubscribe(symbols, types)
  },

  startListening: () => {
    const cleanups: Array<() => void> = []

    if (window.api?.market) {
      cleanups.push(
        window.api.market.onQuotesBatch((quotes) => {
          useMarketDataStore.getState().updateQuotes(quotes as NormalizedQuote[])
        })
      )

      cleanups.push(
        window.api.market.onTrade((trade) => {
          useMarketDataStore.getState().updateTrade(trade as NormalizedTrade)
        })
      )

      cleanups.push(
        window.api.market.onStatus((status) => {
          const s = status as { connected: boolean }
          useMarketDataStore.getState().setConnected(s.connected)
        })
      )
    }

    return () => cleanups.forEach((fn) => fn())
  },
}))
