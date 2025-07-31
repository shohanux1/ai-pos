import { mockAuthApi, mockUserApi } from './mock-auth'

// Check if Tauri is available
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

// Type for Tauri invoke function
type InvokeFunction = <T>(cmd: string, args?: any) => Promise<T>

// Dynamic import for Tauri API
let invoke: InvokeFunction | undefined
if (isTauri) {
  import('@tauri-apps/api/core').then(module => {
    invoke = module.invoke as InvokeFunction
  })
}

export interface LoginRequest {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'CASHIER'
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  user: User
  token: string
}

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponse | null> {
    if (isTauri && invoke) {
      return await invoke<LoginResponse | null>('login', { request })
    }
    return mockAuthApi.login(request)
  },

  async validateSession(token: string): Promise<User | null> {
    if (isTauri && invoke) {
      return await invoke<User | null>('validate_session', { token })
    }
    return mockAuthApi.validateSession(token)
  },

  async logout(token: string): Promise<void> {
    if (isTauri && invoke) {
      return await invoke<void>('logout', { token })
    }
    return mockAuthApi.logout(token)
  },
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

export const userApi = {
  async getAllUsers(): Promise<User[]> {
    if (isTauri && invoke) {
      return await invoke<User[]>('get_all_users')
    }
    return mockUserApi.getAllUsers()
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    if (isTauri && invoke) {
      return await invoke<User>('create_user', { request })
    }
    return mockUserApi.createUser(request)
  },

  async updateUser(request: UpdateUserRequest): Promise<void> {
    if (isTauri && invoke) {
      return await invoke<void>('update_user', { request })
    }
    return mockUserApi.updateUser(request)
  },

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    if (isTauri && invoke) {
      return await invoke<void>('reset_password', { request })
    }
    return mockUserApi.resetPassword(request)
  },
}