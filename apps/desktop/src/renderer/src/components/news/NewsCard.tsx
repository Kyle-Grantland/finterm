import type { NewsArticle } from '@finterm/shared'
import { ExternalLink } from 'lucide-react'

interface NewsCardProps {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps) {
  const timeAgo = getTimeAgo(article.publishedAt)

  const handleClick = () => {
    // Open in external browser via Electron's shell
    if (article.url) {
      window.open(article.url, '_blank')
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group px-3 py-2.5 border-b border-terminal-border/50 hover:bg-terminal-surface-hover cursor-pointer transition-colors"
    >
      {/* Headline */}
      <h3 className="text-xs font-medium text-terminal-text leading-relaxed group-hover:text-terminal-accent transition-colors">
        {article.headline}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-1.5">
        {/* Source */}
        <span className="text-[10px] text-terminal-muted">{article.source}</span>

        <span className="text-terminal-border">|</span>

        {/* Time */}
        <span className="text-[10px] text-terminal-muted">{timeAgo}</span>

        {/* Symbols */}
        {article.symbols.length > 0 && (
          <>
            <span className="text-terminal-border">|</span>
            <div className="flex items-center gap-1">
              {article.symbols.slice(0, 3).map((sym) => (
                <span
                  key={sym}
                  className="text-[9px] font-mono px-1 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent"
                >
                  {sym}
                </span>
              ))}
              {article.symbols.length > 3 && (
                <span className="text-[9px] text-terminal-muted">
                  +{article.symbols.length - 3}
                </span>
              )}
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* External link icon */}
        <ExternalLink
          size={10}
          className="text-terminal-muted opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Summary (truncated) */}
      {article.summary && (
        <p className="text-[10px] text-terminal-muted mt-1 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
