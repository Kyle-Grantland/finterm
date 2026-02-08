import { ipcMain, BrowserWindow } from 'electron'
import { ClerkAuthService } from '../auth/clerk-service'
import { getAuthWindowService } from '../auth/auth-window'
import type { ClerkUser } from '@finterm/shared'

export function setupAuthHandlers(): void {
  ipcMain.handle('auth:getUser', async () => {
    try {
      const session = await ClerkAuthService.getCurrentUser()
      if (session) {
        return { success: true, user: session.user }
      }
      return { success: false }
    } catch (error) {
      console.error('[IPC:auth] getUser failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('auth:login', async (_event, sessionId: string, clerkUser: ClerkUser) => {
    try {
      await ClerkAuthService.storeUserSession(sessionId, clerkUser)
      return { success: true }
    } catch (error) {
      console.error('[IPC:auth] login failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    try {
      await ClerkAuthService.logout()
      return { success: true }
    } catch (error) {
      console.error('[IPC:auth] logout failed:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('auth:validateSession', async () => {
    try {
      const valid = await ClerkAuthService.validateSession()
      return { success: true, valid }
    } catch (error) {
      console.error('[IPC:auth] validateSession failed:', error)
      return { success: false, valid: false }
    }
  })

  ipcMain.handle('auth:startSignIn', async () => {
    try {
      const authService = getAuthWindowService()
      const token = await authService.openSignInWindow()
      return { success: true, token }
    } catch (error) {
      console.error('[IPC:auth] startSignIn failed:', error)
      return { success: false, error: String(error) }
    }
  })

  // Window controls
  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return BrowserWindow.getFocusedWindow()?.isMaximized() ?? false
  })

  console.log('[IPC] Auth handlers registered')
}
