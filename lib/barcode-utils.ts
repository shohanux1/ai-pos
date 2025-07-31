import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export async function generateBarcode(value: string, options?: {
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    
    try {
      JsBarcode(canvas, value, {
        format: options?.format || 'CODE128',
        width: options?.width || 2,
        height: options?.height || 100,
        displayValue: options?.displayValue !== false,
        fontSize: 12,
        margin: 10,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateQRCode(value: string, options?: {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(value, {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
    });
    
    return dataUrl;
  } catch (error) {
    throw error;
  }
}

export function generateProductBarcode(productId: string): string {
  return `PRD${productId.replace(/-/g, '').substring(0, 12).toUpperCase()}`;
}

export function generateProductQRCode(product: {
  id: string;
  name: string;
  barcode?: string;
  salePrice: number;
}): string {
  return JSON.stringify({
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    price: product.salePrice,
  });
}