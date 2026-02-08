import type { NormalizedBar } from '@finterm/shared'

export interface IndicatorPoint {
  time: number
  value: number
}

export interface IndicatorLine {
  label: string
  color?: string
  data: IndicatorPoint[]
}

export function computeIndicator(name: string, bars: NormalizedBar[]): IndicatorLine[] {
  const closes = bars.map((b) => b.close)

  if (name.startsWith('MA ')) {
    const period = parseInt(name.split(' ')[1])
    return [
      {
        label: name,
        data: sma(closes, period).map((v, i) => ({
          time: bars[i + period - 1]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
    ]
  }

  if (name.startsWith('EMA ')) {
    const period = parseInt(name.split(' ')[1])
    return [
      {
        label: name,
        data: ema(closes, period).map((v, i) => ({
          time: bars[i]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
    ]
  }

  if (name === 'RSI') {
    const rsiValues = rsi(closes, 14)
    return [
      {
        label: 'RSI 14',
        color: '#a371f7',
        data: rsiValues.map((v, i) => ({
          time: bars[i + 14]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
    ]
  }

  if (name === 'MACD') {
    const macdResult = macd(closes)
    return [
      {
        label: 'MACD Line',
        color: '#58a6ff',
        data: macdResult.macdLine.map((v, i) => ({
          time: bars[i + 25]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
      {
        label: 'Signal Line',
        color: '#f0883e',
        data: macdResult.signalLine.map((v, i) => ({
          time: bars[i + 33]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
    ]
  }

  if (name === 'Bollinger') {
    const result = bollingerBands(closes, 20, 2)
    return [
      {
        label: 'BB Upper',
        color: 'rgba(88, 166, 255, 0.5)',
        data: result.upper.map((v, i) => ({
          time: bars[i + 19]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
      {
        label: 'BB Middle',
        color: 'rgba(88, 166, 255, 0.3)',
        data: result.middle.map((v, i) => ({
          time: bars[i + 19]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
      {
        label: 'BB Lower',
        color: 'rgba(88, 166, 255, 0.5)',
        data: result.lower.map((v, i) => ({
          time: bars[i + 19]?.timestamp ?? 0,
          value: v,
        })).filter(d => d.time > 0),
      },
    ]
  }

  return []
}

// Simple Moving Average
function sma(data: number[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    result.push(sum / period)
  }
  return result
}

// Exponential Moving Average
function ema(data: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)

  // Start with SMA for first value
  let sum = 0
  for (let i = 0; i < period; i++) {
    sum += data[i]
  }
  result.push(sum / period)

  for (let i = period; i < data.length; i++) {
    result.push((data[i] - result[result.length - 1]) * multiplier + result[result.length - 1])
  }

  // Pad with NaN for alignment
  const padded = new Array(period - 1).fill(NaN).concat(result)
  return padded.filter((v) => !isNaN(v))
}

// RSI
function rsi(data: number[], period: number): number[] {
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1]
    gains.push(diff > 0 ? diff : 0)
    losses.push(diff < 0 ? Math.abs(diff) : 0)
  }

  const result: number[] = []
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push(100 - 100 / (1 + rs))
  }

  return result
}

// MACD
function macd(data: number[]) {
  const ema12 = ema(data, 12)
  const ema26 = ema(data, 26)

  const macdLine: number[] = []
  const offset = ema12.length - ema26.length
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i])
  }

  const signalLine = ema(macdLine, 9)

  return { macdLine, signalLine }
}

// Bollinger Bands
function bollingerBands(data: number[], period: number, stdDev: number) {
  const middle = sma(data, period)
  const upper: number[] = []
  const lower: number[] = []

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1)
    const mean = middle[i - period + 1]
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
    const sd = Math.sqrt(variance) * stdDev
    upper.push(mean + sd)
    lower.push(mean - sd)
  }

  return { upper, middle, lower }
}
