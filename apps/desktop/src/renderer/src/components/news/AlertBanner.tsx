import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import type { NewsArticle } from '@finterm/shared'

interface AlertBannerProps {
  article: NewsArticle
  onDismiss: () => void
}

export function AlertBanner({ article, onDismiss }: AlertBannerProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-terminal-warning/10 border-b border-terminal-warning/30 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <AlertTriangle size={13} className="text-terminal-warning flex-shrink-0" />
        <span className="text-[11px] text-terminal-warning font-medium truncate flex-1">
          {article.headline}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {article.symbols.slice(0, 2).map((sym) => (
            <span
              key={sym}
              className="text-[9px] font-mono px-1 py-0.5 rounded bg-terminal-warning/20 text-terminal-warning"
            >
              {sym}
            </span>
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="p-0.5 hover:bg-terminal-warning/20 rounded transition-colors flex-shrink-0"
        >
          <X size={12} className="text-terminal-warning" />
        </button>
      </div>
    </motion.div>
  )
}
