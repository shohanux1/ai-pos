'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Upload, X, RefreshCw } from 'lucide-react';
import * as Label from '@radix-ui/react-label';
import { productsApi, CreateProductData } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
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
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [apiErrors, setApiErrors] = useState<Array<{ message: string; path?: string[] }> | null>(null);


  const generateBarcode = () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const barcode = `PRD${timestamp}${randomId}`;
    setValue('barcode', barcode);
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
    <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Add New Product</h1>
        </div>

        {apiErrors && (
          <ErrorAlert errors={apiErrors} onClose={() => setApiErrors(null)} />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Information</h2>
            <div className="grid gap-6">
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

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/products')}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
    </div>
  );
}