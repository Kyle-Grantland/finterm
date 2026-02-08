import { create } from 'zustand'
import type { DockviewApi } from 'dockview-react'

interface WorkspaceState {
  dockApi: DockviewApi | null
  currentLayout: string | null

  setDockApi: (api: DockviewApi) => void
  openChart: (symbol: string) => void
  saveLayout: (name: string) => Promise<void>
  loadLayout: (layoutId: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  dockApi: null,
  currentLayout: null,

  setDockApi: (api) => set({ dockApi: api }),

  openChart: (symbol) => {
    const { dockApi } = get()
    if (!dockApi) return

    const panelId = `chart-${symbol}`
    const existing = dockApi.panels.find((p) => p.id === panelId)

    if (existing) {
      existing.api.setActive()
      return
    }

    dockApi.addPanel({
      id: panelId,
      component: 'chart',
      title: `${symbol} — Chart`,
      params: { symbol },
    })
  },

  saveLayout: async (name) => {
    const { dockApi } = get()
    if (!dockApi) return

    const layoutData = JSON.stringify(dockApi.toJSON())

    try {
      if (window.api?.workspace?.save) {
        await window.api.workspace.save('current-user', name, layoutData)
      }
      set({ currentLayout: name })
    } catch (err) {
      console.error('[WorkspaceStore] Failed to save layout:', err)
    }
  },

  loadLayout: async (layoutId) => {
    try {
      if (window.api?.workspace?.load) {
        const res = await window.api.workspace.load('current-user', layoutId)
        if (res.success && res.data) {
          const { dockApi } = get()
          const layout = res.data as { layoutData: string; name: string }
          if (dockApi && layout.layoutData) {
            dockApi.fromJSON(JSON.parse(layout.layoutData))
            set({ currentLayout: layout.name })
          }
        }
      }
    } catch (err) {
      console.error('[WorkspaceStore] Failed to load layout:', err)
    }
  },
}))
