export interface NewsArticle {
  id: string
  headline: string
  summary: string
  source: string
  url: string
  symbols: string[]
  publishedAt: string
  updatedAt?: string
  images?: NewsImage[]
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface NewsImage {
  url: string
  size: 'thumb' | 'small' | 'large'
}

export interface NewsFilter {
  symbols?: string[]
  sources?: string[]
  limit?: number
  startDate?: string
  endDate?: string
}
