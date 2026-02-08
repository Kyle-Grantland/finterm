import { SecureStorage } from '../storage/secure-store'
import { getPrismaClient } from '../database/prisma'
import type { ClerkUser, AuthSession } from '@finterm/shared'

export class ClerkAuthService {
  static async storeUserSession(sessionId: string, clerkUser: ClerkUser): Promise<void> {
    try {
      console.log('[ClerkAuth] Storing user session with sessionId:', sessionId)

      SecureStorage.setClerkSessionId(sessionId)
      SecureStorage.setClerkUser(clerkUser.id, clerkUser)

      const prisma = getPrismaClient()
      const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || ''
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ')

      await prisma.user.upsert({
        where: { id: clerkUser.id },
        update: {
          email: primaryEmail,
          name: fullName || null,
          updatedAt: new Date(),
        },
        create: {
          id: clerkUser.id,
          email: primaryEmail,
          name: fullName || null,
          licenseTier: 'free',
        },
      })

      console.log('[ClerkAuth] User session stored successfully')
    } catch (error) {
      console.error('[ClerkAuth] Failed to store user session:', error)
      throw error
    }
  }

  static async getCurrentUser(): Promise<AuthSession | null> {
    try {
      const sessionId = SecureStorage.getClerkSessionId()
      const userData = SecureStorage.getClerkUser()

      if (!sessionId || !userData) {
        console.log('[ClerkAuth] No active session found')
        return null
      }

      console.log('[ClerkAuth] Active session found for user:', userData.userId)
      return {
        sessionId,
        user: userData.user as ClerkUser,
      }
    } catch (error) {
      console.error('[ClerkAuth] Failed to get current user:', error)
      return null
    }
  }

  static async logout(): Promise<void> {
    try {
      console.log('[ClerkAuth] Logging out user...')
      SecureStorage.clearClerkSessionId()
      SecureStorage.clearClerkUser()
      console.log('[ClerkAuth] User logged out successfully')
    } catch (error) {
      console.error('[ClerkAuth] Failed to logout:', error)
      throw error
    }
  }

  static async validateSession(): Promise<boolean> {
    try {
      const session = await this.getCurrentUser()
      if (!session) return false
      console.log('[ClerkAuth] Session is valid')
      return true
    } catch (error) {
      console.error('[ClerkAuth] Session validation failed:', error)
      return false
    }
  }
}
