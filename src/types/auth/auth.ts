export interface LoginRequest {
  email: string
  password: string
  tenantId: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  expires: string
  user: UserInfo
}

export interface UserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  tenantId: string
  roles: string[]
  permissions: number[]
}

export interface RefreshTokenRequest {
  token: string
  refreshToken: string
}

export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  lastLoginDate?: string
  roles: string[]
  createdAt: string
  updatedAt?: string
}

export interface AuthState {
  user: UserInfo | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}