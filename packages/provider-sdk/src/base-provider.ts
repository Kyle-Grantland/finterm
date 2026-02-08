import type { ProviderConfig, ProviderInfo } from '@finterm/shared'
import type { MarketDataEvent, MarketDataHandler } from './market-data-provider'

export abstract class BaseProvider {
  protected config: ProviderConfig | null = null
  protected connected = false
  private listeners = new Map<string, Set<MarketDataHandler>>()

  abstract readonly info: ProviderInfo

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config
  }

  async dispose(): Promise<void> {
    this.listeners.clear()
    this.connected = false
    this.config = null
  }

  isConnected(): boolean {
    return this.connected
  }

  on(event: MarketDataEvent, handler: MarketDataHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  off(event: MarketDataEvent, handler: MarketDataHandler): void {
    this.listeners.get(event)?.delete(handler)
  }

  protected emit(event: MarketDataEvent, data: unknown): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(data)
      } catch (err) {
        console.error(`[BaseProvider] Error in ${event} handler:`, err)
      }
    })
  }
}
