import { useEffect, useState } from 'react'
import type { IDockviewPanelProps } from 'dockview-react'
import { Plus, Search } from 'lucide-react'
import { TickerRow } from './TickerRow'
import { AddTickerDialog } from './AddTickerDialog'
import { useWatchlistStore } from '../../store/watchlist-store'
import { useMarketDataStore } from '../../store/market-data-store'
import { useWorkspaceStore } from '../../store/workspace-store'

export function WatchlistPanel(_props: IDockviewPanelProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('')
  const { symbols, addSymbol, removeSymbol } = useWatchlistStore()
  const quotes = useMarketDataStore((s) => s.quotes)
  const subscribe = useMarketDataStore((s) => s.subscribe)
  const openChart = useWorkspaceStore((s) => s.openChart)

  // Subscribe to quote updates for all watchlist symbols
  useEffect(() => {
    if (symbols.length > 0) {
      subscribe(symbols, ['quote', 'trade'])
    }
  }, [symbols, subscribe])

  const filteredSymbols = filter
    ? symbols.filter((s) => s.toLowerCase().includes(filter.toLowerCase()))
    : symbols

  return (
    <div className="flex flex-col h-full bg-terminal-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-terminal-border">
        <div className="flex items-center gap-2 flex-1">
          <Search size={13} className="text-terminal-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="flex-1 bg-transparent text-xs text-terminal-text placeholder:text-terminal-muted outline-none"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="p-1 hover:bg-terminal-surface-hover rounded transition-colors"
          title="Add symbol"
        >
          <Plus size={14} className="text-terminal-muted" />
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_72px_56px] gap-1 px-3 py-1 text-[10px] text-terminal-muted uppercase tracking-wider border-b border-terminal-border">
        <span>Symbol</span>
        <span className="text-right">Last</span>
        <span className="text-right">Change</span>
        <span className="text-right">%</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filteredSymbols.map((symbol) => (
          <TickerRow
            key={symbol}
            symbol={symbol}
            quote={quotes[symbol] || null}
            onClick={() => openChart(symbol)}
            onRemove={() => removeSymbol(symbol)}
          />
        ))}
        {filteredSymbols.length === 0 && (
          <div className="flex items-center justify-center h-32 text-terminal-muted text-xs">
            {symbols.length === 0 ? 'No symbols added' : 'No matches'}
          </div>
        )}
      </div>

      {/* Add ticker dialog */}
      <AddTickerDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(symbol, name) => {
          addSymbol(symbol, name)
          setShowAdd(false)
        }}
      />
    </div>
  )
}
