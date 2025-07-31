'use client';

import { useEffect, useState } from 'react';
import { generateBarcode, generateQRCode } from '@/lib/barcode-utils';
import { Loader2 } from 'lucide-react';

interface BarcodeDisplayProps {
  value: string;
  type: 'barcode' | 'qrcode';
  width?: number;
  height?: number;
  showValue?: boolean;
  className?: string;
}

export function BarcodeDisplay({ 
  value, 
  type, 
  width, 
  height, 
  showValue = true,
  className = ''
}: BarcodeDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateCode = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let url: string;
        if (type === 'barcode') {
          url = await generateBarcode(value, {
            width: width ? width / 100 : 2,
            height: height || 100,
            displayValue: showValue,
          });
        } else {
          url = await generateQRCode(value, {
            width: width || 200,
          });
        }
        
        setImageUrl(url);
      } catch (err) {
        setError('Failed to generate code');
        console.error('Error generating code:', err);
      } finally {
        setLoading(false);
      }
    };

    if (value) {
      generateCode();
    }
  }, [value, type, width, height, showValue]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        {error || 'No code available'}
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={`${type} for ${value}`}
      className={className}
    />
  );
}