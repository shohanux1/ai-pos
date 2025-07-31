import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login']
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Check if user has auth storage (Zustand persists to localStorage)
  // The actual auth check happens client-side
  // For server-side rendering, we just check if the storage exists
  
  // Skip middleware for public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, we'll let the client-side handle the redirect
  // This is because localStorage is not available in middleware
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}