import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearStoredAuth,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  readStoredAuth,
  storeAuth,
  type AuthCredentials,
  type AuthSession,
  type AuthUser,
} from './auth-api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  token: string | null
  user: AuthUser | null
  login: (credentials: AuthCredentials) => Promise<AuthSession>
  logout: () => Promise<void>
  refreshProfile: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const storedAuth = readStoredAuth()

    if (!storedAuth?.access_token) {
      setStatus('unauthenticated')
      setToken(null)
      setUser(null)
      return
    }

    setToken(storedAuth.access_token)
    setUser(storedAuth.user)

    void fetchCurrentUser(storedAuth.access_token)
      .then((profile) => {
        const nextSession: AuthSession = {
          access_token: storedAuth.access_token,
          token_type: storedAuth.token_type,
          user: profile.user,
        }

        storeAuth(nextSession)
        setUser(profile.user)
        setStatus('authenticated')
      })
      .catch(() => {
        clearStoredAuth()
        setToken(null)
        setUser(null)
        setStatus('unauthenticated')
      })
  }, [])

  async function login(credentials: AuthCredentials) {
    const session = await loginRequest(credentials)
    storeAuth(session)
    setToken(session.access_token)
    setUser(session.user)
    setStatus('authenticated')
    return session
  }

  async function logout() {
    const accessToken = token ?? readStoredAuth()?.access_token

    if (accessToken) {
      try {
        await logoutRequest(accessToken)
      } catch {
        // Clear local state even if the server session is already gone.
      }
    }

    clearStoredAuth()
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }

  async function refreshProfile() {
    const accessToken = token ?? readStoredAuth()?.access_token

    if (!accessToken) {
      clearStoredAuth()
      setToken(null)
      setUser(null)
      setStatus('unauthenticated')
      return null
    }

    const profile = await fetchCurrentUser(accessToken)
    const storedAuth = readStoredAuth()
    const nextSession: AuthSession = {
      access_token: accessToken,
      token_type: storedAuth?.token_type ?? 'bearer',
      user: profile.user,
    }

    storeAuth(nextSession)
    setToken(accessToken)
    setUser(profile.user)
    setStatus('authenticated')

    return profile.user
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      login,
      logout,
      refreshProfile,
    }),
    [status, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}