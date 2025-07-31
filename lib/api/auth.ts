import { User } from '@/lib/types/user'

export type { User }

// Check if Tauri is available
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

// Type for Tauri invoke function
type InvokeFunction = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>

// Dynamic import for Tauri API
let invoke: InvokeFunction | undefined
let invokePromise: Promise<void> | undefined

if (isTauri) {
  invokePromise = import('@tauri-apps/api/core').then(module => {
    invoke = module.invoke as InvokeFunction
  })
}

// Helper to ensure invoke is loaded
async function ensureInvoke(): Promise<InvokeFunction | undefined> {
  if (invokePromise) {
    await invokePromise
  }
  return invoke
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

// Get the base URL for API calls
const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }
  // Client side
  return ''
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  }
  return { 'Content-Type': 'application/json' }
}

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponse | null> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        return await invokeFunc<LoginResponse | null>('login', { request })
      }
    }
    
    // Otherwise use REST API
    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      // Store token in localStorage
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('token', data.token)
      }
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  },

  async validateSession(token: string): Promise<User | null> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        try {
          const result = await invokeFunc<User | null>('validate_session', { token })
          return result
        } catch (error) {
          console.error('Tauri validate error:', error)
          return null
        }
      }
    }
    
    // Otherwise use REST API (verify endpoint)
    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      // Transform snake_case to camelCase if needed
      if (data.user) {
        return {
          ...data.user,
          is_active: data.user.is_active ?? data.user.isActive,
          last_login: data.user.last_login ?? data.user.lastLogin,
          created_at: data.user.created_at ?? data.user.createdAt,
          updated_at: data.user.updated_at ?? data.user.updatedAt,
        }
      }
      return data.user
    } catch (error) {
      console.error('Validate session error:', error)
      return null
    }
  },

  async logout(token: string): Promise<void> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        return await invokeFunc<void>('logout', { token })
      }
    }
    
    // Otherwise use REST API
    try {
      await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
    }
  },

  // For backward compatibility with existing code
  async verifyToken(token: string): Promise<User | null> {
    return this.validateSession(token)
  }
}

export interface CreateUserRequest {
  username: string
  password: string
  name: string
  role: 'ADMIN' | 'CASHIER'
}

export interface UpdateUserRequest {
  id: string
  name: string
  role: 'ADMIN' | 'CASHIER'
  is_active: boolean
}

export interface ResetPasswordRequest {
  id: string
  new_password: string
}

const userApiMethods = {
  async getAllUsers(): Promise<User[]> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        return await invokeFunc<User[]>('get_all_users')
      }
    }
    
    // Otherwise use REST API
    try {
      const response = await fetch(`${getBaseUrl()}/api/users`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      return await response.json()
    } catch (error) {
      console.error('Get users error:', error)
      return []
    }
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        return await invokeFunc<User>('create_user', { request })
      }
    }
    
    // Otherwise use REST API
    const response = await fetch(`${getBaseUrl()}/api/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }

    return await response.json()
  },

  async updateUser(request: UpdateUserRequest): Promise<void> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        return await invokeFunc<void>('update_user', { request })
      }
    }
    
    // Otherwise use REST API
    const { id, ...updateData } = request
    const response = await fetch(`${getBaseUrl()}/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      throw new Error('Failed to update user')
    }
  },

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    // Use Tauri if available
    if (isTauri) {
      const invokeFunc = await ensureInvoke()
      if (invokeFunc) {
        return await invokeFunc<void>('reset_password', { request })
      }
    }
    
    // Otherwise use REST API
    const response = await fetch(`${getBaseUrl()}/api/users/${request.id}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_password: request.new_password }),
    })

    if (!response.ok) {
      throw new Error('Failed to reset password')
    }
  },
}

// Export the userApi for backward compatibility
export const userApi = { ...authApi, ...userApiMethods }

// Export authFetch for authenticated API calls
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {})
    }
  })
}