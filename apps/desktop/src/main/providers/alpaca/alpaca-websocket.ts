import type { ProviderConfig, NormalizedQuote, NormalizedTrade, NormalizedBar, NewsArticle } from '@finterm/shared'

type MessageHandler = (data: unknown) => void

const ALPACA_STREAM_URL = 'wss://stream.data.alpaca.markets/v2/iex'
const ALPACA_NEWS_STREAM_URL = 'wss://stream.data.alpaca.markets/v1beta1/news'

export class AlpacaWebSocket {
  private ws: WebSocket | null = null
  private newsWs: WebSocket | null = null
  private config: ProviderConfig | null = null
  private handlers = new Map<string, Set<MessageHandler>>()
  private subscribedQuotes = new Set<string>()
  private subscribedTrades = new Set<string>()
  private subscribedBars = new Set<string>()
  private subscribedNews = new Set<string>()
  private reconnectTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private disposed = false

  initialize(config: ProviderConfig): void {
    this.config = config
    this.disposed = false
  }

  connect(): void {
    if (!this.config) throw new Error('WebSocket not initialized')

    const wsUrl = this.config.wsUrl || ALPACA_STREAM_URL
    console.log('[AlpacaWS] Connecting to:', wsUrl)

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('[AlpacaWS] Connected, authenticating...')
      this.ws?.send(JSON.stringify({
        action: 'auth',
        key: this.config!.apiKey,
        secret: this.config!.apiSecret,
      }))
    }

    this.ws.onmessage = (event) => {
      try {
        const messages = JSON.parse(event.data as string)
        for (const msg of Array.isArray(messages) ? messages : [messages]) {
          this.handleMessage(msg)
        }
      } catch (err) {
        console.error('[AlpacaWS] Parse error:', err)
      }
    }

    this.ws.onclose = (event) => {
      console.log('[AlpacaWS] Disconnected:', event.code, event.reason)
      this.emit('status', { connected: false })
      if (!this.disposed) this.scheduleReconnect()
    }

