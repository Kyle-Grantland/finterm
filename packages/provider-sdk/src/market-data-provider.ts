import type {
  NormalizedQuote,
  NormalizedBar,
  NormalizedTrade,
  SymbolInfo,
  ProviderConfig,
  SubscriptionRequest,
  ProviderInfo,
} from '@finterm/shared'

export type MarketDataEvent = 'quote' | 'trade' | 'bar' | 'status' | 'error'

export type MarketDataHandler<T = unknown> = (data: T) => void

export interface IMarketDataProvider {
  readonly info: ProviderInfo

  // Lifecycle
  initialize(config: ProviderConfig): Promise<void>
  dispose(): Promise<void>
  isConnected(): boolean

  // REST
  getQuote(symbol: string): Promise<NormalizedQuote>
  getBars(symbol: string, timeframe: string, start: Date, end: Date): Promise<NormalizedBar[]>
  searchSymbols(query: string): Promise<SymbolInfo[]>

  // WebSocket
  subscribe(request: SubscriptionRequest): void
  unsubscribe(request: SubscriptionRequest): void

  // Events
  on(event: 'quote', handler: MarketDataHandler<NormalizedQuote>): void
  on(event: 'trade', handler: MarketDataHandler<NormalizedTrade>): void
  on(event: 'bar', handler: MarketDataHandler<NormalizedBar>): void
  on(event: 'status', handler: MarketDataHandler<{ connected: boolean }>): void
  on(event: 'error', handler: MarketDataHandler<Error>): void
  off(event: MarketDataEvent, handler: MarketDataHandler): void
}
