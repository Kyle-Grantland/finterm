/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  api: {
    auth: {
      getUser: () => Promise<{ success: boolean; user?: unknown; error?: string }>
      login: (sessionId: string, clerkUser: unknown) => Promise<{ success: boolean }>
      logout: () => Promise<{ success: boolean }>
      validateSession: () => Promise<{ success: boolean; valid: boolean }>
      startSignIn: () => Promise<{ success: boolean; token?: string; error?: string }>
    }
    window: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
    }
    market: {
      getQuote: (symbol: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      getBars: (symbol: string, timeframe: string, start: string, end: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      searchSymbols: (query: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      subscribe: (symbols: string[], types: string[]) => Promise<{ success: boolean }>
      unsubscribe: (symbols: string[], types: string[]) => Promise<{ success: boolean }>
      onQuotesBatch: (callback: (quotes: unknown[]) => void) => () => void
      onTrade: (callback: (trade: unknown) => void) => () => void
      onBar: (callback: (bar: unknown) => void) => () => void
      onStatus: (callback: (status: unknown) => void) => () => void
    }
    news: {
      get: (filter: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>
      subscribe: (symbols: string[]) => Promise<{ success: boolean }>
      onArticle: (callback: (article: unknown) => void) => () => void
    }
    workspace: {
      save: (userId: string, name: string, layoutData: string) => Promise<{ success: boolean; data?: unknown }>
      load: (userId: string, layoutId?: string) => Promise<{ success: boolean; data?: unknown }>
      list: (userId: string) => Promise<{ success: boolean; data?: unknown }>
      delete: (layoutId: string) => Promise<{ success: boolean }>
      setDefault: (userId: string, layoutId: string) => Promise<{ success: boolean }>
    }
    watchlist: {
      list: (userId: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
      create: (userId: string, name: string) => Promise<{ success: boolean; data?: unknown }>
      addItem: (watchlistId: string, symbol: string, name: string) => Promise<{ success: boolean; data?: unknown }>
      removeItem: (watchlistId: string, symbol: string) => Promise<{ success: boolean }>
    }
    provider: {
      setCredentials: (apiKey: string, apiSecret: string) => Promise<{ success: boolean }>
      getStatus: () => Promise<{ success: boolean; data?: { connected: boolean; provider: unknown } }>
      hasCredentials: () => Promise<{ success: boolean; hasCredentials: boolean }>
    }
  }
}
