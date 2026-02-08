import Store from 'electron-store'
import { safeStorage } from 'electron'

interface SecureStoreSchema {
  clerkSessionId: string
  clerkUserId: string
  clerkUser: string
  alpacaApiKey: string
  alpacaApiSecret: string
  lastLoginAt: string
  _encryptionVersion: number
}

const secureStore = new Store<SecureStoreSchema>({
  name: 'finterm-secure-storage',
  clearInvalidConfig: true,
})

const ENCRYPTION_VERSION = 1

function encrypt(plainText: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[SecureStorage] safeStorage not available, storing in plain text')
    return plainText
  }
  const encrypted = safeStorage.encryptString(plainText)
  return encrypted.toString('base64')
}

function decrypt(encryptedBase64: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[SecureStorage] safeStorage not available, assuming plain text')
    return encryptedBase64
  }
  try {
    const encrypted = Buffer.from(encryptedBase64, 'base64')
    return safeStorage.decryptString(encrypted)
  } catch (error) {
    console.error('[SecureStorage] Decryption failed:', error)
    return ''
  }
}

function checkAndMigrateEncryption(): void {
  const version = secureStore.get('_encryptionVersion')
  if (version !== ENCRYPTION_VERSION) {
    console.log('[SecureStorage] Encryption version mismatch, clearing old data')
    secureStore.clear()
    secureStore.set('_encryptionVersion', ENCRYPTION_VERSION)
  }
}

checkAndMigrateEncryption()

export class SecureStorage {
  static isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable()
  }

  // Clerk session
  static setClerkSessionId(sessionId: string): void {
    secureStore.set('clerkSessionId', encrypt(sessionId))
  }

  static getClerkSessionId(): string | null {
    const encrypted = secureStore.get('clerkSessionId')
    if (!encrypted) return null
    return decrypt(encrypted) || null
  }

  static clearClerkSessionId(): void {
    secureStore.delete('clerkSessionId')
  }

  // User data
  static setClerkUser(userId: string, user: unknown): void {
    secureStore.set('clerkUserId', encrypt(userId))
    secureStore.set('clerkUser', encrypt(JSON.stringify(user)))
    secureStore.set('lastLoginAt', new Date().toISOString())
  }

  static getClerkUser(): { userId: string; user: unknown } | null {
    const encryptedUserId = secureStore.get('clerkUserId')
    const encryptedUser = secureStore.get('clerkUser')
    if (!encryptedUserId || !encryptedUser) return null

    const userId = decrypt(encryptedUserId)
    const userJson = decrypt(encryptedUser)
    if (!userId || !userJson) return null

    try {
      return { userId, user: JSON.parse(userJson) }
    } catch {
      console.error('[SecureStorage] Failed to parse user data')
      return null
    }
  }

  static clearClerkUser(): void {
    secureStore.delete('clerkUserId')
    secureStore.delete('clerkUser')
    secureStore.delete('lastLoginAt')
  }

  // Alpaca API credentials
  static setAlpacaCredentials(apiKey: string, apiSecret: string): void {
    secureStore.set('alpacaApiKey', encrypt(apiKey))
    secureStore.set('alpacaApiSecret', encrypt(apiSecret))
  }

  static getAlpacaCredentials(): { apiKey: string; apiSecret: string } | null {
    const encryptedKey = secureStore.get('alpacaApiKey')
    const encryptedSecret = secureStore.get('alpacaApiSecret')
    if (!encryptedKey || !encryptedSecret) return null

    const apiKey = decrypt(encryptedKey)
    const apiSecret = decrypt(encryptedSecret)
    if (!apiKey || !apiSecret) return null

    return { apiKey, apiSecret }
  }

  static clearAlpacaCredentials(): void {
    secureStore.delete('alpacaApiKey')
    secureStore.delete('alpacaApiSecret')
  }

  static clearAll(): void {
    secureStore.clear()
    secureStore.set('_encryptionVersion', ENCRYPTION_VERSION)
  }
}
