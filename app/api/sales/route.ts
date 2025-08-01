import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticate } from '@/lib/api/middleware'

// GET all sales
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) return auth.error

    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        Customer: true,
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        Payment: true
      }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new sale
export async function POST(request: NextRequest) {
  try {
    console.log('Sales POST request received')
    
    const auth = await authenticate(request)
    if (auth.error) {
      console.error('Authentication failed:', auth.error)
      return auth.error
    }

    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    const {
      customerId,
      items,
      subtotal,
      discount,
      total,
      profit,
      paymentMethod,
      paymentAmount,
      paymentReceived,
      paymentChange,
      paymentReference
    } = body

    // Validate required fields
    if (!items || items.length === 0 || !paymentMethod || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create sale transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          createdBy: auth.userId!,
          customerId: customerId || null
        }
      })

      // Create sale items and update product stock
      for (const item of items) {
        // Create sale item
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0
          }
        })

        // Get current product stock
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        const previousStock = product.stockQuantity
        const newStock = previousStock - item.quantity

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: newStock
          }
        })

        // Create stock log
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            previousStock: previousStock,
            newStock: newStock,
            reason: 'Sale',
            reference: `Sale #${newSale.id}`,
            createdBy: auth.userId!
          }
        })
      }

      // Create payment record
      await tx.payment.create({
        data: {
          id: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          saleId: newSale.id,
          amount: total,
          paymentMethod: paymentMethod,
          receivedAmount: paymentReceived || null,
          changeAmount: paymentChange || null
        }
      })

      // If customer exists and profit > 0, update loyalty points (5% of profit)
      if (customerId && profit > 0) {
        const loyaltyPoints = Math.floor(profit * 0.05)
        if (loyaltyPoints > 0) {
          const customer = await tx.customer.findUnique({
            where: { id: customerId }
          })

          if (customer) {
            await tx.customer.update({
              where: { id: customerId },
              data: {
                loyaltyPoints: {
                  increment: loyaltyPoints
                }
              }
            })

            // Create loyalty transaction
            await tx.loyaltyTransaction.create({
              data: {
                id: `LT-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                customerId,
                points: loyaltyPoints,
                type: 'EARNED',
                reference: `Sale #${newSale.id}`,
                balance: customer.loyaltyPoints + loyaltyPoints
              }
            })
          }
        }
      }

      // Return the complete sale with relations
      return await tx.sale.findUnique({
        where: { id: newSale.id },
        include: {
          Customer: true,
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          Payment: true
        }
      })
    })

    console.log('Sale created successfully:', sale?.id)
    return NextResponse.json(sale, { status: 201 })
  } catch (error: any) {
    console.error('Create sale error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })
    
    // Return more specific error message
    const errorMessage = error.message || 'Failed to create sale'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}