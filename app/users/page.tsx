'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { userApi, User } from '@/lib/api/auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import * as Dialog from '@radix-ui/react-dialog'
import * as Avatar from '@radix-ui/react-avatar'
import * as Label from '@radix-ui/react-label'
import * as Select from '@radix-ui/react-select'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { 
  ChevronLeft, 
  UserPlus, 
  Shield, 
  KeyRound, 
  Loader2,
  Clock,
  UserCheck,
  UserX,
  X,
  ChevronDown,
  Check
} from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'CASHIER' as 'ADMIN' | 'CASHIER',
  })

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    loadUsers()
  }, [currentUser, router])

  const loadUsers = async () => {
    try {
      const data = await userApi.getAllUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await userApi.createUser(formData)
      setShowCreateDialog(false)
      setFormData({ username: '', password: '', name: '', role: 'CASHIER' })
      loadUsers()
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const handleUpdateUser = async (user: User) => {
    try {
      await userApi.updateUser({
        id: user.id,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      })
      loadUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return

    try {
      await userApi.resetPassword({ id: selectedUserId, new_password: newPassword })
      setShowResetDialog(false)
      setSelectedUserId(null)
      setNewPassword('')
    } catch (error) {
      console.error('Failed to reset password:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-gray-900 mx-auto" />
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mr-4 p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Users</h1>
              </div>
              
              <Dialog.Root open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <Dialog.Trigger asChild>
                  <button className="btn btn-primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </button>
                </Dialog.Trigger>
                
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/20 animate-fade-in" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Create New User
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="p-1 rounded-md hover:bg-gray-100 transition-colors">
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </Dialog.Close>
                    </div>
                    
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label.Root htmlFor="username" className="text-sm font-medium text-gray-700">
                          Username
                        </Label.Root>
                        <input
                          id="username"
                          type="text"
                          className="input-field"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label.Root htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </Label.Root>
                        <input
                          id="password"
                          type="password"
                          className="input-field"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label.Root htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name
                        </Label.Root>
                        <input
                          id="name"
                          type="text"
                          className="input-field"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label.Root htmlFor="role" className="text-sm font-medium text-gray-700">
                          Role
                        </Label.Root>
                        <Select.Root value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'ADMIN' | 'CASHIER' })}>
                          <Select.Trigger className="input-field flex items-center justify-between">
                            <Select.Value />
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="bg-white rounded-md shadow-sm border border-gray-200 p-1">
                              <Select.Viewport>
                                <Select.Item value="CASHIER" className="px-3 py-2 text-sm rounded hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                                  <Select.ItemText>Cashier</Select.ItemText>
                                  <Select.ItemIndicator>
                                    <Check className="w-4 h-4 text-gray-700" />
                                  </Select.ItemIndicator>
                                </Select.Item>
                                <Select.Item value="ADMIN" className="px-3 py-2 text-sm rounded hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                                  <Select.ItemText>Admin</Select.ItemText>
                                  <Select.ItemIndicator>
                                    <Check className="w-4 h-4 text-gray-700" />
                                  </Select.ItemIndicator>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </Dialog.Close>
                        <button
                          type="submit"
                          className="btn btn-primary"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Users Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">User</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Role</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Last Login</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Avatar.Root className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                            <Avatar.Fallback className="text-white text-sm font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${
                          user.role === 'ADMIN' 
                            ? 'bg-gray-900 text-white' 
                            : 'badge-default'
                        }`}>
                          {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-medium ${
                          user.is_active 
                            ? 'text-green-700' 
                            : 'text-gray-500'
                        }`}>
                          {user.is_active ? (
                            <><UserCheck className="w-3 h-3 mr-1" />Active</>
                          ) : (
                            <><UserX className="w-3 h-3 mr-1" />Inactive</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.last_login ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          {user.id !== currentUser?.id && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedUserId(user.id)
                                  setShowResetDialog(true)
                                }}
                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleUpdateUser({ ...user, is_active: !user.is_active })}
                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                title={user.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {user.is_active ? (
                                  <UserX className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Reset Password Dialog */}
        <AlertDialog.Root open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/20 animate-fade-in" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md animate-slide-up">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-2">
                Reset Password
              </AlertDialog.Title>
              <AlertDialog.Description className="text-gray-600 mb-4">
                Enter a new password for the selected user.
              </AlertDialog.Description>
              
              <div className="space-y-2 mb-6">
                <Label.Root htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </Label.Root>
                <input
                  id="newPassword"
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <AlertDialog.Cancel asChild>
                  <button className="btn btn-secondary">
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={handleResetPassword}
                    className="btn btn-primary"
                  >
                    Reset Password
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </ProtectedRoute>
  )
}