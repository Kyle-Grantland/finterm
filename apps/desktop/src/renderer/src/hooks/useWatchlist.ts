import { useWatchlistStore } from '../store/watchlist-store'
import { useMarketDataStore } from '../store/market-data-store'

export function useWatchlist() {
  const { symbols, symbolNames, addSymbol, removeSymbol } = useWatchlistStore()
  const quotes = useMarketDataStore((s) => s.quotes)

  const watchlistData = symbols.map((symbol) => ({
    symbol,
    name: symbolNames[symbol] || symbol,
    quote: quotes[symbol] || null,
  }))

  return {
    watchlistData,
    addSymbol,
    removeSymbol,
  }
}
