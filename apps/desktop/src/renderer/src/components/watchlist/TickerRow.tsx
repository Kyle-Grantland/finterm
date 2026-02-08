import { useRef, useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import type { NormalizedQuote } from '@finterm/shared'

interface TickerRowProps {
  symbol: string
  quote: NormalizedQuote | null
  onClick: () => void
  onRemove: () => void
}

export function TickerRow({ symbol, quote, onClick, onRemove }: TickerRowProps) {
  const [flashClass, setFlashClass] = useState('')
  const prevPrice = useRef<number | null>(null)

  useEffect(() => {
    if (!quote?.last || prevPrice.current === null) {
      prevPrice.current = quote?.last ?? null
      return
    }

    if (quote.last > prevPrice.current) {
      setFlashClass('price-up')
    } else if (quote.last < prevPrice.current) {
      setFlashClass('price-down')
    }

    prevPrice.current = quote.last

    const timer = setTimeout(() => setFlashClass(''), 600)
    return () => clearTimeout(timer)
  }, [quote?.last])

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove()
    },
    [onRemove]
  )

  const change = quote?.change ?? 0
  const changePercent = quote?.changePercent ?? 0
  const isPositive = change >= 0
  const colorClass = isPositive ? 'text-terminal-gain' : 'text-terminal-loss'

  return (
    <div
      onClick={onClick}
      className={`group grid grid-cols-[1fr_80px_72px_56px] gap-1 items-center px-3 py-1.5
                  hover:bg-terminal-surface-hover cursor-pointer transition-colors border-b border-terminal-border/50
                  ${flashClass}`}
    >
      {/* Symbol + name */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-xs font-semibold text-terminal-text">{symbol}</span>
        <button
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-terminal-loss/20 rounded transition-all"
        >
          <X size={10} className="text-terminal-muted" />
        </button>
      </div>

      {/* Last price */}
      <span className={`text-right font-mono text-xs tabular-nums ${colorClass}`}>
        {quote?.last ? formatPrice(quote.last) : '—'}
      </span>

      {/* Change */}
      <span className={`text-right font-mono text-xs tabular-nums ${colorClass}`}>
        {quote ? `${isPositive ? '+' : ''}${formatPrice(change)}` : '—'}
      </span>

      {/* Change % */}
      <span className={`text-right font-mono text-[11px] tabular-nums ${colorClass}`}>
        {quote ? `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%` : '—'}
      </span>
    </div>
  )
}

function formatPrice(value: number): string {
  if (Math.abs(value) >= 1000) return value.toFixed(2)
  if (Math.abs(value) >= 1) return value.toFixed(2)
  return value.toFixed(4)
}
