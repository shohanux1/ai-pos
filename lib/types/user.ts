export type UserRole = 'ADMIN' | 'CASHIER'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  is_active: boolean
  last_login?: string | null
  created_at?: string
}