import { useEffect, useRef, useCallback } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CrosshairMode,
  type CandlestickData,
  type LineData,
  type Time,
} from 'lightweight-charts'
import type { ChartType, Timeframe } from '@finterm/shared'
import { useChartStore } from '../../store/chart-store'
import { computeIndicator, type IndicatorLine } from './indicators/compute'

interface ChartCanvasProps {
  symbol: string
  timeframe: Timeframe
  chartType: ChartType
  indicators: string[]
}

export function ChartCanvas({ symbol, timeframe, chartType, indicators }: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
  const loadBars = useChartStore((s) => s.loadBars)
  const bars = useChartStore((s) => s.bars[`${symbol}-${timeframe}`] ?? [])

  // Create/destroy chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#8b949e',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(48, 54, 61, 0.5)' },
        horzLines: { color: 'rgba(48, 54, 61, 0.5)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(88, 166, 255, 0.3)',
          labelBackgroundColor: '#58a6ff',
        },
        horzLine: {
          color: 'rgba(88, 166, 255, 0.3)',
          labelBackgroundColor: '#58a6ff',
        },
      },
      rightPriceScale: {
        borderColor: '#30363d',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: true,
      handleScroll: true,
    })

    chartRef.current = chart

    // Handle resize
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      chart.applyOptions({ width, height })
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      mainSeriesRef.current = null
      indicatorSeriesRef.current.clear()
    }
  }, [])

  // Update series type when chartType changes
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    // Remove existing main series
    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current)
      mainSeriesRef.current = null
    }

    // Create new series based on type
    switch (chartType) {
      case 'candlestick':
        mainSeriesRef.current = chart.addCandlestickSeries({
          upColor: '#3fb950',
          downColor: '#f85149',
          borderUpColor: '#3fb950',
          borderDownColor: '#f85149',
          wickUpColor: '#3fb950',
          wickDownColor: '#f85149',
        })
        break
      case 'line':
        mainSeriesRef.current = chart.addLineSeries({
          color: '#58a6ff',
          lineWidth: 2,
        })
        break
      case 'area':
        mainSeriesRef.current = chart.addAreaSeries({
          lineColor: '#58a6ff',
          topColor: 'rgba(88, 166, 255, 0.3)',
          bottomColor: 'rgba(88, 166, 255, 0.02)',
          lineWidth: 2,
        })
        break
    }
  }, [chartType])

  // Load data
  useEffect(() => {
    loadBars(symbol, timeframe)
  }, [symbol, timeframe, loadBars])

  // Set data on series
  useEffect(() => {
    if (!mainSeriesRef.current || bars.length === 0) return

    if (chartType === 'candlestick') {
      const data: CandlestickData[] = bars.map((b) => ({
        time: (b.timestamp / 1000) as Time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
      ;(mainSeriesRef.current as ISeriesApi<'Candlestick'>).setData(data)
    } else {
      const data: LineData[] = bars.map((b) => ({
        time: (b.timestamp / 1000) as Time,
        value: b.close,
      }))
      ;(mainSeriesRef.current as ISeriesApi<'Line'>).setData(data)
    }

    chartRef.current?.timeScale().fitContent()
  }, [bars, chartType])

  // Handle indicators
  const updateIndicators = useCallback(() => {
    const chart = chartRef.current
    if (!chart || bars.length === 0) return

    // Remove old indicator series
    for (const [key, series] of indicatorSeriesRef.current) {
      if (!indicators.includes(key)) {
        chart.removeSeries(series)
        indicatorSeriesRef.current.delete(key)
      }
    }

    // Add/update indicators
    const indicatorColors = [
      '#f0883e', '#a371f7', '#d29922', '#3fb950', '#f778ba', '#79c0ff', '#ffa657',
    ]

    indicators.forEach((ind, i) => {
      const lines: IndicatorLine[] = computeIndicator(ind, bars)
      if (lines.length === 0) return

      for (const line of lines) {
        const key = `${ind}-${line.label}`
        let series = indicatorSeriesRef.current.get(key)

        if (!series) {
          series = chart.addLineSeries({
            color: line.color || indicatorColors[i % indicatorColors.length],
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          indicatorSeriesRef.current.set(key, series)
        }

        series.setData(
          line.data.map((d) => ({
            time: (d.time / 1000) as Time,
            value: d.value,
          }))
        )
      }
    })
  }, [bars, indicators])

  useEffect(() => {
    updateIndicators()
  }, [updateIndicators])

  return (
    <div ref={containerRef} className="w-full h-full" />
  )
}
