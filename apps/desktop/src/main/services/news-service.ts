import { BrowserWindow } from 'electron'
import type { NewsArticle, NewsFilter } from '@finterm/shared'
import type { INewsProvider } from '@finterm/provider-sdk'

class NewsService {
  private provider: INewsProvider | null = null

  setProvider(provider: INewsProvider): void {
    this.provider = provider

    provider.onNews((article: NewsArticle) => {
      this.sendToRenderer('news:article', article)
    })

    console.log('[NewsService] Provider set with event forwarding')
  }

  async getNews(filter: NewsFilter): Promise<NewsArticle[]> {
    if (!this.provider) throw new Error('No news provider configured')
    return this.provider.getNews(filter)
  }

  subscribeNews(symbols: string[]): void {
    if (!this.provider) {
      console.warn('[NewsService] No provider available for subscription')
      return
    }
    this.provider.subscribeNews(symbols)
  }

  unsubscribeNews(symbols: string[]): void {
    this.provider?.unsubscribeNews(symbols)
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

let instance: NewsService | null = null

export function getNewsService(): NewsService {
  if (!instance) {
    instance = new NewsService()
  }
  return instance
}
