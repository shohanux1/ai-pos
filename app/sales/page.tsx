'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { ProtectedRoute } from '@/components/auth/protected-route'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { authApi } from '@/lib/api/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Eye,
  Receipt,
  TrendingUp,
  Activity,
  Package,
  Filter,
  Search,
  MoreHorizontal,
  Settings,
  LogOut,
  Download,
  Printer
} from 'lucide-react'

interface Sale {
  id: string
  createdAt: string
  Customer: {
    id: string
    name: string
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

export default function SalesPage() {
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
    try {
      const response = await fetch('/api/sales', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      }
    } catch (error) {
      console.error('Failed to load sales:', error)
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  // Calculate stats
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt).toDateString()
    const today = new Date().toDateString()
    return saleDate === today
  })

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.payment?.amount || 0), 0)
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.payment?.amount || 0), 0)
  const averageTransaction = sales.length > 0 ? totalRevenue / sales.length : 0

  // Filter sales
  const filteredSales = sales.filter(sale => {
    // Date filter
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.createdAt)
      const today = new Date()
      
      if (dateFilter === 'today' && saleDate.toDateString() !== today.toDateString()) {
        return false
      }
      
      if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (saleDate < weekAgo) return false
      }
      
      if (dateFilter === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (saleDate < monthAgo) return false
      }
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all' && sale.payment?.paymentMethod !== paymentMethodFilter) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const customerName = sale.Customer?.name.toLowerCase() || ''
      const cashierName = sale.user.name.toLowerCase()
      const saleId = sale.id.toLowerCase()
      
      if (!customerName.includes(query) && !cashierName.includes(query) && !saleId.includes(query)) {
        return false
      }
    }

    return true
  })

  const stats = [
    {
      title: "Today's Sales",
      value: formatCurrency(todayRevenue),
      change: `${todaySales.length} transactions`,
      changeType: 'positive',
      icon: DollarSign,
      details: 'Updated just now',
      detailIcon: Activity,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      change: `${sales.length} total`,
      changeType: 'neutral',
      icon: TrendingUp,
      details: 'All time',
      detailIcon: Calendar,
    },
    {
      title: 'Average Transaction',
      value: formatCurrency(averageTransaction),
      change: 'Per sale',
      changeType: 'neutral',
      icon: ShoppingCart,
      details: 'Based on all sales',
      detailIcon: Activity,
    },
    {
      title: 'Items Sold',
      value: sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0).toString(),
      change: 'Total units',
      changeType: 'positive',
      icon: Package,
      details: 'Across all transactions',
      detailIcon: Package,
    },
  ]

  if (!user) {
    return null
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
                <h1 className="text-xl font-semibold text-gray-900">Sales</h1>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push('/pos')}
                  variant="primary"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  New Sale
                </Button>

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
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Sales Transactions</h2>
            <p className="text-gray-600">View and manage all your sales transactions</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              const DetailIcon = stat.detailIcon
              return (
                <div 
                  key={stat.title} 
                  className="card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-gray-50 rounded-md">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                      stat.changeType === 'positive' ? 'badge-success' :
                      stat.changeType === 'negative' ? 'badge-error' :
                      'badge-default'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <DetailIcon className="w-3 h-3 mr-1" />
                      <span>{stat.details}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div className="card p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search - Takes most space */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by customer, cashier, or sale ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters Group */}
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-3">
                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>

                {/* Payment Method Filter */}
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                  </SelectContent>
                </Select>

                {/* Export Button */}
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Date & Time</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Sale ID</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Customer</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Items</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Total</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Payment</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Cashier</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">
                        Loading sales...
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500">
                        No sales found
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const PaymentIcon = getPaymentIcon(sale.payment?.paymentMethod || 'CASH')
                      const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0)
                      
                      return (
                        <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{formatDate(sale.createdAt)}</p>
                              <p className="text-xs text-gray-500 flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(sale.createdAt)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-gray-900">
                              #{sale.id.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900">
                              {sale.Customer?.name || 'Walk-in Customer'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md badge-default">
                              {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(sale.payment?.amount || 0)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <PaymentIcon className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700">
                                {sale.payment?.paymentMethod || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{sale.user.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => router.push(`/sales/${sale.id}`)}
                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                title="Print Receipt"
                              >
                                <Printer className="w-4 h-4 text-gray-600" />
                              </button>
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <button
                                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                    title="More Options"
                                  >
                                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content 
                                    className="min-w-[160px] bg-white rounded-md shadow-sm border border-gray-200 p-1"
                                    sideOffset={5}
                                  >
                                    <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                                      <Receipt className="w-4 h-4 mr-3 text-gray-400" />
                                      Email Receipt
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                                      <Eye className="w-4 h-4 mr-3 text-gray-400" />
                                      View Details
                                    </DropdownMenu.Item>
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}