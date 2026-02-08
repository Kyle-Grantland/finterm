import { create } from 'zustand'
import type { NewsArticle, NewsFilter } from '@finterm/shared'

interface NewsState {
  articles: NewsArticle[]
  latestBreaking: NewsArticle | null
  loading: boolean

  fetchNews: (filter: NewsFilter) => Promise<void>
  subscribeToNews: (symbols: string[]) => void
  addArticle: (article: NewsArticle) => void
  clearBreaking: () => void
  startListening: () => () => void
}

export const useNewsStore = create<NewsState>((set, get) => ({
  articles: [],
  latestBreaking: null,
  loading: false,

  fetchNews: async (filter) => {
    set({ loading: true })
    try {
      if (window.api?.news?.get) {
        const res = await window.api.news.get(filter as Record<string, unknown>)
        if (res.success && res.data) {
          set({ articles: res.data as NewsArticle[], loading: false })
          return
        }
      }
    } catch (err) {
      console.error('[NewsStore] Failed to fetch news:', err)
    }
    set({ loading: false })
  },

  subscribeToNews: (symbols) => {
    window.api?.news?.subscribe(symbols)
  },

  addArticle: (article) => {
    set((state) => ({
      articles: [article, ...state.articles].slice(0, 200),
      latestBreaking: article,
    }))
  },

  clearBreaking: () => set({ latestBreaking: null }),

  startListening: () => {
    if (!window.api?.news?.onArticle) return () => {}

    const cleanup = window.api.news.onArticle((article) => {
      get().addArticle(article as NewsArticle)
    })

    return cleanup
  },
}))