    this.ws.onerror = (event) => {
      console.error('[AlpacaWS] Error:', event)
      this.emit('error', new Error('WebSocket error'))
    }
  }

  connectNews(): void {
    if (!this.config) return

    console.log('[AlpacaWS] Connecting news stream...')
    this.newsWs = new WebSocket(ALPACA_NEWS_STREAM_URL)

    this.newsWs.onopen = () => {
      this.newsWs?.send(JSON.stringify({
        action: 'auth',
        key: this.config!.apiKey,
        secret: this.config!.apiSecret,
      }))
    }

    this.newsWs.onmessage = (event) => {
      try {
        const messages = JSON.parse(event.data as string)
        for (const msg of Array.isArray(messages) ? messages : [messages]) {
          if (msg.T === 'n') {
            const article: NewsArticle = {
              id: String(msg.id),
              headline: msg.headline,
              summary: msg.summary || '',
              source: msg.source,
              url: msg.url,
              symbols: msg.symbols || [],
              publishedAt: msg.created_at,
              updatedAt: msg.updated_at,
            }
            this.emit('news', article)
          }
        }
      } catch (err) {
        console.error('[AlpacaWS] News parse error:', err)
      }
    }

    this.newsWs.onclose = () => {
      if (!this.disposed && this.subscribedNews.size > 0) {
        setTimeout(() => this.connectNews(), 5000)
      }
    }
  }

  private handleMessage(msg: Record<string, unknown>): void {
    switch (msg.T) {
      case 'success':
        if (msg.msg === 'authenticated') {
          console.log('[AlpacaWS] Authenticated successfully')
          this.reconnectAttempts = 0
          this.emit('status', { connected: true })
          this.resubscribe()
        }
        break

      case 'q': { // Quote
        const quote: NormalizedQuote = {
          symbol: msg.S as string,
          bid: msg.bp as number ?? 0,
          ask: msg.ap as number ?? 0,
          bidSize: msg.bs as number ?? 0,
          askSize: msg.as as number ?? 0,
          last: (msg.ap as number ?? 0),
          volume: 0,
          timestamp: new Date(msg.t as string).getTime(),
          change: 0,
          changePercent: 0,
          high: 0,
          low: 0,
          open: 0,
          prevClose: 0,
        }
        this.emit('quote', quote)
        break
      }

      case 't': { // Trade
        const trade: NormalizedTrade = {
          symbol: msg.S as string,
          price: msg.p as number,
          size: msg.s as number,
          timestamp: new Date(msg.t as string).getTime(),
          exchange: msg.x as string ?? '',
        }
        this.emit('trade', trade)
        break
      }

      case 'b': { // Bar
        const bar: NormalizedBar = {
          symbol: msg.S as string,
          open: msg.o as number,
          high: msg.h as number,
          low: msg.l as number,
          close: msg.c as number,
          volume: msg.v as number,
          timestamp: new Date(msg.t as string).getTime(),
          vwap: msg.vw as number | undefined,
          tradeCount: msg.n as number | undefined,
        }
        this.emit('bar', bar)
        break
      }

      case 'error':
        console.error('[AlpacaWS] Server error:', msg)
        this.emit('error', new Error(String(msg.msg)))
        break
    }
  }

  subscribeQuotes(symbols: string[]): void {
    symbols.forEach(s => this.subscribedQuotes.add(s))
    this.sendSubscription()
  }

  subscribeTrades(symbols: string[]): void {
    symbols.forEach(s => this.subscribedTrades.add(s))
    this.sendSubscription()
  }

  subscribeBars(symbols: string[]): void {
    symbols.forEach(s => this.subscribedBars.add(s))
    this.sendSubscription()
  }

  subscribeNews(symbols: string[]): void {
    symbols.forEach(s => this.subscribedNews.add(s))
    if (this.newsWs?.readyState === WebSocket.OPEN) {
      this.newsWs.send(JSON.stringify({
        action: 'subscribe',
        news: Array.from(this.subscribedNews),
      }))
    }
  }

  unsubscribeQuotes(symbols: string[]): void {
    symbols.forEach(s => this.subscribedQuotes.delete(s))
    this.sendUnsubscription(symbols, 'quotes')
  }

  unsubscribeTrades(symbols: string[]): void {
    symbols.forEach(s => this.subscribedTrades.delete(s))
    this.sendUnsubscription(symbols, 'trades')
  }

  unsubscribeBars(symbols: string[]): void {
    symbols.forEach(s => this.subscribedBars.delete(s))
    this.sendUnsubscription(symbols, 'bars')
  }

  unsubscribeNews(symbols: string[]): void {
    symbols.forEach(s => this.subscribedNews.delete(s))
    if (this.newsWs?.readyState === WebSocket.OPEN) {
      this.newsWs.send(JSON.stringify({
        action: 'unsubscribe',
        news: symbols,
      }))
    }
  }

  private sendSubscription(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return

    const msg: Record<string, unknown> = { action: 'subscribe' }
    if (this.subscribedQuotes.size > 0) msg.quotes = Array.from(this.subscribedQuotes)
    if (this.subscribedTrades.size > 0) msg.trades = Array.from(this.subscribedTrades)
    if (this.subscribedBars.size > 0) msg.bars = Array.from(this.subscribedBars)

    this.ws.send(JSON.stringify(msg))
  }

  private sendUnsubscription(symbols: string[], type: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      action: 'unsubscribe',
      [type]: symbols,
    }))
  }

  private resubscribe(): void {
    if (this.subscribedQuotes.size > 0 || this.subscribedTrades.size > 0 || this.subscribedBars.size > 0) {
      this.sendSubscription()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[AlpacaWS] Max reconnect attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++
    console.log(`[AlpacaWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: MessageHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach(h => {
      try { h(data) } catch (err) { console.error('[AlpacaWS] Handler error:', err) }
    })
  }

  async dispose(): Promise<void> {
    this.disposed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    if (this.newsWs) {
      this.newsWs.onclose = null
      this.newsWs.close()
      this.newsWs = null
    }
    this.handlers.clear()
    this.subscribedQuotes.clear()
    this.subscribedTrades.clear()
    this.subscribedBars.clear()
    this.subscribedNews.clear()
  }
}
