import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api/auth'
import { User, UserRole } from '@/lib/types/user'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false, // Start with loading false
      
      setAuth: (user, token) => {
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
        set({ user, token, isAuthenticated: true, isLoading: false })
      },
      
      logout: () => {
        // Clear localStorage token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      },
      
      checkAuth: async () => {
        // Set loading true at the start
        set({ isLoading: true })
        
        // Don't check if already authenticated
        if (get().isAuthenticated && get().user) {
          set({ isLoading: false })
          return
        }

        const storedToken = get().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
        
        if (!storedToken) {
          set({ isLoading: false, isAuthenticated: false, user: null, token: null })
          return
        }
        
        try {
          const user = await authApi.verifyToken(storedToken)
          
          if (user) {
            set({ 
              user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role as UserRole,
                is_active: user.is_active
              }, 
              token: storedToken, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            // Token is invalid
            set({ user: null, token: null, isAuthenticated: false, isLoading: false })
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token')
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token')
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, always set loading to false
        if (state) {
          state.isLoading = false
        }
      }
    }
  )
)