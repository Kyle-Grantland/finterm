export interface ProviderConfig {
  apiKey: string
  apiSecret: string
  baseUrl?: string
  wsUrl?: string
  sandbox?: boolean
}

export interface SubscriptionRequest {
  type: 'quote' | 'trade' | 'bar' | 'news'
  symbols: string[]
}

export interface ProviderInfo {
  id: string
  name: string
  description: string
  supportedAssets: string[]
  requiresAuth: boolean
}
