'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import * as Separator from '@radix-ui/react-separator'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  UserCog, 
  TrendingUp, 
  Settings, 
  LogOut,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Activity,
  BarChart3,
  ShoppingBag,
  Truck,
  ChevronDown,
  User,
  ArrowRight,
  ChevronRight
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, logout } = useAuthStore()

  const handleLogout = async () => {
    if (token) {
      await authApi.logout(token)
    }
    logout()
    router.push('/login')
  }

  if (!user) {
    return null
  }

  const menuItems = [
    {
      title: 'New Sale',
      description: 'Create a new sale transaction',
      icon: ShoppingCart,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/sales',
    },
    {
      title: 'Products',
      description: 'Manage inventory and stock',
      icon: Package,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/products',
    },
    {
      title: 'Customers',
      description: 'Customer database',
      icon: Users,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/customers',
    },
    {
      title: 'Purchases',
      description: 'Supplier purchases',
      icon: Truck,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/purchases',
    },
  ]

  const adminItems = [
    {
      title: 'Users',
      description: 'Manage staff accounts',
      icon: UserCog,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/users',
    },
    {
      title: 'Reports',
      description: 'Sales analytics',
      icon: BarChart3,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/reports',
    },
    {
      title: 'Settings',
      description: 'System configuration',
      icon: Settings,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-700',
      route: '/settings',
    },
  ]

  const stats = [
    {
      title: "Today's Sales",
      value: '$1,234',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      details: 'Last update: 5 min ago',
      detailIcon: Activity,
    },
    {
      title: 'Transactions',
      value: '48',
      change: '+8 today',
      changeType: 'positive',
      icon: CreditCard,
      details: '6 pending',
      detailIcon: TrendingUp,
    },
    {
      title: 'Products',
      value: '256',
      change: 'In Stock',
      changeType: 'neutral',
      icon: Package,
      details: '32 categories',
      detailIcon: ShoppingBag,
    },
    {
      title: 'Low Stock',
      value: '12',
      change: 'Action needed',
      changeType: 'negative',
      icon: AlertTriangle,
      details: 'Reorder required',
      detailIcon: AlertTriangle,
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  POS System
                </h1>
              </div>

              <div className="flex items-center space-x-4">
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back, {user.name}</h2>
            <p className="text-gray-600">Here's what's happening with your store today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              const DetailIcon = stat.detailIcon
              return (
                <div 
                  key={stat.title} 
                  className="bg-white rounded-lg border border-gray-200 p-6"
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

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h3>
            <p className="text-gray-600 text-sm">Navigate to key features of your POS system</p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...menuItems, ...(user.role === 'ADMIN' ? adminItems : [])].map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.title}
                  onClick={() => router.push(item.route)}
                  className="group bg-white rounded-lg border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 ${item.iconBg} rounded-md`}>
                      <Icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </button>
              )
            })}
          </div>

          {/* Additional Section */}
          <div className="mt-12 bg-gray-900 rounded-lg p-8 text-white">
            <div className="max-w-3xl">
              <h3 className="text-xl font-semibold mb-2">Need help getting started?</h3>
              <p className="text-gray-300 mb-4">
                Check out our documentation to learn how to make the most of your POS system.
              </p>
              <button className="inline-flex items-center px-4 py-2 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
                View Documentation
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}