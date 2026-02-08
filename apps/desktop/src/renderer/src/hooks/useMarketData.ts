import { useEffect, useRef } from 'react'
import { useMarketDataStore } from '../store/market-data-store'
import type { NormalizedQuote } from '@finterm/shared'

export function useMarketData(symbols: string[]) {
  const quotes = useMarketDataStore((s) => s.quotes)
  const subscribe = useMarketDataStore((s) => s.subscribe)
  const unsubscribe = useMarketDataStore((s) => s.unsubscribe)
  const connected = useMarketDataStore((s) => s.connected)
  const prevSymbols = useRef<string[]>([])

  useEffect(() => {
    // Unsubscribe from previous symbols
    if (prevSymbols.current.length > 0) {
      unsubscribe(prevSymbols.current, ['quote', 'trade'])
    }

    // Subscribe to new symbols
    if (symbols.length > 0) {
      subscribe(symbols, ['quote', 'trade'])
    }

    prevSymbols.current = symbols

    return () => {
      if (symbols.length > 0) {
        unsubscribe(symbols, ['quote', 'trade'])
      }
    }
  }, [symbols, subscribe, unsubscribe])

  // Fetch initial snapshots via REST
  useEffect(() => {
    const fetchSnapshots = async () => {
      for (const symbol of symbols) {
        if (!quotes[symbol]) {
          try {
            const res = await window.api?.market?.getQuote(symbol)
            if (res?.success && res.data) {
              useMarketDataStore.getState().updateQuotes([res.data as NormalizedQuote])
            }
          } catch {
            // Ignore errors for individual symbols
          }
        }
      }
    }
    fetchSnapshots()
  }, [symbols]) // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, connected }
}
