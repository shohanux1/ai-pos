'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import * as Label from '@radix-ui/react-label'
import { Store, Loader2, AlertCircle } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Move useForm hook before any conditional returns
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Redirect if already authenticated
    if (mounted && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router, mounted])

  // Show loading while checking initial auth
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-gray-900 mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-gray-900 mx-auto" />
          <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authApi.login(data)
      
      if (response) {
        // Set auth and immediately redirect
        setAuth(
          {
            id: response.user.id,
            username: response.user.username,
            name: response.user.name,
            role: response.user.role as 'ADMIN' | 'CASHIER',
            is_active: response.user.is_active,
          },
          response.token
        )
        
        // Navigate immediately after setting auth
        router.push('/dashboard')
      } else {
        setError('Invalid username or password. Please check your credentials.')
      }
    } catch (err) {
      console.error('Login error:', err)
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else {
        setError('Unable to connect to server. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg mb-4">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to POS</h1>
            <p className="text-gray-600">Welcome back! Please enter your details.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label.Root htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label.Root>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className={`input-field ${
                    errors.username 
                      ? 'border-[#e00] focus:border-[#e00] focus:ring-[#e00]' 
                      : ''
                  }`}
                  {...register('username')}
                  disabled={isLoading}
                />
                {errors.username && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 text-[#e00]" />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="text-sm text-[#e00]">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label.Root htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label.Root>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className={`input-field ${
                    errors.password 
                      ? 'border-[#e00] focus:border-[#e00] focus:ring-[#e00]' 
                      : ''
                  }`}
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 text-[#e00]" />
                  </div>
                )}
              </div>
              {errors.password && (
                <p className="text-sm text-[#e00]">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-[#fce5e6] border border-[#fbb] text-[#e00] rounded-md p-3">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-3">DEMO CREDENTIALS</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Username:</span>
                <code className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">admin</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Password:</span>
                <code className="font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Pattern */}
      <div className="hidden lg:block lg:w-1/2 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Vercel Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Content */}
          <div className="relative h-full flex items-center justify-center px-12">
            <div className="max-w-md">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Modern POS System
              </h2>
              <p className="text-gray-600 mb-8">
                Streamline your business operations with our comprehensive point-of-sale solution. 
                Manage inventory, track sales, and grow your business.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Real-time inventory tracking</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Comprehensive sales analytics</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">Multi-user role management</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}