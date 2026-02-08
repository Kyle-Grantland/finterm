import { useEffect, useState } from 'react'
import type { IDockviewPanelProps } from 'dockview-react'
import { RefreshCw, Filter } from 'lucide-react'
import { NewsCard } from './NewsCard'
import { AlertBanner } from './AlertBanner'
import { useNewsStore } from '../../store/news-store'

export function NewsFeedPanel(_props: IDockviewPanelProps) {
  const { articles, latestBreaking, fetchNews, subscribeToNews, clearBreaking } = useNewsStore()
  const [filterSymbol, setFilterSymbol] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchNews({})
      subscribeToNews(['*'])
      setLoading(false)
    }
    load()
  }, [fetchNews, subscribeToNews])

  const filteredArticles = filterSymbol
    ? articles.filter((a) =>
        a.symbols.some((s) => s.toLowerCase().includes(filterSymbol.toLowerCase()))
      )
    : articles

  const handleRefresh = async () => {
    setLoading(true)
    await fetchNews(filterSymbol ? { symbols: [filterSymbol] } : {})
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-terminal-bg">
      {/* Breaking news banner */}
      {latestBreaking && (
        <AlertBanner article={latestBreaking} onDismiss={clearBreaking} />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border">
        <Filter size={13} className="text-terminal-muted" />
        <input
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value.toUpperCase())}
          placeholder="Filter by symbol..."
          className="flex-1 bg-transparent text-xs text-terminal-text placeholder:text-terminal-muted outline-none"
        />
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 hover:bg-terminal-surface-hover rounded transition-colors"
        >
          <RefreshCw size={13} className={`text-terminal-muted ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto">
        {filteredArticles.length === 0 && !loading && (
          <div className="flex items-center justify-center h-32 text-terminal-muted text-xs">
            No news articles
          </div>
        )}
        {loading && filteredArticles.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {filteredArticles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
