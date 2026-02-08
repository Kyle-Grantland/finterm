import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspaceStore } from '../../store/workspace-store'

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ symbol: string; name: string }>>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const openChart = useWorkspaceStore((s) => s.openChart)

  // Keyboard shortcut: Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    setSelectedIndex(0)
    if (q.length < 1) {
      setResults([])
      return
    }

    try {
      if (window.api?.market?.searchSymbols) {
        const res = await window.api.market.searchSymbols(q)
        if (res.success && res.data) {
          setResults(
            (res.data as Array<{ symbol: string; name: string }>).slice(0, 8)
          )
        }
      }
    } catch {
      // Ignore search errors
    }
  }, [])

  const handleSelect = useCallback(
    (symbol: string) => {
      openChart(symbol)
      setOpen(false)
    },
    [openChart]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex].symbol)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-[480px] bg-terminal-surface border border-terminal-border rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-terminal-border">
              <Search size={16} className="text-terminal-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search symbols... (e.g. AAPL, TSLA)"
                className="flex-1 bg-transparent text-sm text-terminal-text placeholder:text-terminal-muted outline-none"
              />
              <button onClick={() => setOpen(false)}>
                <X size={14} className="text-terminal-muted hover:text-terminal-text" />
              </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="max-h-64 overflow-y-auto py-1">
                {results.map((r, i) => (
                  <button
                    key={r.symbol}
                    onClick={() => handleSelect(r.symbol)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      i === selectedIndex
                        ? 'bg-terminal-accent/10 text-terminal-accent'
                        : 'hover:bg-terminal-surface-hover'
                    }`}
                  >
                    <span className="font-mono font-semibold w-16">{r.symbol}</span>
                    <span className="text-terminal-muted truncate">{r.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Hint */}
            <div className="px-4 py-2 border-t border-terminal-border">
              <span className="text-[10px] text-terminal-muted">
                Press <kbd className="px-1 py-0.5 bg-terminal-bg rounded text-[9px]">Enter</kbd> to open chart
                {' '}<kbd className="px-1 py-0.5 bg-terminal-bg rounded text-[9px]">Esc</kbd> to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
