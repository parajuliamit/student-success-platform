export interface AuthUser {
  id: number
  username: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthSession {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface AuthProfileResponse {
  user: AuthUser
}

export interface AuthCredentials {
  username: string
  password: string
}

const AUTH_STORAGE_KEY = 'student-success-platform.auth'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '/api'

export function readStoredAuth(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function storeAuth(session: AuthSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

function getErrorMessage(responseBody: unknown, fallback: string) {
  if (
    responseBody &&
    typeof responseBody === 'object' &&
    'detail' in responseBody &&
    typeof responseBody.detail === 'string'
  ) {
    return responseBody.detail
  }

  if (
    responseBody &&
    typeof responseBody === 'object' &&
    'message' in responseBody &&
    typeof responseBody.message === 'string'
  ) {
    return responseBody.message
  }

  return fallback
}

async function parseJsonResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function loginRequest(credentials: AuthCredentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to sign in.'))
  }

  return responseBody as AuthSession
}

export async function fetchCurrentUser(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to load profile.'))
  }

  return responseBody as AuthProfileResponse
}

export async function logoutRequest(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to sign out.'))
  }

  return responseBody as { message: string }
}