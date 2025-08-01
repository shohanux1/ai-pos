'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone,
  Check,
  Zap,
  Wallet,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onComplete: (paymentData: PaymentData) => void
}

export interface PaymentData {
  method: 'CASH' | 'CARD' | 'MOBILE'
  amount: number
  received?: number
  change?: number
  reference?: string
}

export function PaymentModal({ open, onOpenChange, total, onComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE'>('CASH')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [reference, setReference] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (open) {
      setPaymentMethod('CASH')
      setReceivedAmount('')
      setReference('')
      setIsProcessing(false)
    }
  }, [open])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const handleQuickCash = (amount: number) => {
    setReceivedAmount(amount.toString())
  }

  const calculateChange = () => {
    const received = parseFloat(receivedAmount) || 0
    return Math.max(0, received - total)
  }

  const handleComplete = async () => {
    setIsProcessing(true)
    
    const paymentData: PaymentData = {
      method: paymentMethod,
      amount: total
    }

    if (paymentMethod === 'CASH') {
      paymentData.received = parseFloat(receivedAmount) || total
      paymentData.change = calculateChange()
    } else {
      paymentData.reference = reference
    }

    // Simulate processing delay
    setTimeout(() => {
      onComplete(paymentData)
      setIsProcessing(false)
    }, 500)
  }

  const isValid = () => {
    if (paymentMethod === 'CASH') {
      const received = parseFloat(receivedAmount) || 0
      return received >= total
    }
    return paymentMethod === 'CARD' || paymentMethod === 'MOBILE'
  }

  // Calculate suggested amounts based on total
  const suggestedAmounts = () => {
    const roundedTotal = Math.ceil(total)
    const amounts = []
    
    // Add exact amount
    amounts.push(total)
    
    // Add rounded up amounts
    if (roundedTotal > total) amounts.push(roundedTotal)
    if (roundedTotal + 10 > total) amounts.push(roundedTotal + 10)
    if (roundedTotal + 20 > total) amounts.push(roundedTotal + 20)
    if (roundedTotal + 50 > total) amounts.push(roundedTotal + 50)
    
    // Add standard bills if they make sense
    const standardBills = [10, 20, 50, 100]
    standardBills.forEach(bill => {
      if (bill > total && !amounts.includes(bill)) {
        amounts.push(bill)
      }
    })
    
    return amounts.slice(0, 4).sort((a, b) => a - b)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 animate-fade-in backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  Payment
                </Dialog.Title>
                <p className="text-sm text-gray-500 mt-1">Complete the transaction</p>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm mb-1">Total Amount</p>
                  <p className="text-4xl font-bold">{formatCurrency(total)}</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Wallet className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'CASH' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'CASH' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                  <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                    paymentMethod === 'CASH' ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    paymentMethod === 'CASH' ? 'text-indigo-600' : 'text-gray-700'
                  }`}>Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'CARD' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'CARD' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                  <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                    paymentMethod === 'CARD' ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    paymentMethod === 'CARD' ? 'text-indigo-600' : 'text-gray-700'
                  }`}>Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('MOBILE')}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'MOBILE' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {paymentMethod === 'MOBILE' && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                  <Smartphone className={`w-6 h-6 mx-auto mb-2 ${
                    paymentMethod === 'MOBILE' ? 'text-indigo-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    paymentMethod === 'MOBILE' ? 'text-indigo-600' : 'text-gray-700'
                  }`}>Mobile</span>
                </button>
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Received Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-lg font-medium bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      step="0.01"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {suggestedAmounts().map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickCash(amount)}
                      className="py-3 px-4 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                {/* Change */}
                {receivedAmount && parseFloat(receivedAmount) >= total && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Change Due</p>
                        <p className="text-2xl font-bold text-green-800 mt-1">
                          {formatCurrency(calculateChange())}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(paymentMethod === 'CARD' || paymentMethod === 'MOBILE') && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter transaction reference"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <Dialog.Close asChild>
                <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleComplete}
                disabled={!isValid() || isProcessing}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Complete Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}