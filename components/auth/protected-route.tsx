'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore()
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    // Only check auth if not already authenticated
    if (!isAuthenticated && !user) {
      checkAuth().finally(() => setHasChecked(true))
    } else {
      setHasChecked(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  useEffect(() => {
    // Redirect to login if not authenticated and auth check is complete
    if (hasChecked && !isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, hasChecked])

  // Show loading spinner only during initial auth check
  if (!hasChecked || (isLoading && !user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-gray-900 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated (briefly before redirect)
  if (!isAuthenticated && hasChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If authenticated, render children
  return <>{children}</>
}