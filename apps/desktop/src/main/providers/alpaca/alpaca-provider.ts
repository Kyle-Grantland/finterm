import { BaseProvider } from '@finterm/provider-sdk'
import type { IMarketDataProvider } from '@finterm/provider-sdk'
import type { INewsProvider } from '@finterm/provider-sdk'
import type {
  ProviderConfig,
  ProviderInfo,
  NormalizedQuote,
  NormalizedBar,
  SymbolInfo,
  SubscriptionRequest,
  NewsArticle,
  NewsFilter,
} from '@finterm/shared'
import { AlpacaRestClient } from './alpaca-rest'
import { AlpacaWebSocket } from './alpaca-websocket'

export class AlpacaProvider extends BaseProvider implements IMarketDataProvider, INewsProvider {
  readonly info: ProviderInfo = {
    id: 'alpaca',
    name: 'Alpaca Markets',
    description: 'Free real-time US equity data with WebSocket streaming and news',
    supportedAssets: ['us_equity'],
    requiresAuth: true,
  }

  private rest = new AlpacaRestClient()
  private ws = new AlpacaWebSocket()
  private newsHandlers = new Set<(article: NewsArticle) => void>()

  async initialize(config: ProviderConfig): Promise<void> {
    await super.initialize(config)

    this.rest.initialize(config)
    this.ws.initialize(config)

    // Forward WS events through BaseProvider's emit
    this.ws.on('quote', (data) => this.emit('quote', data))
    this.ws.on('trade', (data) => this.emit('trade', data))
    this.ws.on('bar', (data) => this.emit('bar', data))
    this.ws.on('status', (data) => {
      const status = data as { connected: boolean }
      this.connected = status.connected
      this.emit('status', data)
    })
    this.ws.on('error', (data) => this.emit('error', data))
    this.ws.on('news', (data) => {
      this.newsHandlers.forEach(h => {
        try { h(data as NewsArticle) } catch (err) { console.error('[AlpacaProvider] News handler error:', err) }
      })
    })

    // Connect WebSocket
    this.ws.connect()
    this.ws.connectNews()

    console.log('[AlpacaProvider] Initialized')
  }

  async dispose(): Promise<void> {
    await this.ws.dispose()
    this.newsHandlers.clear()
    await super.dispose()
    console.log('[AlpacaProvider] Disposed')
  }

  // REST methods
  async getQuote(symbol: string): Promise<NormalizedQuote> {
    return this.rest.getQuote(symbol)
  }

  async getBars(symbol: string, timeframe: string, start: Date, end: Date): Promise<NormalizedBar[]> {
    return this.rest.getBars(symbol, timeframe, start, end)
  }

  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    return this.rest.searchSymbols(query)
  }

  // WebSocket subscriptions
  subscribe(request: SubscriptionRequest): void {
    switch (request.type) {
      case 'quote':
        this.ws.subscribeQuotes(request.symbols)
        break
      case 'trade':
        this.ws.subscribeTrades(request.symbols)
        break
      case 'bar':
        this.ws.subscribeBars(request.symbols)
        break
      case 'news':
        this.ws.subscribeNews(request.symbols)
        break
    }
  }

  unsubscribe(request: SubscriptionRequest): void {
    switch (request.type) {
      case 'quote':
        this.ws.unsubscribeQuotes(request.symbols)
        break
      case 'trade':
        this.ws.unsubscribeTrades(request.symbols)
        break
      case 'bar':
        this.ws.unsubscribeBars(request.symbols)
        break
      case 'news':
        this.ws.unsubscribeNews(request.symbols)
        break
    }
  }

  // News
  async getNews(filter: NewsFilter): Promise<NewsArticle[]> {
    // Use Alpaca news REST API
    if (!this.config) throw new Error('Provider not initialized')

    const params = new URLSearchParams()
    if (filter.symbols?.length) params.set('symbols', filter.symbols.join(','))
    if (filter.limit) params.set('limit', String(filter.limit))
    if (filter.startDate) params.set('start', filter.startDate)
    if (filter.endDate) params.set('end', filter.endDate)

    const url = `https://data.alpaca.markets/v1beta1/news?${params}`
    const res = await fetch(url, {
      headers: {
        'APCA-API-KEY-ID': this.config.apiKey,
        'APCA-API-SECRET-KEY': this.config.apiSecret,
      },
    })

    if (!res.ok) throw new Error(`Alpaca news error: ${res.status}`)
    const data = await res.json()

    return (data.news || []).map((n: Record<string, unknown>) => ({
      id: String(n.id),
      headline: n.headline as string,
      summary: (n.summary || '') as string,
      source: n.source as string,
      url: n.url as string,
      symbols: (n.symbols || []) as string[],
      publishedAt: n.created_at as string,
      updatedAt: n.updated_at as string | undefined,
      images: Array.isArray(n.images)
        ? n.images.map((img: Record<string, string>) => ({ url: img.url, size: img.size as 'thumb' | 'small' | 'large' }))
        : undefined,
    }))
  }

  subscribeNews(symbols: string[]): void {
    this.ws.subscribeNews(symbols)
  }

  unsubscribeNews(symbols: string[]): void {
    this.ws.unsubscribeNews(symbols)
  }

  onNews(handler: (article: NewsArticle) => void): void {
    this.newsHandlers.add(handler)
  }

  offNews(handler: (article: NewsArticle) => void): void {
    this.newsHandlers.delete(handler)
  }
}
