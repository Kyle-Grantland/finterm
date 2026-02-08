import type { NewsArticle, NewsFilter, ProviderConfig } from '@finterm/shared'

export type NewsHandler = (article: NewsArticle) => void

export interface INewsProvider {
  initialize(config: ProviderConfig): Promise<void>
  dispose(): Promise<void>

  // REST
  getNews(filter: NewsFilter): Promise<NewsArticle[]>

  // WebSocket
  subscribeNews(symbols: string[]): void
  unsubscribeNews(symbols: string[]): void

  // Events
  onNews(handler: NewsHandler): void
  offNews(handler: NewsHandler): void
}
