import { ClerkProvider as ReactClerkProvider } from '@clerk/clerk-react'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

interface ClerkProviderProps {
  children: React.ReactNode
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  if (!publishableKey) {
    console.warn('[Clerk] No publishable key found — running in dev mode without auth')
    return <>{children}</>
  }

  return (
    <ReactClerkProvider publishableKey={publishableKey}>
      {children}
    </ReactClerkProvider>
  )
}
