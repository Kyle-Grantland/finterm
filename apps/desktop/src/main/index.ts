import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupAuthHandlers } from './ipc/auth-handlers'
import { setupDataHandlers } from './ipc/data-handlers'
import { setupWorkspaceHandlers } from './ipc/workspace-handlers'
import { getProviderManager } from './providers/provider-manager'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    frame: false, // Custom frameless titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.finterm')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    console.log('[Main] Setting up IPC handlers...')
    setupAuthHandlers()
    setupDataHandlers()
    setupWorkspaceHandlers()

    console.log('[Main] Initializing provider manager...')
    const providerManager = getProviderManager()
    await providerManager.initialize()

    console.log('[Main] Initialization complete')
  } catch (error) {
    console.error('[Main] Failed to initialize:', error)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  console.log('[Main] Cleaning up before quit...')
  try {
    const providerManager = getProviderManager()
    await providerManager.dispose()
  } catch (error) {
    console.error('[Main] Cleanup error:', error)
  }
})
