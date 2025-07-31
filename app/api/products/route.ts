import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  costPrice: z.number().positive("Cost price must be positive"),
  salePrice: z.number().positive("Sale price must be positive"),
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  minStockLevel: z.number().int().min(0, "Minimum stock level cannot be negative"),
  unit: z.string().default("piece"),
  category: z.string().optional(),
  image: z.string().optional(),
}).refine((data) => data.salePrice >= data.costPrice, {
  message: "Sale price must be greater than or equal to cost price",
  path: ["salePrice"],
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: {
      isActive: boolean;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        barcode?: { contains: string; mode: 'insensitive' };
        sku?: { contains: string; mode: 'insensitive' };
      }>;
      category?: string;
    } = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter(
        product => product.stockQuantity <= product.minStockLevel
      );
    }

    const productsWithLowStockFlag = filteredProducts.map(product => ({
      ...product,
      isLowStock: product.stockQuantity <= product.minStockLevel,
    }));

    return NextResponse.json(productsWithLowStockFlag);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Generate unique barcode if not provided
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedBarcode = validatedData.barcode || `PRD${timestamp}${uniqueId}`;
    
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        barcode: generatedBarcode,
        qrCode: `QR${timestamp}${uniqueId}`,
      },
    });

    if (validatedData.stockQuantity > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          type: 'STOCK_IN',
          quantity: validatedData.stockQuantity,
          previousStock: 0,
          newStock: validatedData.stockQuantity,
          reason: 'Initial stock',
          createdBy: authResult.user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}