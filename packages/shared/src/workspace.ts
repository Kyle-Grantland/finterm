export interface WorkspaceLayout {
  id: string
  name: string
  layoutData: string // Serialized Dockview layout JSON
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type DefaultLayoutName = 'Overview' | 'Multi-Chart' | 'Research'

export interface PanelState {
  type: 'watchlist' | 'chart' | 'news' | 'settings'
  props?: Record<string, unknown>
}
