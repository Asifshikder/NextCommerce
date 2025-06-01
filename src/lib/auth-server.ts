import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"
import { LoginRequest, LoginResponse, RefreshTokenRequest, UserInfo } from "@/types/auth/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export class AuthService {
  private static readonly TOKEN_KEY = "auth-token"
  private static readonly REFRESH_TOKEN_KEY = "refresh-token"
  private static readonly USER_KEY = "user-info"

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data: LoginResponse = await response.json()
    return data
  }

  static async refreshToken(): Promise<LoginResponse | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(this.TOKEN_KEY)?.value
    const refreshToken = cookieStore.get(this.REFRESH_TOKEN_KEY)?.value

    if (!token || !refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          refreshToken,
        } as RefreshTokenRequest),
      })

      if (!response.ok) {
        return null
      }

      const data: LoginResponse = await response.json()
      return data
    } catch (error) {
      return null
    }
  }

  static async getValidToken(): Promise<string | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(this.TOKEN_KEY)?.value

    if (!token) {
      return null
    }

    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000

      // Check if token expires in the next 5 minutes
      if (decoded.exp && decoded.exp - currentTime < 300) {
        const refreshResult = await this.refreshToken()
        return refreshResult?.token || null
      }

      return token
    } catch (error) {
      // Token is invalid, try to refresh
      const refreshResult = await this.refreshToken()
      return refreshResult?.token || null
    }
  }

  static async getCurrentUser(): Promise<UserInfo | null> {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get(this.USER_KEY)?.value

    if (!userCookie) {
      return null
    }

    try {
      return JSON.parse(userCookie)
    } catch {
      return null
    }
  }

  static createCookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge,
      path: "/",
    }
  }
}

export async function getServerSideAuth() {
  const user = await AuthService.getCurrentUser()
  const token = await AuthService.getValidToken()

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
  }
}
