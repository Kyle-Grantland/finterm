import { AlpacaProvider } from './alpaca/alpaca-provider'
import type { IMarketDataProvider } from '@finterm/provider-sdk'

export interface RegisteredProvider {
  id: string
  name: string
  factory: () => IMarketDataProvider
}

const registry: RegisteredProvider[] = [
  {
    id: 'alpaca',
    name: 'Alpaca Markets',
    factory: () => new AlpacaProvider(),
  },
]

export function getRegisteredProviders(): RegisteredProvider[] {
  return registry
}

export function getProviderFactory(id: string): (() => IMarketDataProvider) | undefined {
  return registry.find(p => p.id === id)?.factory
}
