'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { productsApi, Product } from '@/lib/api/products';

export function LowStockAlert() {
  const router = useRouter();
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockProducts();
  }, []);

  const loadLowStockProducts = async () => {
    try {
      setLoading(true);
      const products = await productsApi.getAll({ lowStock: true });
      setLowStockProducts(products.slice(0, 5)); // Show top 5 low stock items
    } catch (error) {
      console.error('Error loading low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Low Stock Alert
        </h3>
        <div className="text-center py-4 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-green-500" />
          Stock Status
        </h3>
        <div className="text-center py-4">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">All products are well stocked!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 border-red-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Low Stock Alert
        </h3>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => router.push('/products?lowStock=true')}
        >
          View All
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
        <div className="space-y-3">
          {lowStockProducts.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-red-50 cursor-pointer hover:bg-red-100"
              onClick={() => router.push(`/products/${product.id}`)}
            >
              <div className="flex items-center gap-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-gray-600">
                    {product.sku || product.barcode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-red-600">
                  {product.stockQuantity} left
                </p>
                <p className="text-xs text-gray-500">
                  Min: {product.minStockLevel}
                </p>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}