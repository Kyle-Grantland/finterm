import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Clock } from 'lucide-react'
import { useMarketDataStore } from '../../store/market-data-store'

export function StatusBar() {
  const [time, setTime] = useState(new Date())
  const connected = useMarketDataStore((s) => s.connected)

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const marketStatus = getMarketStatus()

  return (
    <div className="h-6 flex items-center justify-between px-3 bg-terminal-surface border-t border-terminal-border text-[11px] select-none">
      <div className="flex items-center gap-4">
        {/* Market status */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              marketStatus.isOpen ? 'bg-terminal-gain' : 'bg-terminal-loss'
            }`}
          />
          <span className="text-terminal-muted">
            {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi size={11} className="text-terminal-gain" />
          ) : (
            <WifiOff size={11} className="text-terminal-loss" />
          )}
          <span className={connected ? 'text-terminal-gain' : 'text-terminal-loss'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Data provider */}
        <span className="text-terminal-muted">Alpaca Markets</span>

        {/* Clock */}
        <div className="flex items-center gap-1.5 tabular-nums">
          <Clock size={11} className="text-terminal-muted" />
          <span className="text-terminal-muted">
            {time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
            {' ET'}
          </span>
        </div>
      </div>
    </div>
  )
}

function getMarketStatus(): { isOpen: boolean } {
  const now = new Date()
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = etNow.getDay()
  const hours = etNow.getHours()
  const minutes = etNow.getMinutes()
  const totalMinutes = hours * 60 + minutes

  // Market hours: Mon-Fri 9:30 AM - 4:00 PM ET
  const isWeekday = day >= 1 && day <= 5
  const isMarketHours = totalMinutes >= 570 && totalMinutes < 960 // 9:30=570, 16:00=960

  return { isOpen: isWeekday && isMarketHours }
}
