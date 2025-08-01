'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useCartStore } from '@/lib/stores/cart-store'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PaymentModal, PaymentData } from '@/components/pos/payment-modal'
import { Invoice } from '@/components/pos/invoice'
import { Product } from '@/lib/api/products'
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  User,
  ChevronLeft,
  Loader2,
  Package,
  Zap,
  Hash,
  BarChart3
} from 'lucide-react'

export default function POSPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const cart = useCartStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showInvoice, setShowInvoice] = useState(false)
  const [lastInvoiceData, setLastInvoiceData] = useState<any>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchQuery, products, selectedCategory])

  // Barcode scanner support
  useEffect(() => {
    let barcode = ''
    let lastKeyTime = Date.now()

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now()
      
      // Reset barcode if too much time passed between keystrokes
      if (currentTime - lastKeyTime > 100) {
        barcode = ''
      }
      
      lastKeyTime = currentTime

      // Check if it's Enter key and we have a barcode
      if (e.key === 'Enter' && barcode.length > 0) {
        // Find product by barcode
        const product = products.find(p => p.barcode === barcode)
        if (product) {
          handleAddToCart(product)
        } else {
          // If not found, set it as search query
          setSearchQuery(barcode)
        }
        barcode = ''
        e.preventDefault()
      } else if (e.key.length === 1) {
        // Add to barcode string
        barcode += e.key
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [products])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
        setFilteredProducts(data)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query)
      )
    }

    setFilteredProducts(filtered)
  }

  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert('Product is out of stock')
      return
    }
    cart.addItem(product)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const handlePayment = async (paymentData: PaymentData) => {
    setIsProcessing(true)
    let saleData: any
    try {
      // Prepare sale data
      saleData = {
        customerId: cart.customerId,
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          total: item.price * item.quantity
        })),
        subtotal: cart.getSubtotal(),
        discount: cart.getTotalDiscount(),
        total: cart.getTotal(),
        profit: cart.getTotalProfit(),
        paymentMethod: paymentData.method,
        paymentAmount: paymentData.amount,
        paymentReceived: paymentData.received,
        paymentChange: paymentData.change,
        paymentReference: paymentData.reference
      }

      console.log('Sending sale data:', saleData)

      // Save sale to database
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(saleData)
      })

      if (!response.ok) {
        let errorMessage = 'Failed to save sale'
        try {
          const errorData = await response.json()
          console.error('Sale API error:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          console.error('Failed to parse error response:', e)
          console.error('Response status:', response.status)
          console.error('Response statusText:', response.statusText)
        }
        throw new Error(errorMessage)
      }

      const saleResponse = await response.json()

      // Prepare invoice data
      const invoiceData = {
        id: saleResponse.id,
        createdAt: saleResponse.createdAt,
        customerName: saleResponse.Customer?.name || cart.customerName || 'Walk-in Customer',
        customerEmail: saleResponse.Customer?.email,
        customerPhone: saleResponse.Customer?.phone,
        items: saleData.items.map((item: any, index: number) => ({
          productId: item.productId,
          productName: cart.items[index].product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          total: item.total
        })),
        subtotal: saleData.subtotal,
        discount: saleData.discount,
        total: saleData.total,
        paymentMethod: saleData.paymentMethod,
        paymentReceived: saleData.paymentReceived || saleData.total,
        paymentChange: saleData.paymentChange || 0,
        cashierName: user?.name || 'Cashier',
        storeName: 'POS Store', // You can make this configurable
        storeAddress: '123 Main Street, City, State 12345',
        storePhone: '(555) 123-4567',
        taxId: 'TAX-123456789'
      }

      setLastInvoiceData(invoiceData)
      
      // Clear cart and close modal
      cart.clearCart()
      setShowPaymentModal(false)
      
      // Show invoice
      setShowInvoice(true)
      
      // Reload products to update stock
      loadProducts()
    } catch (error: any) {
      console.error('Payment error:', error)
      console.error('Payment error details:', {
        message: error.message,
        response: error.response,
        saleData: saleData
      })
      alert(`Failed to process payment: ${error.message || 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter((c): c is string => !!c)))]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left Side - Product Search */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="px-6">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn btn-ghost btn-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Point of Sale</h1>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500">Cashier</p>
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Search and Filters */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, barcode, or SKU..."
                  className="input-field pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Products' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-900 mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg font-medium">No products found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className={`group card card-hover overflow-hidden ${
                      product.stockQuantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={product.stockQuantity <= 0}
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      {product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0 && (
                        <span className="absolute top-2 right-2 badge badge-warning text-xs">
                          Low Stock
                        </span>
                      )}
                      {product.stockQuantity <= 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 text-left">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-gray-900">
                          {formatCurrency(product.salePrice)}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Package className="w-3 h-3 mr-1" />
                          {product.stockQuantity}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col">
          {/* Cart Header */}
          <div className="bg-gray-900 p-6">
            <div className="flex items-center justify-between text-white">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Shopping Cart
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'item' : 'items'}
                </p>
              </div>
              {cart.items.length > 0 && (
                <button
                  onClick={() => cart.clearCart()}
                  className="p-2 hover:bg-gray-800 rounded-md transition-colors"
                  title="Clear cart"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div className="p-4 border-b border-gray-200">
            <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-gray-700" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {cart.customerName || 'Walk-in Customer'}
                  </p>
                  <p className="text-xs text-gray-500">Click to select customer</p>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-600 text-base font-medium">Your cart is empty</p>
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Add products to start a new transaction
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => cart.removeItem(item.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-gray-50 rounded-md p-0.5">
                        <button
                          onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => cart.updateQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-10 text-center bg-transparent text-sm font-medium focus:outline-none"
                          min="1"
                        />
                        <button
                          onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-white rounded transition-colors"
                          disabled={item.quantity >= item.product.stockQuantity}
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cart.items.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(cart.getSubtotal())}</span>
                </div>
                {cart.getTotalDiscount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(cart.getTotalDiscount())}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(cart.getTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cart.items.length === 0 || isProcessing}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Process Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        total={cart.getTotal()}
        onComplete={handlePayment}
      />

      {/* Invoice Modal */}
      <Invoice
        open={showInvoice}
        onOpenChange={setShowInvoice}
        invoiceData={lastInvoiceData}
      />
    </ProtectedRoute>
  )
}