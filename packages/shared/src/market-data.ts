export interface NormalizedQuote {
  symbol: string
  bid: number
  ask: number
  bidSize: number
  askSize: number
  last: number
  volume: number
  timestamp: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  prevClose: number
}

export interface NormalizedTrade {
  symbol: string
  price: number
  size: number
  timestamp: number
  exchange: string
}

export interface NormalizedBar {
  symbol: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: number
  vwap?: number
  tradeCount?: number
}

export interface SymbolInfo {
  symbol: string
  name: string
  exchange: string
  type: 'stock' | 'etf' | 'crypto' | 'option' | 'future' | 'forex'
  tradable: boolean
}

export type Timeframe =
  | '1m' | '5m' | '15m' | '30m'
  | '1h' | '4h'
  | '1D' | '1W' | '1M'

export type ChartType = 'candlestick' | 'line' | 'area'

export interface MarketStatus {
  isOpen: boolean
  nextOpen?: string
  nextClose?: string
}
