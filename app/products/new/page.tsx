'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Upload, X, RefreshCw, ChevronLeft, ChevronDown, User, Settings, LogOut, Info } from 'lucide-react';
import * as Label from '@radix-ui/react-label';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { productsApi } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { ErrorAlert } from '@/components/ui/error-alert';
import { useToast } from '@/components/ui/toast';

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
}).refine((data) => data.salePrice >= data.costPrice, {
  message: "Sale price must be greater than or equal to cost price",
  path: ["salePrice"],
});

type FormData = z.input<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [apiErrors, setApiErrors] = useState<Array<{ message: string; path?: string[] }> | null>(null);

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


  const generateBarcode = () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const barcode = `PRD${timestamp}${randomId}`;
    setValue('barcode', barcode);
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'piece',
      stockQuantity: 0,
      minStockLevel: 10,
    },
  });

  const costPrice = watch('costPrice');
  const salePrice = watch('salePrice');

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
      setApiErrors(null);
      
      let uploadedImageUrl = null;
      if (imageFile) {
        setUploadingImage(true);
        try {
          const { url } = await productsApi.uploadImage(imageFile);
          uploadedImageUrl = url;
        } catch (error) {
          console.error('Error uploading image:', error);
          setApiErrors([{ message: 'Failed to upload image. Please try again.' }]);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      await productsApi.create({
        ...data,
        image: uploadedImageUrl,
      });
      toast('success', 'Product created successfully');
      router.push('/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Handle validation errors
      if (error.response?.data?.details) {
        setApiErrors(error.response.data.details);
      } else if (error.response?.data?.error) {
        setApiErrors([{ message: error.response.data.error }]);
      } else {
        setApiErrors([{ message: 'Failed to create product. Please check your input and try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/products')}
                className="mr-4 p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Add Product</h1>
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Create New Product</h2>
          <p className="text-gray-600">Add a new product to your inventory</p>
        </div>

        {apiErrors && (
          <ErrorAlert errors={apiErrors} onClose={() => setApiErrors(null)} />
        )}

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
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl(null);
                          setImageFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
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
                  <div className="flex gap-2 mt-1">
                    <input
                      id="barcode"
                      {...register('barcode')}
                      placeholder="Enter barcode or generate"
                      className="input-field flex-1"
                    />
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="btn btn-secondary btn-sm"
                      title="Generate barcode"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
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

                </div>
              </div>

              {/* Pricing Section */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Inventory</h3>
                <div className="space-y-4">
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
                      <Label.Root htmlFor="stockQuantity" className="text-sm font-medium text-gray-700">Initial Stock</Label.Root>
                      <input
                        id="stockQuantity"
                        type="number"
                        {...register('stockQuantity', { valueAsNumber: true })}
                        placeholder="0"
                        className="input-field mt-1"
                      />
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
                      <span className="text-lg font-semibold text-gray-900">{watch('stockQuantity') || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Minimum Stock</span>
                      <span className="text-sm font-medium text-gray-900">{watch('minStockLevel') || 10}</span>
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
              
              {/* Quick Tips */}
              <div className="card p-6 bg-blue-50 border-blue-200">
                <div className="flex">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Quick Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Set realistic minimum stock levels to avoid stockouts</li>
                      <li>• Ensure sale price covers costs and desired profit margin</li>
                      <li>• Use consistent categories for better organization</li>
                      <li>• Upload high-quality product images for better visibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/products')}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploadingImage}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : uploadingImage ? 'Uploading...' : 'Create Product'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}