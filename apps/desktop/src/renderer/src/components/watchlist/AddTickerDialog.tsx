import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AddTickerDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (symbol: string, name: string) => void
}

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

export function AddTickerDialog({ open, onClose, onAdd }: AddTickerDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      if (window.api?.market?.searchSymbols) {
        const res = await window.api.market.searchSymbols(q)
        if (res.success && res.data) {
          setResults(res.data as SearchResult[])
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-[400px] bg-terminal-surface border border-terminal-border rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border">
              <Search size={14} className="text-terminal-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search by symbol or name..."
                className="flex-1 bg-transparent text-sm outline-none text-terminal-text placeholder:text-terminal-muted"
              />
              <button onClick={onClose}>
                <X size={14} className="text-terminal-muted" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && results.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => onAdd(r.symbol, r.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-terminal-surface-hover transition-colors"
                >
                  <span className="font-mono text-sm font-semibold text-terminal-accent w-16">
                    {r.symbol}
                  </span>
                  <span className="text-sm text-terminal-text truncate flex-1">
                    {r.name}
                  </span>
                  <span className="text-[10px] text-terminal-muted uppercase">
                    {r.exchange}
                  </span>
                </button>
              ))}
              {!loading && query && results.length === 0 && (
                <div className="py-4 text-center text-sm text-terminal-muted">
                  No results found
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
