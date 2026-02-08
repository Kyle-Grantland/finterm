import { BrowserWindow } from 'electron'
import { getProviderManager } from '../providers/provider-manager'
import type { NormalizedQuote, NormalizedBar, NormalizedTrade, SymbolInfo, SubscriptionRequest } from '@finterm/shared'

class MarketDataService {
  private batchedQuotes = new Map<string, NormalizedQuote>()
  private batchTimer: NodeJS.Timeout | null = null
  private readonly BATCH_INTERVAL = 50 // ms — prevent excessive IPC

  initialize(): void {
    const manager = getProviderManager()
    const provider = manager.getActiveProvider()
    if (!provider) return

    provider.on('quote', (quote: NormalizedQuote) => {
      this.batchedQuotes.set(quote.symbol, quote)
      this.scheduleBatchFlush()
    })

    provider.on('trade', (trade: NormalizedTrade) => {
      this.sendToRenderer('market:trade', trade)
    })

    provider.on('bar', (bar: NormalizedBar) => {
      this.sendToRenderer('market:bar', bar)
    })

    provider.on('status', (status: { connected: boolean }) => {
      this.sendToRenderer('market:status', status)
    })

    console.log('[MarketDataService] Initialized with event forwarding')
  }

  private scheduleBatchFlush(): void {
    if (this.batchTimer) return
    this.batchTimer = setTimeout(() => {
      this.flushBatch()
      this.batchTimer = null
    }, this.BATCH_INTERVAL)
  }

  private flushBatch(): void {
    if (this.batchedQuotes.size === 0) return
    const quotes = Array.from(this.batchedQuotes.values())
    this.batchedQuotes.clear()
    this.sendToRenderer('market:quotes-batch', quotes)
  }

  async getQuote(symbol: string): Promise<NormalizedQuote> {
    const manager = getProviderManager()
    const provider = manager.getActiveProvider()
    if (!provider) throw new Error('No active market data provider')
    return provider.getQuote(symbol)
  }

  async getBars(symbol: string, timeframe: string, start: Date, end: Date): Promise<NormalizedBar[]> {
    const manager = getProviderManager()
    const provider = manager.getActiveProvider()
    if (!provider) throw new Error('No active market data provider')
    return provider.getBars(symbol, timeframe, start, end)
  }

  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    const manager = getProviderManager()
    const provider = manager.getActiveProvider()
    if (!provider) throw new Error('No active market data provider')
    return provider.searchSymbols(query)
  }

  subscribe(request: SubscriptionRequest): void {
    const manager = getProviderManager()
    const provider = manager.getActiveProvider()
    if (!provider) {
      console.warn('[MarketDataService] No provider available for subscription')
      return
    }
    provider.subscribe(request)
  }

  unsubscribe(request: SubscriptionRequest): void {
    const manager = getProviderManager()
    const provider = manager.getActiveProvider()
    provider?.unsubscribe(request)
  }

  private sendToRenderer(channel: string, data: unknown): void {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data)
      }
    }
  }
}

let instance: MarketDataService | null = null

export function getMarketDataService(): MarketDataService {
  if (!instance) {
    instance = new MarketDataService()
  }
  return instance
}
