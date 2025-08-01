'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Package, TrendingDown, TrendingUp, RefreshCw, Upload, X, Printer, ChevronLeft, ChevronDown, User, Settings, LogOut, Info } from 'lucide-react';
import * as Label from '@radix-ui/react-label';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { productsApi, Product, StockLog } from '@/lib/api/products';
import { BarcodeDisplay } from '@/components/ui/barcode-display';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/components/ui/toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  costPrice: z.number().positive('Cost price must be positive'),
  salePrice: z.number().positive('Sale price must be positive'),
  stockQuantity: z.number().int().min(0, 'Stock quantity cannot be negative'),
  minStockLevel: z.number().int().min(0, 'Min stock level cannot be negative'),
  unit: z.string().default('piece'),
  category: z.string().optional(),
  isActive: z.boolean(),
}).refine((data) => data.salePrice >= data.costPrice, {
  message: "Sale price must be greater than or equal to cost price",
  path: ["salePrice"],
});

type FormData = z.input<typeof productSchema>;

const stockAdjustmentSchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT']),
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required'),
});

type StockAdjustmentData = z.input<typeof stockAdjustmentSchema>;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { toast } = useToast();
  const { id } = use(params);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product & { stockLogs?: StockLog[] }>();
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleLogout = async () => {
    try {
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };


  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
  });

  const costPrice = watch('costPrice');
  const salePrice = watch('salePrice');

  const {
    register: registerStock,
    handleSubmit: handleStockSubmit,
    reset: resetStock,
    formState: { errors: stockErrors },
  } = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
  });

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productsApi.getById(id);
      setProduct(data);
      setImageUrl(data.image || null);
      reset({
        name: data.name,
        description: data.description || '',
        barcode: data.barcode || '',
        sku: data.sku || '',
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        unit: data.unit,
        category: data.category || '',
        isActive: data.isActive,
      });
    } catch (error) {
      console.error('Error loading product:', error);
      toast('error', 'Failed to load product');
      router.push('/products');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast('error', 'Invalid file type', 'Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast('error', 'File size too large', 'Maximum size is 5MB.');
      return;
    }

    setImageFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      let uploadedImageUrl = imageUrl;
      if (imageFile) {
        setUploadingImage(true);
        try {
          const { url } = await productsApi.uploadImage(imageFile);
          uploadedImageUrl = url;
        } catch (error) {
          console.error('Error uploading image:', error);
          toast('error', 'Failed to upload image');
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const transformedData = productSchema.parse(data);
      await productsApi.update(id, {
        name: transformedData.name,
        description: transformedData.description || undefined,
        barcode: transformedData.barcode || undefined,
        sku: transformedData.sku || undefined,
        costPrice: transformedData.costPrice,
        salePrice: transformedData.salePrice,
        minStockLevel: transformedData.minStockLevel,
        unit: transformedData.unit,
        category: transformedData.category || undefined,
        isActive: transformedData.isActive,
        image: uploadedImageUrl || undefined,
      });
      await loadProduct();
      toast('success', 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast('error', 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const onStockAdjustment = async (data: StockAdjustmentData) => {
    try {
      setLoading(true);
      const transformedData = stockAdjustmentSchema.parse(data);
      await productsApi.adjustStock(id, {
        type: transformedData.type,
        quantity: transformedData.quantity as number,
        reason: transformedData.reason,
      });
      await loadProduct();
      setShowStockAdjustment(false);
      resetStock();
      toast('success', 'Stock adjusted successfully');
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      
      // Handle validation errors
      if (error.response?.data?.details) {
        const errorMessages = error.response.data.details.map((err: any) => err.message).join(', ');
        toast('error', 'Validation errors', errorMessages);
      } else if (error.response?.data?.error) {
        toast('error', 'Error', error.response.data.error);
      } else if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => err.message).join(', ');
        toast('error', 'Validation errors', errorMessages);
      } else {
        toast('error', 'Failed to adjust stock', 'Please check your input and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStockLogIcon = (type: string) => {
    switch (type) {
      case 'STOCK_IN':
      case 'PURCHASE':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'STOCK_OUT':
      case 'SALE':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  if (!product) {
    return <LoadingSpinner message="Loading product details..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                onClick={() => router.push('/products')}
                variant="ghost"
                size="icon"
                className="mr-4"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Edit Product</h1>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-md px-3 py-2 transition-colors">
                    <Avatar.Root className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <Avatar.Fallback className="text-white text-sm font-medium">
                        {user?.name.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.role.toLowerCase()}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenu.Trigger>
                
                <DropdownMenu.Portal>
                  <DropdownMenu.Content 
                    className="min-w-[220px] bg-white rounded-md shadow-sm border border-gray-200 p-1 animate-slide-up"
                    sideOffset={5}
                  >
                    <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      Profile
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50">
                      <Settings className="w-4 h-4 mr-3 text-gray-400" />
                      Settings
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                    <DropdownMenu.Item 
                      className="flex items-center px-3 py-2 text-sm text-gray-700 outline-none cursor-pointer rounded hover:bg-gray-50"
                      onSelect={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-3 text-gray-400" />
                      Sign out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Edit Product</h2>
          <p className="text-gray-600">Update product information and manage inventory</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Product Details */}
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label.Root htmlFor="image" className="text-sm font-medium text-gray-700">Product Image</Label.Root>
                    <div className="mt-2">
                    {imageUrl ? (
                      <div className="relative inline-block">
                        <img
                          src={imageUrl}
                          alt="Product preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            setImageUrl(null);
                            setImageFile(null);
                          }}
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">Upload</span>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      JPEG, PNG, WebP (max 5MB)
                    </p>
                  </div>

                  <div>
                    <Label.Root htmlFor="name" className="text-sm font-medium text-gray-700">Product Name *</Label.Root>
                    <input
                      id="name"
                      {...register('name')}
                      placeholder="Enter product name"
                      className="input-field mt-1"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label.Root htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label.Root>
                    <input
                      id="description"
                      {...register('description')}
                      placeholder="Enter product description"
                      className="input-field mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label.Root htmlFor="barcode" className="text-sm font-medium text-gray-700">Barcode</Label.Root>
                      <input
                        id="barcode"
                        {...register('barcode')}
                        placeholder="Enter barcode"
                        className="input-field mt-1"
                      />
                    </div>
                    <div>
                      <Label.Root htmlFor="sku" className="text-sm font-medium text-gray-700">SKU</Label.Root>
                      <input
                        id="sku"
                        {...register('sku')}
                        placeholder="Enter SKU"
                        className="input-field mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label.Root htmlFor="costPrice" className="text-sm font-medium text-gray-700">Cost Price *</Label.Root>
                      <input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        {...register('costPrice', { valueAsNumber: true })}
                        placeholder="0.00"
                        className="input-field mt-1"
                      />
                      {errors.costPrice && (
                        <p className="text-sm text-red-600 mt-1">{errors.costPrice.message}</p>
                      )}
                    </div>
                    <div>
                      <Label.Root htmlFor="salePrice" className="text-sm font-medium text-gray-700">Sale Price *</Label.Root>
                      <input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        {...register('salePrice', { valueAsNumber: true })}
                        placeholder="0.00"
                        className="input-field mt-1"
                      />
                      {errors.salePrice && (
                        <p className="text-sm text-red-600 mt-1">{errors.salePrice.message}</p>
                      )}
                      {costPrice && salePrice && salePrice < costPrice && !errors.salePrice && (
                        <p className="text-sm text-orange-600 mt-1">
                          Warning: Sale price is less than cost price
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label.Root htmlFor="stockQuantity" className="text-sm font-medium text-gray-700">Current Stock</Label.Root>
                      <div className="mt-1 px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                        {product?.stockQuantity || 0} {product?.unit || 'units'}
                      </div>
                    </div>
                    <div>
                      <Label.Root htmlFor="minStockLevel" className="text-sm font-medium text-gray-700">Min Stock Level</Label.Root>
                      <input
                        id="minStockLevel"
                        type="number"
                        {...register('minStockLevel', { valueAsNumber: true })}
                        placeholder="10"
                        className="input-field mt-1"
                      />
                    </div>
                    <div>
                      <Label.Root htmlFor="unit" className="text-sm font-medium text-gray-700">Unit</Label.Root>
                      <input
                        id="unit"
                        {...register('unit')}
                        placeholder="piece"
                        className="input-field mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label.Root htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label.Root>
                    <input
                      id="category"
                      {...register('category')}
                      placeholder="Enter category"
                      className="input-field mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      {...register('isActive')}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label.Root htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</Label.Root>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Stock Management</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">Current stock level</div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setShowStockAdjustment(!showStockAdjustment)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Adjust Stock
                    </Button>
                  </div>

                  {showStockAdjustment && (
                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div>
                        <Label.Root htmlFor="stockType" className="text-sm font-medium text-gray-700">Type</Label.Root>
                        <select
                          id="stockType"
                          {...registerStock('type')}
                          className="input-field mt-1"
                        >
                          <option value="STOCK_IN">Stock In</option>
                          <option value="STOCK_OUT">Stock Out</option>
                        </select>
                      </div>
                      <div>
                        <Label.Root htmlFor="stockQuantity" className="text-sm font-medium text-gray-700">Quantity</Label.Root>
                        <input
                          id="stockQuantity"
                          type="number"
                          {...registerStock('quantity', { valueAsNumber: true })}
                          placeholder="Enter quantity"
                          className="input-field mt-1"
                        />
                        {stockErrors.quantity && (
                          <p className="text-sm text-red-600 mt-1">{stockErrors.quantity.message}</p>
                        )}
                      </div>
                      <div>
                        <Label.Root htmlFor="stockReason" className="text-sm font-medium text-gray-700">Reason</Label.Root>
                        <input
                          id="stockReason"
                          {...registerStock('reason')}
                          placeholder="Enter reason for adjustment"
                          className="input-field mt-1"
                        />
                        {stockErrors.reason && (
                          <p className="text-sm text-red-600 mt-1">{stockErrors.reason.message}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleStockSubmit(onStockAdjustment)}
                          disabled={loading}
                        >
                          {loading ? 'Adjusting...' : 'Adjust Stock'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowStockAdjustment(false);
                            resetStock();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700">Recent Stock Movements</h4>
                    {product?.stockLogs && product.stockLogs.length > 0 ? (
                      product.stockLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                          {getStockLogIcon(log.type)}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-gray-900">{log.type}</span>
                              <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Quantity: {log.quantity} | Stock: {log.previousStock} → {log.newStock}
                            </div>
                            {log.reason && (
                              <div className="text-sm text-gray-500">Reason: {log.reason}</div>
                            )}
                            <div className="text-xs text-gray-400">By: {log.user.name}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No stock movements yet</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-6">
              {/* Stock Status */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Status</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Stock on Hand</span>
                      <span className="text-lg font-semibold text-gray-900">{product?.stockQuantity || 0}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Minimum Stock</span>
                      <span className="text-sm font-medium text-gray-900">{watch('minStockLevel') || 10}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      {product && product.stockQuantity <= product.minStockLevel ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-md badge-warning">Low Stock</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-md badge-success">In Stock</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Profit Margin Calculator */}
                  {costPrice && salePrice && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Profit Margin</h4>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-semibold text-blue-600">
                          {((((salePrice - costPrice) / costPrice) * 100) || 0).toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(salePrice - costPrice)} per unit
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barcode & QR Code */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Barcode & QR Code</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`/api/products/${id}/barcode`, '_blank')}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Label
                  </Button>
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Barcode</h3>
                    {product.barcode && (
                      <BarcodeDisplay 
                        value={product.barcode} 
                        type="barcode"
                        width={200}
                        height={80}
                        className="border rounded p-2"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">{product.barcode}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">QR Code</h3>
                    {product.qrCode && (
                      <BarcodeDisplay 
                        value={JSON.stringify({
                          id: product.id,
                          name: product.name,
                          price: product.salePrice,
                          barcode: product.barcode
                        })} 
                        type="qrcode"
                        width={150}
                        className="border rounded p-2"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">{product.qrCode}</p>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="card p-6 bg-blue-50 border-blue-200">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Quick Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Stock adjustments are tracked for audit purposes</li>
                      <li>• Low stock alerts help prevent stockouts</li>
                      <li>• Maintain accurate pricing for profit calculations</li>
                      <li>• Use barcodes for faster checkout</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/products')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading || uploadingImage}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : uploadingImage ? 'Uploading...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}