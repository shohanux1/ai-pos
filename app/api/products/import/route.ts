import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';
import Papa from 'papaparse';
import { z } from 'zod';

const importProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  costPrice: z.number().positive(),
  salePrice: z.number().positive(),
  stockQuantity: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(10),
  unit: z.string().default('piece'),
  category: z.string().optional(),
});

type ImportProduct = z.infer<typeof importProductSchema>;

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user || authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Only CSV and JSON are supported.' },
        { status: 400 }
      );
    }

    const text = await file.text();
    let products: Record<string, unknown>[] = [];

    try {
      if (format === 'csv') {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });

        if (parsed.errors.length > 0) {
          return NextResponse.json(
            { 
              error: 'CSV parsing errors', 
              details: parsed.errors.map(e => e.message) 
            },
            { status: 400 }
          );
        }

        products = parsed.data;
      } else {
        products = JSON.parse(text);
        if (!Array.isArray(products)) {
          products = [products];
        }
      }
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse file' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string }[],
    };

    for (let i = 0; i < products.length; i++) {
      try {
        const productData = importProductSchema.parse(products[i]);
        
        // Generate unique identifiers
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const product = await prisma.product.create({
          data: {
            ...productData,
            barcode: productData.barcode || `PRD${timestamp}${uniqueId}${i}`,
            qrCode: `QR${timestamp}${uniqueId}${i}`,
          },
        });

        // Create initial stock log if quantity > 0
        if (productData.stockQuantity > 0) {
          await prisma.stockLog.create({
            data: {
              productId: product.id,
              type: 'STOCK_IN',
              quantity: productData.stockQuantity,
              previousStock: 0,
              newStock: productData.stockQuantity,
              reason: 'Bulk import - Initial stock',
              createdBy: authResult.user.id,
            },
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        if (error instanceof z.ZodError) {
          results.errors.push({
            row: i + 1,
            error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          });
        } else {
          results.errors.push({
            row: i + 1,
            error: 'Failed to create product',
          });
        }
      }
    }

    return NextResponse.json({
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      results,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}

// Provide template download
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const format = request.nextUrl.searchParams.get('format') || 'csv';

    if (format === 'csv') {
      const csvTemplate = `name,description,barcode,sku,costPrice,salePrice,stockQuantity,minStockLevel,unit,category
"Product Name","Product Description","","SKU123",10.50,15.99,100,20,"piece","Electronics"
"Another Product","Description here","","SKU124",5.00,9.99,50,10,"piece","Accessories"`;

      return new NextResponse(csvTemplate, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="product-import-template.csv"',
        },
      });
    } else {
      const jsonTemplate = [
        {
          name: "Product Name",
          description: "Product Description",
          barcode: "",
          sku: "SKU123",
          costPrice: 10.50,
          salePrice: 15.99,
          stockQuantity: 100,
          minStockLevel: 20,
          unit: "piece",
          category: "Electronics"
        },
        {
          name: "Another Product",
          description: "Description here",
          barcode: "",
          sku: "SKU124",
          costPrice: 5.00,
          salePrice: 9.99,
          stockQuantity: 50,
          minStockLevel: 10,
          unit: "piece",
          category: "Accessories"
        }
      ];

      return NextResponse.json(jsonTemplate, {
        headers: {
          'Content-Disposition': 'attachment; filename="product-import-template.json"',
        },
      });
    }
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}