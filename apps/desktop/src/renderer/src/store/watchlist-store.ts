import { create } from 'zustand'

interface WatchlistState {
  symbols: string[]
  symbolNames: Record<string, string>

  addSymbol: (symbol: string, name: string) => void
  removeSymbol: (symbol: string) => void
  loadWatchlist: () => Promise<void>
}

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'SPY', 'QQQ']

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  symbols: DEFAULT_SYMBOLS,
  symbolNames: {
    AAPL: 'Apple Inc.',
    MSFT: 'Microsoft',
    GOOGL: 'Alphabet',
    AMZN: 'Amazon',
    TSLA: 'Tesla',
    NVDA: 'NVIDIA',
    META: 'Meta Platforms',
    SPY: 'S&P 500 ETF',
    QQQ: 'Nasdaq 100 ETF',
  },

  addSymbol: (symbol, name) => {
    const state = get()
    if (state.symbols.includes(symbol)) return
    set({
      symbols: [...state.symbols, symbol],
      symbolNames: { ...state.symbolNames, [symbol]: name },
    })
  },

  removeSymbol: (symbol) =>
    set((state) => ({
      symbols: state.symbols.filter((s) => s !== symbol),
    })),

  loadWatchlist: async () => {
    // Load from database via IPC if available
    try {
      if (window.api?.watchlist?.list) {
        // Use first watchlist or create default
        // For now, keep defaults
      }
    } catch {
      // Keep defaults
    }
  },
}))
