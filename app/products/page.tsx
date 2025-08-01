'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Package, AlertTriangle, Edit, Trash2, Upload, ChevronDown, User, Settings, LogOut, ChevronLeft, ChevronRight, MoreHorizontal, Download, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { productsApi, Product } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lowStock') === 'true') {
      setShowLowStock(true);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showLowStock, categoryFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll({
        search: search || undefined,
        lowStock: showLowStock,
      });
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsApi.delete(id);
      await loadProducts();
      toast('success', 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast('error', 'Failed to delete product', 'Please try again later');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter products by category
  const filteredByCategoryProducts = categoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  // Pagination
  const totalPages = Math.ceil(filteredByCategoryProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredByCategoryProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Products</h1>
            </div>

            <div className="flex items-center space-x-4">
              {user?.role === 'ADMIN' && (
                <Button
                  onClick={() => router.push('/products/import')}
                  variant="secondary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              )}
              <Button
                onClick={() => router.push('/products/new')}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Product Inventory</h2>
          <p className="text-gray-600">Manage your products and track inventory levels</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-50 rounded-md">
                <Package className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md badge-default">
                Total
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Activity className="w-3 h-3 mr-1" />
                <span>Active items</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-50 rounded-md">
                <AlertTriangle className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md badge-warning">
                Low Stock
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter(p => p.isLowStock).length}
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <AlertTriangle className="w-3 h-3 mr-1" />
                <span>Need reorder</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-50 rounded-md">
                <DollarSign className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md badge-default">
                Value
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(products.reduce((sum, p) => sum + (p.salePrice * p.stockQuantity), 0))}
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>Stock value</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-gray-50 rounded-md">
                <Activity className="w-5 h-5 text-gray-700" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md badge-success">
                Active
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(products.map(p => p.category).filter(Boolean)).size}
              </p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Package className="w-3 h-3 mr-1" />
                <span>Product groups</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or barcode..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters Group */}
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-3">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map((category) => (
                    <SelectItem key={category as string} value={category as string}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Low Stock Toggle */}
              <Button
                variant={showLowStock ? "destructive" : "secondary"}
                onClick={() => setShowLowStock(!showLowStock)}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Low Stock Only
              </Button>

              {/* Export Button */}
              <Button variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="card p-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          </div>
        ) : (
          <>
            {/* Products Table */}
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Product</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3 hidden sm:table-cell">SKU</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3 hidden md:table-cell">Barcode</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Cost</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Price</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3">Stock</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3 hidden lg:table-cell">Category</th>
                    <th className="text-left text-sm font-medium text-gray-700 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-md mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.isLowStock && (
                              <div className="flex items-center text-xs text-red-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Low Stock
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 hidden sm:table-cell">{product.sku || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 hidden md:table-cell">{product.barcode || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(product.costPrice)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(product.salePrice)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${product.isLowStock ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {product.stockQuantity} {product.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 hidden lg:table-cell">{product.category || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          {user?.role === 'ADMIN' && (
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button
                                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                  title="More Options"
                                >
                                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content 
                                  className="min-w-[160px] bg-white rounded-md shadow-sm border border-gray-200 p-1"
                                  sideOffset={5}
                                >
                                  <DropdownMenu.Item 
                                    className="flex items-center px-3 py-2 text-sm text-red-600 outline-none cursor-pointer rounded hover:bg-red-50"
                                    onSelect={() => handleDelete(product.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-3" />
                                    Delete Product
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredByCategoryProducts.length)} of {filteredByCategoryProducts.length} products
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`px-3 py-1 text-sm rounded ${currentPage === page ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}