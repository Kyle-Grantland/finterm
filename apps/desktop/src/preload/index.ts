import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Auth
  auth: {
    getUser: () => ipcRenderer.invoke('auth:getUser'),
    login: (sessionId: string, clerkUser: unknown) =>
      ipcRenderer.invoke('auth:login', sessionId, clerkUser),
    logout: () => ipcRenderer.invoke('auth:logout'),
    validateSession: () => ipcRenderer.invoke('auth:validateSession'),
    startSignIn: () => ipcRenderer.invoke('auth:startSignIn'),
  },

  // Window controls (frameless)
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Market data
  market: {
    getQuote: (symbol: string) => ipcRenderer.invoke('market:getQuote', symbol),
    getBars: (symbol: string, timeframe: string, start: string, end: string) =>
      ipcRenderer.invoke('market:getBars', symbol, timeframe, start, end),
    searchSymbols: (query: string) => ipcRenderer.invoke('market:searchSymbols', query),
    subscribe: (symbols: string[], types: string[]) =>
      ipcRenderer.invoke('market:subscribe', symbols, types),
    unsubscribe: (symbols: string[], types: string[]) =>
      ipcRenderer.invoke('market:unsubscribe', symbols, types),
    onQuotesBatch: (callback: (quotes: unknown[]) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, quotes: unknown[]) => callback(quotes)
      ipcRenderer.on('market:quotes-batch', listener)
      return () => ipcRenderer.removeListener('market:quotes-batch', listener)
    },
    onTrade: (callback: (trade: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, trade: unknown) => callback(trade)
      ipcRenderer.on('market:trade', listener)
      return () => ipcRenderer.removeListener('market:trade', listener)
    },
    onBar: (callback: (bar: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, bar: unknown) => callback(bar)
      ipcRenderer.on('market:bar', listener)
      return () => ipcRenderer.removeListener('market:bar', listener)
    },
    onStatus: (callback: (status: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status)
      ipcRenderer.on('market:status', listener)
      return () => ipcRenderer.removeListener('market:status', listener)
    },
  },

  // News
  news: {
    get: (filter: Record<string, unknown>) => ipcRenderer.invoke('news:get', filter),
    subscribe: (symbols: string[]) => ipcRenderer.invoke('news:subscribe', symbols),
    onArticle: (callback: (article: unknown) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, article: unknown) => callback(article)
      ipcRenderer.on('news:article', listener)
      return () => ipcRenderer.removeListener('news:article', listener)
    },
  },

  // Workspace
  workspace: {
    save: (userId: string, name: string, layoutData: string) =>
      ipcRenderer.invoke('workspace:save', userId, name, layoutData),
    load: (userId: string, layoutId?: string) =>
      ipcRenderer.invoke('workspace:load', userId, layoutId),
    list: (userId: string) => ipcRenderer.invoke('workspace:list', userId),
    delete: (layoutId: string) => ipcRenderer.invoke('workspace:delete', layoutId),
    setDefault: (userId: string, layoutId: string) =>
      ipcRenderer.invoke('workspace:setDefault', userId, layoutId),
  },

  // Watchlist
  watchlist: {
    list: (userId: string) => ipcRenderer.invoke('watchlist:list', userId),
    create: (userId: string, name: string) => ipcRenderer.invoke('watchlist:create', userId, name),
    addItem: (watchlistId: string, symbol: string, name: string) =>
      ipcRenderer.invoke('watchlist:addItem', watchlistId, symbol, name),
    removeItem: (watchlistId: string, symbol: string) =>
      ipcRenderer.invoke('watchlist:removeItem', watchlistId, symbol),
  },

  // Provider configuration
  provider: {
    setCredentials: (apiKey: string, apiSecret: string) =>
      ipcRenderer.invoke('provider:setCredentials', apiKey, apiSecret),
    getStatus: () => ipcRenderer.invoke('provider:getStatus'),
    hasCredentials: () => ipcRenderer.invoke('provider:hasCredentials'),
  },
}

contextBridge.exposeInMainWorld('api', api)

// Type declaration for renderer
export type ApiType = typeof api
