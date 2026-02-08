export interface ClerkUser {
  id: string
  emailAddresses: Array<{ emailAddress: string; id: string }>
  firstName: string | null
  lastName: string | null
  imageUrl: string
  createdAt: number
}

export interface AuthSession {
  user: ClerkUser
  sessionId: string
}

export interface AuthResult {
  success: boolean
  user?: ClerkUser
  error?: string
}
