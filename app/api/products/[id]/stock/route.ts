import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const stockAdjustmentSchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = stockAdjustmentSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let newStock = product.stockQuantity;
    
    if (validatedData.type === 'STOCK_IN') {
      newStock += validatedData.quantity;
    } else if (validatedData.type === 'STOCK_OUT') {
      if (product.stockQuantity < validatedData.quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        );
      }
      newStock -= validatedData.quantity;
    } else if (validatedData.type === 'ADJUSTMENT') {
      newStock = validatedData.quantity;
    }

    const [updatedProduct, stockLog] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { stockQuantity: newStock },
      }),
      prisma.stockLog.create({
        data: {
          productId: product.id,
          type: validatedData.type,
          quantity: validatedData.quantity,
          previousStock: product.stockQuantity,
          newStock,
          reason: validatedData.reason,
          createdBy: authResult.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      product: updatedProduct,
      stockLog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}