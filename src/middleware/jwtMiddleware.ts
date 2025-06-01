import { type NextRequest, NextResponse } from "next/server"
import { jwtDecode } from "jwt-decode"

const protectedRoutes = ["/dashboard", "/profile", "/admin"]
const authRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Check if the route is auth-related
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000

      // Check if token is expired
      if (decoded.exp && decoded.exp < currentTime) {
        // Token expired, redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url))
        response.cookies.delete("auth-token")
        response.cookies.delete("refresh-token")
        response.cookies.delete("user-info")
        return response
      }
    } catch (error) {
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("auth-token")
      response.cookies.delete("refresh-token")
      response.cookies.delete("user-info")
      return response
    }
  }

  if (isAuthRoute && token) {
    try {
      const decoded = jwtDecode(token)
      const currentTime = Date.now() / 1000

      // If token is valid, redirect to dashboard
      if (decoded.exp && decoded.exp > currentTime) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      // Invalid token, allow access to auth routes
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
