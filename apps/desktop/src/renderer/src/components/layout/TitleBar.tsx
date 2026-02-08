import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const check = async () => {
      if (window.api?.window?.isMaximized) {
        setIsMaximized(await window.api.window.isMaximized())
      }
    }
    check()
  }, [])

  const handleMinimize = () => window.api?.window?.minimize()
  const handleMaximize = async () => {
    await window.api?.window?.maximize()
    setIsMaximized(!isMaximized)
  }
  const handleClose = () => window.api?.window?.close()

  return (
    <div
      className="h-8 flex items-center justify-between bg-terminal-surface border-b border-terminal-border select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-2 pl-3">
        <span className="text-xs font-bold tracking-wider">
          <span className="text-terminal-accent">FIN</span>
          <span className="text-terminal-text">TERM</span>
        </span>
        <span className="text-[10px] text-terminal-muted font-mono">v0.1.0</span>
      </div>

      {/* Right: Window controls */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-full px-3 hover:bg-terminal-surface-hover transition-colors"
          title="Minimize"
        >
          <Minus size={14} className="text-terminal-muted" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3 hover:bg-terminal-surface-hover transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <Copy size={12} className="text-terminal-muted" />
          ) : (
            <Square size={12} className="text-terminal-muted" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-3 hover:bg-terminal-loss transition-colors"
          title="Close"
        >
          <X size={14} className="text-terminal-muted hover:text-white" />
        </button>
      </div>
    </div>
  )
}
