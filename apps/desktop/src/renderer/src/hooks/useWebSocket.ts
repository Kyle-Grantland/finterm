import { useEffect } from 'react'
import { useMarketDataStore } from '../store/market-data-store'
import { useNewsStore } from '../store/news-store'

export function useWebSocket() {
  useEffect(() => {
    const cleanupMarket = useMarketDataStore.getState().startListening()
    const cleanupNews = useNewsStore.getState().startListening()

    return () => {
      cleanupMarket()
      cleanupNews()
    }
  }, [])
}
