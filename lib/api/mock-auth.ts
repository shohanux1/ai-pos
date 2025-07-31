// Mock authentication API for browser testing
import { LoginRequest, LoginResponse, User, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from './auth'

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: 'Administrator',
    role: 'ADMIN',
    is_active: true,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockSessions = new Map<string, User>()

export const mockAuthApi = {
  async login(request: LoginRequest): Promise<LoginResponse | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (request.username === 'admin' && request.password === 'admin123') {
      const user = mockUsers[0]
      const token = Math.random().toString(36).substring(7)
      mockSessions.set(token, user)
      
      return { user, token }
    }
    
    return null
  },

  async validateSession(token: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockSessions.get(token) || null
  },

  async logout(token: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
    mockSessions.delete(token)
  },
}

export const mockUserApi = {
  async getAllUsers(): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return [...mockUsers]
  },

  async createUser(request: CreateUserRequest): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      username: request.username,
      name: request.name,
      role: request.role,
      is_active: true,
      last_login: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    return newUser
  },

  async updateUser(request: UpdateUserRequest): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const userIndex = mockUsers.findIndex(u => u.id === request.id)
    if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        name: request.name,
        role: request.role,
        is_active: request.is_active,
        updated_at: new Date().toISOString(),
      }
    }
  },

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
    // In a real app, this would update the password hash
    console.log('Password reset for user:', request.id)
  },
}