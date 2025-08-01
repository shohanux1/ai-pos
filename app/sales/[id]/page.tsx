'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/protected-route'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { authApi } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft,
  ChevronDown,
  ShoppingCart,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Smartphone,
  User,
  Package,
  Settings,
  LogOut,
  Download,
  Printer,
  Receipt,
  Mail,
  Share2,
  CheckCircle
} from 'lucide-react'

interface SaleDetails {
  id: string
  createdAt: string
  Customer: {
    id: string
    name: string
    phone?: string
    email?: string
  } | null
  user: {
    id: string
    name: string
    username: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    discount: number
    product: {
      id: string
      name: string
      sku?: string
      barcode?: string
    }
  }>
  payment: {
    id: string
    amount: number
    paymentMethod: string
    receivedAmount: number | null
    changeAmount: number | null
  } | null
}

export default function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const [sale, setSale] = useState<SaleDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saleId, setSaleId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setSaleId(p.id))
  }, [params])

  useEffect(() => {
    if (saleId) {
      loadSaleDetails()
    }
  }, [saleId])

  const loadSaleDetails = async () => {
    if (!saleId) return
    
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSale(data)
      }
    } catch (error) {
      console.error('Failed to load sale details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout(token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      logout()
      router.push('/login')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return DollarSign
      case 'CARD':
        return CreditCard
      case 'MOBILE':
        return Smartphone
      default:
        return DollarSign
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading sale details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!sale) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Sale not found</p>
            <Button
              onClick={() => router.push('/sales')}
              className="mt-4"
              variant="primary"
            >
              Back to Sales
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const PaymentIcon = getPaymentIcon(sale.payment?.paymentMethod || 'CASH')
  const subtotal = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalDiscount = sale.items.reduce((sum, item) => sum + (item.discount * item.quantity), 0)
  const total = sale.payment?.amount || 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/sales')}
                  className="mr-4 p-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Sale Details</h1>
              </div>

              <div className="flex items-center space-x-4">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <Button variant="secondary">
                      Actions
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="min-w-[200px] bg-white rounded-md shadow-sm border border-gray-200 p-1"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                        <Printer className="w-4 h-4 mr-3 text-gray-400" />
                        Print Receipt
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                        <Mail className="w-4 h-4 mr-3 text-gray-400" />
                        Email Receipt
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-3 text-gray-400" />
                        Download PDF
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                        <Share2 className="w-4 h-4 mr-3 text-gray-400" />
                        Share
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-md px-3 py-2 transition-colors">
                      <Avatar.Root className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                        <Avatar.Fallback className="text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar.Root>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role.toLowerCase()}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenu.Trigger>
                  
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content 
                      className="min-w-[220px] bg-white rounded-md shadow-sm border border-gray-200 p-1 animate-slide-up"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                        <User className="w-4 h-4 mr-3 text-gray-400" />
                        Profile
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                        <Settings className="w-4 h-4 mr-3 text-gray-400" />
                        Settings
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item 
                        className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50"
                        onSelect={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                        Sign out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Sale Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sale Header */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Sale #{sale.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(sale.createdAt)}
                      <Clock className="w-4 h-4 ml-4 mr-2" />
                      {formatTime(sale.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center px-3 py-1 badge-success">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Customer</p>
                    <p className="font-medium text-gray-900">
                      {sale.Customer?.name || 'Walk-in Customer'}
                    </p>
                    {sale.Customer?.phone && (
                      <p className="text-sm text-gray-500">{sale.Customer.phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cashier</p>
                    <p className="font-medium text-gray-900">{sale.user.name}</p>
                    <p className="text-sm text-gray-500">@{sale.user.username}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Product</th>
                        <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Quantity</th>
                        <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Price</th>
                        <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Discount</th>
                        <th className="text-right text-sm font-medium text-gray-700 px-6 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                              {item.product.sku && (
                                <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{item.quantity}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{formatCurrency(item.price)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity - item.discount * item.quantity)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Payment & Summary */}
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="card p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Method</span>
                    <div className="flex items-center">
                      <PaymentIcon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {sale.payment?.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {sale.payment?.paymentMethod === 'CASH' && sale.payment.receivedAmount && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Received</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(sale.payment.receivedAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Change</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(sale.payment.changeAmount || 0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="card p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Discount</span>
                      <span className="text-sm text-green-600">-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button variant="secondary" className="w-full">
                    <Receipt className="w-4 h-4 mr-2" />
                    View Receipt
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}