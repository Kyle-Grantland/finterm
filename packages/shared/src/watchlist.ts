export interface WatchlistItem {
  symbol: string
  name: string
  addedAt: string
}

export interface Watchlist {
  id: string
  name: string
  items: WatchlistItem[]
  createdAt: string
  updatedAt: string
}
