import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(
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
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        barcode: true,
        qrCode: true,
        salePrice: true,
        sku: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Generate HTML for barcode label
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Label - ${product.name}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .label {
            border: 1px solid #ddd;
            padding: 10px;
            width: 300px;
            text-align: center;
            margin: 0 auto;
          }
          .product-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .price {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
          }
          .barcode-container {
            margin: 10px 0;
          }
          .sku {
            font-size: 12px;
            color: #666;
          }
          .print-button {
            margin: 20px auto;
            display: block;
            padding: 10px 20px;
            background: #000;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">Print Label</button>
        <div class="label">
          <div class="product-name">${product.name}</div>
          <div class="price">$${product.salePrice.toFixed(2)}</div>
          <div class="barcode-container">
            <svg id="barcode"></svg>
          </div>
          ${product.sku ? `<div class="sku">SKU: ${product.sku}</div>` : ''}
        </div>
        <script>
          JsBarcode("#barcode", "${product.barcode}", {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 12,
            margin: 5
          });
        </script>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
    return NextResponse.json(
      { error: 'Failed to generate barcode' },
      { status: 500 }
    );
  }
}