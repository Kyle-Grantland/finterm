import { create } from 'zustand'
import type { ClerkUser } from '@finterm/shared'

interface AuthState {
  user: ClerkUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setUser: (user: ClerkUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (sessionId: string, clerkUser: ClerkUser) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  login: async (sessionId, clerkUser) => {
    try {
      set({ isLoading: true, error: null })

      if (window.api?.auth?.login) {
        await window.api.auth.login(sessionId, clerkUser)
      }

      set({ user: clerkUser, isAuthenticated: true, isLoading: false, error: null })
    } catch (error) {
      set({
        error: 'Login failed. Please try again.',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      })
      throw error
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true })

      if (window.api?.auth?.logout) {
        await window.api.auth.logout()
      }

      set({ user: null, isAuthenticated: false, isLoading: false, error: null })
    } catch (error) {
      set({ error: 'Logout failed.', isLoading: false })
      throw error
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true })

      if (window.api?.auth?.getUser) {
        const result = await window.api.auth.getUser()
        if (result.success && result.user) {
          set({
            user: result.user as ClerkUser,
            isAuthenticated: true,
            isLoading: false,
          })
          return
        }
      }

      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
