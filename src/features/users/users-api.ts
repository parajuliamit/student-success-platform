import { API_BASE_URL } from '#/features/auth/auth-api'
export type { AuthUser } from '#/features/auth/auth-api'

export interface UserCreatePayload {
  username: string
  full_name: string
  email: string
  password: string
  role: 'admin' | 'staff'
}

export interface UserUpdatePayload {
  full_name?: string
  email?: string
  role?: 'admin' | 'staff'
  is_active?: boolean
}

export interface PasswordResetPayload {
  password: string
}

export interface UsersListResponse {
  users: AuthUser[]
}

export interface UserResponse {
  message: string
  user: AuthUser
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

export async function listUsers(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to load users.'))
  }

  return responseBody as UsersListResponse
}

export async function getUser(accessToken: string, userId: number) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to load user.'))
  }

  return responseBody as { user: AuthUser }
}

export async function createUser(
  accessToken: string,
  payload: UserCreatePayload,
) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to create user.'))
  }

  return responseBody as UserResponse
}

export async function updateUser(
  accessToken: string,
  userId: number,
  payload: UserUpdatePayload,
) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to update user.'))
  }

  return responseBody as UserResponse
}

export async function resetUserPassword(
  accessToken: string,
  userId: number,
  payload: PasswordResetPayload,
) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(responseBody, 'Unable to reset password.'))
  }

  return responseBody as { message: string }
}
