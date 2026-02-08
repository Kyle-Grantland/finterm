import { ipcMain } from 'electron'
import { getMarketDataService } from '../services/market-data-service'
import { getNewsService } from '../services/news-service'
import { SecureStorage } from '../storage/secure-store'
import { getProviderManager } from '../providers/provider-manager'

export function setupDataHandlers(): void {
  // Market data
  ipcMain.handle('market:getQuote', async (_event, symbol: string) => {
    try {
      const service = getMarketDataService()
      const quote = await service.getQuote(symbol)
      return { success: true, data: quote }
    } catch (error) {
      console.error('[IPC:market] getQuote failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('market:getBars', async (_event, symbol: string, timeframe: string, start: string, end: string) => {
    try {
      const service = getMarketDataService()
      const bars = await service.getBars(symbol, timeframe, new Date(start), new Date(end))
      return { success: true, data: bars }
    } catch (error) {
      console.error('[IPC:market] getBars failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('market:searchSymbols', async (_event, query: string) => {
    try {
      const service = getMarketDataService()
      const results = await service.searchSymbols(query)
      return { success: true, data: results }
    } catch (error) {
      console.error('[IPC:market] searchSymbols failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('market:subscribe', async (_event, symbols: string[], types: string[]) => {
    try {
      const service = getMarketDataService()
      for (const type of types) {
        service.subscribe({ type: type as 'quote' | 'trade' | 'bar', symbols })
      }
      return { success: true }
    } catch (error) {
      console.error('[IPC:market] subscribe failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('market:unsubscribe', async (_event, symbols: string[], types: string[]) => {
    try {
      const service = getMarketDataService()
      for (const type of types) {
        service.unsubscribe({ type: type as 'quote' | 'trade' | 'bar', symbols })
      }
      return { success: true }
    } catch (error) {
      console.error('[IPC:market] unsubscribe failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // News
  ipcMain.handle('news:get', async (_event, filter: Record<string, unknown>) => {
    try {
      const service = getNewsService()
      const articles = await service.getNews(filter)
      return { success: true, data: articles }
    } catch (error) {
      console.error('[IPC:news] get failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('news:subscribe', async (_event, symbols: string[]) => {
    try {
      const service = getNewsService()
      service.subscribeNews(symbols)
      return { success: true }
    } catch (error) {
      console.error('[IPC:news] subscribe failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // Provider configuration
  ipcMain.handle('provider:setCredentials', async (_event, apiKey: string, apiSecret: string) => {
    try {
      SecureStorage.setAlpacaCredentials(apiKey, apiSecret)
      // Re-initialize provider with new credentials
      const manager = getProviderManager()
      await manager.reinitialize()
      return { success: true }
    } catch (error) {
      console.error('[IPC:provider] setCredentials failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('provider:getStatus', async () => {
    try {
      const manager = getProviderManager()
      return {
        success: true,
        data: {
          connected: manager.isConnected(),
          provider: manager.getActiveProviderInfo(),
        },
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('provider:hasCredentials', async () => {
    const creds = SecureStorage.getAlpacaCredentials()
    return { success: true, hasCredentials: !!creds }
  })

  console.log('[IPC] Data handlers registered')
}
