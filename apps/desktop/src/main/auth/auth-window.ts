import { BrowserWindow } from 'electron'

export class AuthWindowService {
  async openSignInWindow(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authWindow = new BrowserWindow({
        width: 450,
        height: 650,
        show: true,
        modal: true,
        title: 'Sign In — FinTerm',
        backgroundColor: '#0d1117',
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      })

      const publishableKey =
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        process.env.VITE_CLERK_PUBLISHABLE_KEY ||
        ''

      console.log('[AuthWindow] Publishable key:', publishableKey ? 'Found' : 'NOT FOUND')

      if (!publishableKey) {
        console.error('[AuthWindow] No publishable key found in environment')
        authWindow.close()
        reject(new Error('Clerk publishable key not configured'))
        return
      }

      const clerkDomain = this.extractClerkDomain(publishableKey)
      console.log('[AuthWindow] Extracted Clerk domain:', clerkDomain)

      const signInUrl = `https://${clerkDomain}/sign-in`
      console.log('[AuthWindow] Loading URL:', signInUrl)
      authWindow.loadURL(signInUrl)

      authWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('[AuthWindow] Failed to load:', {
          errorCode,
          errorDescription,
          url: validatedURL,
        })
      })

      authWindow.webContents.on('did-finish-load', () => {
        console.log('[AuthWindow] Page loaded successfully')
      })

      authWindow.webContents.on('will-redirect', async (_event, url) => {
        console.log('[AuthWindow] Redirect to:', url)

        if (url.includes('/user') || url.includes('clerk_status=complete')) {
          try {
            console.log('[AuthWindow] Sign-in detected, attempting to get session...')

            const result = await authWindow.webContents.executeJavaScript(`
              (async () => {
                if (window.Clerk) {
                  await window.Clerk.load()
                  const session = window.Clerk.session
                  if (session) {
                    const token = await session.getToken()
                    return token
                  }
                }
                return null
              })()
            `)

            if (result) {
              console.log('[AuthWindow] Got session token')
              authWindow.close()
              resolve(result)
            }
          } catch (error) {
            console.error('[AuthWindow] Error getting session:', error)
          }
        }
      })

      authWindow.on('closed', () => {
        reject(new Error('Sign-in window closed before completing authentication'))
      })
    })
  }

  private extractClerkDomain(publishableKey: string): string {
    try {
      const encoded = publishableKey.replace('pk_test_', '').replace('pk_live_', '')
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
      const cleaned = decoded.replace(/[^a-zA-Z0-9.-]/g, '')
      console.log('[AuthWindow] Decoded domain:', decoded, '→ Cleaned:', cleaned)
      return cleaned
    } catch (error) {
      console.error('[AuthWindow] Failed to decode publishable key:', error)
      return 'accounts.dev'
    }
  }
}

let authWindowService: AuthWindowService | null = null

export function getAuthWindowService(): AuthWindowService {
  if (!authWindowService) {
    authWindowService = new AuthWindowService()
  }
  return authWindowService
}
