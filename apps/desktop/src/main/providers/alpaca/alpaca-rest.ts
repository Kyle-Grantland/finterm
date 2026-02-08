import type { ProviderConfig, NormalizedQuote, NormalizedBar, SymbolInfo } from '@finterm/shared'

const ALPACA_DATA_BASE = 'https://data.alpaca.markets'
const ALPACA_PAPER_BASE = 'https://paper-api.alpaca.markets'

export class AlpacaRestClient {
  private config: ProviderConfig | null = null
  private headers: Record<string, string> = {}

  initialize(config: ProviderConfig): void {
    this.config = config
    this.headers = {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
      'Content-Type': 'application/json',
    }
  }

  private get dataBase(): string {
    return this.config?.baseUrl || ALPACA_DATA_BASE
  }

  private get brokerBase(): string {
    return this.config?.sandbox ? ALPACA_PAPER_BASE : 'https://api.alpaca.markets'
  }

  async getQuote(symbol: string): Promise<NormalizedQuote> {
    const url = `${this.dataBase}/v2/stocks/${symbol}/quotes/latest`
    const res = await fetch(url, { headers: this.headers })
    if (!res.ok) throw new Error(`Alpaca quote error: ${res.status} ${res.statusText}`)

    const data = await res.json()
    const quote = data.quote

    // Also fetch latest trade for last price
    const tradeUrl = `${this.dataBase}/v2/stocks/${symbol}/trades/latest`
    const tradeRes = await fetch(tradeUrl, { headers: this.headers })
    const tradeData = tradeRes.ok ? await tradeRes.json() : null
    const trade = tradeData?.trade

    // Fetch snapshot for OHLC data
    const snapUrl = `${this.dataBase}/v2/stocks/${symbol}/snapshot`
    const snapRes = await fetch(snapUrl, { headers: this.headers })
    const snapData = snapRes.ok ? await snapRes.json() : null

    const prevClose = snapData?.prevDailyBar?.c ?? 0
    const lastPrice = trade?.p ?? quote.ap ?? 0

    return {
      symbol,
      bid: quote.bp ?? 0,
      ask: quote.ap ?? 0,
      bidSize: quote.bs ?? 0,
      askSize: quote.as ?? 0,
      last: lastPrice,
      volume: snapData?.dailyBar?.v ?? 0,
      timestamp: new Date(quote.t).getTime(),
      change: lastPrice - prevClose,
      changePercent: prevClose > 0 ? ((lastPrice - prevClose) / prevClose) * 100 : 0,
      high: snapData?.dailyBar?.h ?? 0,
      low: snapData?.dailyBar?.l ?? 0,
      open: snapData?.dailyBar?.o ?? 0,
      prevClose,
    }
  }

  async getBars(symbol: string, timeframe: string, start: Date, end: Date): Promise<NormalizedBar[]> {
    const alpacaTimeframe = this.mapTimeframe(timeframe)
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      timeframe: alpacaTimeframe,
      limit: '10000',
      adjustment: 'split',
      feed: 'iex',
    })

    const bars: NormalizedBar[] = []
    let pageToken: string | null = null

    do {
      const url = `${this.dataBase}/v2/stocks/${symbol}/bars?${params}${pageToken ? `&page_token=${pageToken}` : ''}`
      const res = await fetch(url, { headers: this.headers })
      if (!res.ok) throw new Error(`Alpaca bars error: ${res.status} ${res.statusText}`)

      const data = await res.json()
      if (data.bars) {
        for (const bar of data.bars) {
          bars.push({
            symbol,
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v,
            timestamp: new Date(bar.t).getTime(),
            vwap: bar.vw,
            tradeCount: bar.n,
          })
        }
      }
      pageToken = data.next_page_token || null
    } while (pageToken)

    return bars
  }

  async searchSymbols(query: string): Promise<SymbolInfo[]> {
    const url = `${this.brokerBase}/v2/assets?status=active&asset_class=us_equity`
    const res = await fetch(url, { headers: this.headers })
    if (!res.ok) throw new Error(`Alpaca search error: ${res.status} ${res.statusText}`)

    const assets = await res.json()
    const q = query.toLowerCase()

    return assets
      .filter((a: Record<string, string>) =>
        a.symbol.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q)
      )
      .slice(0, 20)
      .map((a: Record<string, string | boolean>) => ({
        symbol: a.symbol as string,
        name: a.name as string,
        exchange: a.exchange as string,
        type: (a.asset_class === 'crypto' ? 'crypto' : 'stock') as SymbolInfo['type'],
        tradable: a.tradable as boolean,
      }))
  }

  private mapTimeframe(tf: string): string {
    const map: Record<string, string> = {
      '1m': '1Min',
      '5m': '5Min',
      '15m': '15Min',
      '30m': '30Min',
      '1h': '1Hour',
      '4h': '4Hour',
      '1D': '1Day',
      '1W': '1Week',
      '1M': '1Month',
    }
    return map[tf] || '1Day'
  }
}
