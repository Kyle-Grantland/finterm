import { useCallback, useRef } from 'react'
import {
  DockviewReact,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
  type DockviewApi,
} from 'dockview-react'
import 'dockview-core/dist/styles/dockview.css'
import { WatchlistPanel } from '../watchlist/WatchlistPanel'
import { ChartPanel } from '../charts/ChartPanel'
import { NewsFeedPanel } from '../news/NewsFeedPanel'
import { useWorkspaceStore } from '../../store/workspace-store'

const components: Record<string, React.FC<IDockviewPanelProps>> = {
  watchlist: WatchlistPanel,
  chart: ChartPanel,
  news: NewsFeedPanel,
}

export function DockLayout() {
  const apiRef = useRef<DockviewApi | null>(null)
  const setDockApi = useWorkspaceStore((s) => s.setDockApi)

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      apiRef.current = event.api
      setDockApi(event.api)

      // Default layout
      event.api.addPanel({
        id: 'watchlist-1',
        component: 'watchlist',
        title: 'Watchlist',
        params: {},
      })

      const chartPanel = event.api.addPanel({
        id: 'chart-1',
        component: 'chart',
        title: 'AAPL — Chart',
        params: { symbol: 'AAPL' },
      })

      event.api.addPanel({
        id: 'news-1',
        component: 'news',
        title: 'News Feed',
        params: {},
        position: {
          referencePanel: chartPanel,
          direction: 'right',
        },
      })

      // Set sizes
      const groups = event.api.groups
      if (groups.length >= 1) {
        // Try to set proportional sizes
        try {
          event.api.getGroup(groups[0].id)?.api.setSize({ width: 280 })
        } catch {
          // Size setting may not be available in all configurations
        }
      }
    },
    [setDockApi]
  )

  return (
    <DockviewReact
      components={components}
      onReady={onReady}
      className="dv-dockview h-full"
    />
  )
}
