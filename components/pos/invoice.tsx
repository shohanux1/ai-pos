'use client'

import { useRef } from 'react'
import { format } from 'date-fns'
import { Printer, Download, X } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

interface InvoiceItem {
  productId: string
  productName: string
  quantity: number
  price: number
  discount: number
  total: number
}

interface InvoiceData {
  id: string
  createdAt: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  paymentReceived: number
  paymentChange: number
  cashierName: string
  storeName?: string
  storeAddress?: string
  storePhone?: string
  taxId?: string
}

interface InvoiceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceData: InvoiceData | null
}

export function Invoice({ open, onOpenChange, invoiceData }: InvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  if (!invoiceData) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implement PDF download
    alert('PDF download feature coming soon!')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto z-50">
          <div className="p-6">
            {/* Header with actions */}
            <div className="flex justify-between items-start mb-6 no-print">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                Invoice Preview
              </Dialog.Title>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="btn btn-secondary btn-sm"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrint}
                  className="btn btn-primary btn-sm"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
                <Dialog.Close asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Invoice Content */}
            <div ref={invoiceRef} className="invoice-content bg-white">
              {/* Store Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {invoiceData.storeName || 'POS Store'}
                </h1>
                {invoiceData.storeAddress && (
                  <p className="text-sm text-gray-600">{invoiceData.storeAddress}</p>
                )}
                {invoiceData.storePhone && (
                  <p className="text-sm text-gray-600">Tel: {invoiceData.storePhone}</p>
                )}
                {invoiceData.taxId && (
                  <p className="text-sm text-gray-600">Tax ID: {invoiceData.taxId}</p>
                )}
              </div>

              {/* Invoice Details */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Sales Invoice</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Invoice No:</p>
                    <p className="font-medium">{invoiceData.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date:</p>
                    <p className="font-medium">
                      {format(new Date(invoiceData.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {invoiceData.customerName && (
                    <div>
                      <p className="text-gray-600">Customer:</p>
                      <p className="font-medium">{invoiceData.customerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Cashier:</p>
                    <p className="font-medium">{invoiceData.cashierName}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Item</th>
                      <th className="text-right py-2 font-medium text-gray-700">Qty</th>
                      <th className="text-right py-2 font-medium text-gray-700">Price</th>
                      <th className="text-right py-2 font-medium text-gray-700">Discount</th>
                      <th className="text-right py-2 font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2">{item.productName}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="py-2 text-right">
                          {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoiceData.subtotal)}</span>
                </div>
                {invoiceData.discount > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(invoiceData.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold mb-4 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>{formatCurrency(invoiceData.total)}</span>
                </div>

                {/* Payment Details */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{invoiceData.paymentMethod}</span>
                  </div>
                  {invoiceData.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Received:</span>
                        <span className="font-medium">{formatCurrency(invoiceData.paymentReceived)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Change:</span>
                        <span className="font-medium">{formatCurrency(invoiceData.paymentChange)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-2">Thank you for your purchase!</p>
                <p className="text-xs text-gray-500">
                  Please keep this receipt for your records
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}