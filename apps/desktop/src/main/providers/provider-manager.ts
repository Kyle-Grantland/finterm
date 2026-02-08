import type { IMarketDataProvider } from '@finterm/provider-sdk'
import type { ProviderInfo } from '@finterm/shared'
import { getProviderFactory } from './provider-registry'
import { SecureStorage } from '../storage/secure-store'
import { getMarketDataService } from '../services/market-data-service'
import { getNewsService } from '../services/news-service'
import type { INewsProvider } from '@finterm/provider-sdk'

class ProviderManager {
  private activeProvider: IMarketDataProvider | null = null
  private activeProviderId: string | null = null

  async initialize(): Promise<void> {
    const credentials = SecureStorage.getAlpacaCredentials()
    if (!credentials) {
      console.log('[ProviderManager] No credentials found, skipping provider initialization')
      return
    }

    await this.activateProvider('alpaca', {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      sandbox: true,
    })
  }

  async activateProvider(
    providerId: string,
    config: { apiKey: string; apiSecret: string; sandbox?: boolean }
  ): Promise<void> {
    // Dispose current provider if any
    if (this.activeProvider) {
      await this.activeProvider.dispose()
      this.activeProvider = null
      this.activeProviderId = null
    }

    const factory = getProviderFactory(providerId)
    if (!factory) {
      throw new Error(`Provider '${providerId}' not found in registry`)
    }

    const provider = factory()
    await provider.initialize({
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      sandbox: config.sandbox ?? true,
    })

    this.activeProvider = provider
    this.activeProviderId = providerId

    // Wire up services
    const marketDataService = getMarketDataService()
    marketDataService.initialize()

    // If provider also implements INewsProvider, wire up news
    if ('getNews' in provider) {
      const newsService = getNewsService()
      newsService.setProvider(provider as unknown as INewsProvider)
    }

    console.log(`[ProviderManager] Provider '${providerId}' activated`)
  }

  async reinitialize(): Promise<void> {
    const credentials = SecureStorage.getAlpacaCredentials()
    if (!credentials) {
      console.warn('[ProviderManager] No credentials for reinitialization')
      return
    }
    await this.activateProvider(this.activeProviderId || 'alpaca', {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      sandbox: true,
    })
  }

  getActiveProvider(): IMarketDataProvider | null {
    return this.activeProvider
  }

  getActiveProviderInfo(): ProviderInfo | null {
    return this.activeProvider?.info ?? null
  }

  isConnected(): boolean {
    return this.activeProvider?.isConnected() ?? false
  }

  async dispose(): Promise<void> {
    if (this.activeProvider) {
      await this.activeProvider.dispose()
      this.activeProvider = null
      this.activeProviderId = null
    }
  }
}

let instance: ProviderManager | null = null

export function getProviderManager(): ProviderManager {
  if (!instance) {
    instance = new ProviderManager()
  }
  return instance
}
