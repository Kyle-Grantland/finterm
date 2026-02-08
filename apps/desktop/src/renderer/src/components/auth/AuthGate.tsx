import { useAuthStore } from '../../store/auth-store'
import { SignInScreen } from './SignInScreen'

interface AuthGateProps {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-terminal-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-terminal-muted text-sm">Loading FinTerm...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInScreen />
  }

  return <>{children}</>
}
