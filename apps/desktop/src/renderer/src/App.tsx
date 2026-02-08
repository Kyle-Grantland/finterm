import { useEffect } from 'react'
import { ClerkProvider } from './components/auth/ClerkProvider'
import { AuthGate } from './components/auth/AuthGate'
import { TitleBar } from './components/layout/TitleBar'
import { DockLayout } from './components/layout/DockLayout'
import { StatusBar } from './components/layout/StatusBar'
import { CommandBar } from './components/layout/CommandBar'
import { useAuthStore } from './store/auth-store'

export function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <ClerkProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-terminal-bg">
        <TitleBar />
        <AuthGate>
          <div className="flex-1 overflow-hidden">
            <DockLayout />
          </div>
          <StatusBar />
          <CommandBar />
        </AuthGate>
      </div>
    </ClerkProvider>
  )
}
