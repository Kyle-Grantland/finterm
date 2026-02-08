import { useState } from 'react'
import type { IDockviewPanelProps } from 'dockview-react'
import { ChartCanvas } from './ChartCanvas'
import { BarChart3, TrendingUp, Minus } from 'lucide-react'
import type { Timeframe, ChartType } from '@finterm/shared'

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
]

const CHART_TYPES: { label: string; value: ChartType; icon: React.ElementType }[] = [
  { label: 'Candles', value: 'candlestick', icon: BarChart3 },
  { label: 'Line', value: 'line', icon: TrendingUp },
  { label: 'Area', value: 'area', icon: Minus },
]

const INDICATORS = ['MA 20', 'MA 50', 'EMA 12', 'EMA 26', 'RSI', 'MACD', 'Bollinger']

export function ChartPanel(props: IDockviewPanelProps) {
  const symbol = (props.params?.symbol as string) || 'AAPL'
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [activeIndicators, setActiveIndicators] = useState<string[]>([])
  const [showIndicators, setShowIndicators] = useState(false)

  const toggleIndicator = (ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    )
  }

  return (
    <div className="flex flex-col h-full bg-terminal-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-terminal-border bg-terminal-surface">
        {/* Symbol */}
        <span className="font-mono text-sm font-bold text-terminal-accent mr-2">{symbol}</span>

        {/* Timeframe selector */}
        <div className="flex items-center gap-0.5 bg-terminal-bg rounded px-1 py-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                timeframe === tf.value
                  ? 'bg-terminal-accent/20 text-terminal-accent'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart type */}
        <div className="flex items-center gap-0.5 bg-terminal-bg rounded px-1 py-0.5 ml-2">
          {CHART_TYPES.map((ct) => {
            const Icon = ct.icon
            return (
              <button
                key={ct.value}
                onClick={() => setChartType(ct.value)}
                title={ct.label}
                className={`p-1 rounded transition-colors ${
                  chartType === ct.value
                    ? 'bg-terminal-accent/20 text-terminal-accent'
                    : 'text-terminal-muted hover:text-terminal-text'
                }`}
              >
                <Icon size={13} />
              </button>
            )
          })}
        </div>

        {/* Indicators */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
              activeIndicators.length > 0
                ? 'bg-terminal-accent/20 text-terminal-accent'
                : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text'
            }`}
          >
            Indicators{activeIndicators.length > 0 ? ` (${activeIndicators.length})` : ''}
          </button>

          {showIndicators && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-terminal-surface border border-terminal-border rounded-md shadow-lg z-10 py-1">
              {INDICATORS.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggleIndicator(ind)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    activeIndicators.includes(ind)
                      ? 'bg-terminal-accent/10 text-terminal-accent'
                      : 'text-terminal-muted hover:bg-terminal-surface-hover hover:text-terminal-text'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ChartCanvas
          symbol={symbol}
          timeframe={timeframe}
          chartType={chartType}
          indicators={activeIndicators}
        />
      </div>
    </div>
  )
}
