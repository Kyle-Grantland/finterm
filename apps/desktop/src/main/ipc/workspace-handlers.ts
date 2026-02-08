import { ipcMain } from 'electron'
import { getWorkspaceService } from '../services/workspace-service'

export function setupWorkspaceHandlers(): void {
  ipcMain.handle('workspace:save', async (_event, userId: string, name: string, layoutData: string) => {
    try {
      const service = getWorkspaceService()
      const layout = await service.saveLayout(userId, name, layoutData)
      return { success: true, data: layout }
    } catch (error) {
      console.error('[IPC:workspace] save failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('workspace:load', async (_event, userId: string, layoutId?: string) => {
    try {
      const service = getWorkspaceService()
      const layout = layoutId
        ? await service.getLayout(layoutId)
        : await service.getDefaultLayout(userId)
      return { success: true, data: layout }
    } catch (error) {
      console.error('[IPC:workspace] load failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('workspace:list', async (_event, userId: string) => {
    try {
      const service = getWorkspaceService()
      const layouts = await service.listLayouts(userId)
      return { success: true, data: layouts }
    } catch (error) {
      console.error('[IPC:workspace] list failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('workspace:delete', async (_event, layoutId: string) => {
    try {
      const service = getWorkspaceService()
      await service.deleteLayout(layoutId)
      return { success: true }
    } catch (error) {
      console.error('[IPC:workspace] delete failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('workspace:setDefault', async (_event, userId: string, layoutId: string) => {
    try {
      const service = getWorkspaceService()
      await service.setDefaultLayout(userId, layoutId)
      return { success: true }
    } catch (error) {
      console.error('[IPC:workspace] setDefault failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // Watchlist
  ipcMain.handle('watchlist:list', async (_event, userId: string) => {
    try {
      const service = getWorkspaceService()
      const watchlists = await service.listWatchlists(userId)
      return { success: true, data: watchlists }
    } catch (error) {
      console.error('[IPC:watchlist] list failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('watchlist:create', async (_event, userId: string, name: string) => {
    try {
      const service = getWorkspaceService()
      const watchlist = await service.createWatchlist(userId, name)
      return { success: true, data: watchlist }
    } catch (error) {
      console.error('[IPC:watchlist] create failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('watchlist:addItem', async (_event, watchlistId: string, symbol: string, name: string) => {
    try {
      const service = getWorkspaceService()
      const item = await service.addWatchlistItem(watchlistId, symbol, name)
      return { success: true, data: item }
    } catch (error) {
      console.error('[IPC:watchlist] addItem failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('watchlist:removeItem', async (_event, watchlistId: string, symbol: string) => {
    try {
      const service = getWorkspaceService()
      await service.removeWatchlistItem(watchlistId, symbol)
      return { success: true }
    } catch (error) {
      console.error('[IPC:watchlist] removeItem failed:', error)
      return { success: false, error: String(error) }
    }
  })

  console.log('[IPC] Workspace handlers registered')
}
