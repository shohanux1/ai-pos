import { create } from 'zustand'
import { Product } from '@/lib/api/products'

export interface CartItem {
  id: string
  product: Product
  quantity: number
  discount: number // percentage discount
  price: number // final price per unit after discount
}

export interface CartStore {
  items: CartItem[]
  customerId: string | null
  customerName: string | null
  
  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateDiscount: (itemId: string, discount: number) => void
  clearCart: () => void
  setCustomer: (customerId: string | null, customerName: string | null) => void
  
  // Computed values
  getSubtotal: () => number
  getTotalDiscount: () => number
  getTotal: () => number
  getTotalItems: () => number
  getTotalProfit: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find(item => item.product.id === product.id)
      
      if (existingItem) {
        // Update quantity if item already exists
        return {
          items: state.items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
      }
      
      // Add new item
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product,
        quantity,
        discount: 0,
        price: product.salePrice
      }
      
      return { items: [...state.items, newItem] }
    })
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter(item => item.id !== itemId)
    }))
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId)
      return
    }
    
    set((state) => ({
      items: state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }))
  },

  updateDiscount: (itemId, discount) => {
    set((state) => ({
      items: state.items.map(item => {
        if (item.id === itemId) {
          const discountAmount = (item.product.salePrice * discount) / 100
          const finalPrice = item.product.salePrice - discountAmount
          return { ...item, discount, price: finalPrice }
        }
        return item
      })
    }))
  },

  clearCart: () => {
    set({ items: [], customerId: null, customerName: null })
  },

  setCustomer: (customerId, customerName) => {
    set({ customerId, customerName })
  },

  getSubtotal: () => {
    const state = get()
    return state.items.reduce((total, item) => {
      return total + (item.product.salePrice * item.quantity)
    }, 0)
  },

  getTotalDiscount: () => {
    const state = get()
    return state.items.reduce((total, item) => {
      const discountAmount = (item.product.salePrice - item.price) * item.quantity
      return total + discountAmount
    }, 0)
  },

  getTotal: () => {
    const state = get()
    return state.items.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0)
  },

  getTotalItems: () => {
    const state = get()
    return state.items.reduce((total, item) => total + item.quantity, 0)
  },

  getTotalProfit: () => {
    const state = get()
    return state.items.reduce((total, item) => {
      const profit = (item.price - item.product.costPrice) * item.quantity
      return total + profit
    }, 0)
  }
}))