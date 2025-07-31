'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}