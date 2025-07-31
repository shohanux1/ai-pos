import { authFetch } from './auth';

export interface Product {
  id: string;
  name: string;
  description?: string;
  barcode?: string;
  qrCode?: string;
  sku?: string;
  image?: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  category?: string;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockLog {
  id: string;
  productId: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'RETURN';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  reason?: string;
  createdBy: string;
  user: {
    name: string;
    username: string;
  };
  createdAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  image?: string | null;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit?: string;
  category?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
}

export interface StockAdjustmentData {
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
}

export const productsApi = {
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await authFetch('/api/products/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    return response.json();
  },
  async getAll(params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.lowStock) searchParams.append('lowStock', 'true');

    const response = await authFetch(`/api/products?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  },

  async getById(id: string): Promise<Product & { stockLogs: StockLog[] }> {
    const response = await authFetch(`/api/products/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error('Failed to fetch product');
    }
    return response.json();
  },

  async create(data: CreateProductData): Promise<Product> {
    const response = await authFetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
    return response.json();
  },

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const response = await authFetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await authFetch(`/api/products/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
  },

  async adjustStock(
    id: string,
    data: StockAdjustmentData
  ): Promise<{ product: Product; stockLog: StockLog }> {
    const response = await authFetch(`/api/products/${id}/stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to adjust stock');
    }
    return response.json();
  },

  async bulkImport(file: File, format: 'csv' | 'json'): Promise<{
    message: string;
    results: {
      success: number;
      failed: number;
      errors: { row: number; error: string }[];
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);

    const response = await authFetch('/api/products/import', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import products');
    }
    return response.json();
  },

  async downloadTemplate(format: 'csv' | 'json'): Promise<Blob> {
    const response = await authFetch(`/api/products/import?format=${format}`);
    
    if (!response.ok) {
      throw new Error('Failed to download template');
    }
    
    return response.blob();
  },
};