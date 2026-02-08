import { useState } from 'react'
import { useAuthStore } from '../../store/auth-store'
import { motion } from 'framer-motion'

export function SignInScreen() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!window.api?.auth?.startSignIn) {
        // Dev mode — auto-authenticate with mock user
        await login('dev-session', {
          id: 'dev-user',
          emailAddresses: [{ emailAddress: 'dev@finterm.app', id: '1' }],
          firstName: 'Dev',
          lastName: 'User',
          imageUrl: '',
          createdAt: Date.now(),
        })
        return
      }

      const result = await window.api.auth.startSignIn()
      if (!result.success) {
        setError(result.error || 'Sign in failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-terminal-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8 max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl font-bold tracking-tight">
            <span className="text-terminal-accent">Fin</span>
            <span className="text-terminal-text">Term</span>
          </div>
          <p className="text-terminal-muted text-sm">Bloomberg Terminal Lite</p>
        </div>

        {/* Sign in card */}
        <div className="w-full bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center">Welcome Back</h2>
          <p className="text-terminal-muted text-sm text-center">
            Sign in to access your terminal
          </p>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-terminal-accent hover:bg-terminal-accent/90
                       text-white font-medium rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-terminal-accent/50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-terminal-loss text-sm text-center"
            >
              {error}
            </motion.p>
          )}
        </div>

        <p className="text-terminal-muted text-xs">
          Real-time market data powered by Alpaca
        </p>
      </motion.div>
    </div>
  )
}
