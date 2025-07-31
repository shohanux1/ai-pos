'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Download, FileText, FileJson, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useToast } from '@/components/ui/toast';

export default function ProductImportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    message: string;
    results: {
      success: number;
      failed: number;
      errors: { row: number; error: string }[];
    };
  } | null>(null);

  if (user?.role !== 'ADMIN') {
    router.push('/products');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect format from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'json') {
        setSelectedFormat('json');
      } else if (extension === 'csv') {
        setSelectedFormat('csv');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      setResults(null);
      const response = await productsApi.bulkImport(selectedFile, selectedFormat);
      setResults(response);
      toast('success', 'Import completed', `${response.results.success} products imported successfully`);
    } catch (error) {
      console.error('Import error:', error);
      toast('error', 'Failed to import products', 'Please check your file and try again');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'json') => {
    try {
      const blob = await productsApi.downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-import-template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast('error', 'Failed to download template');
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
        <h1 className="text-2xl font-semibold text-gray-900">Import Products</h1>
      </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Template</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Download a template file to see the required format for importing products.
              </p>
              <div className="flex gap-3">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadTemplate('csv')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV Template
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadTemplate('json')}
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  JSON Template
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">CSV or JSON files</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.json"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Format</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={selectedFormat === 'csv'}
                      onChange={(e) => setSelectedFormat(e.target.value as 'csv')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">CSV</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="json"
                      checked={selectedFormat === 'json'}
                      onChange={(e) => setSelectedFormat(e.target.value as 'json')}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">JSON</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="btn btn-primary w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? 'Importing...' : 'Import Products'}
              </button>
            </div>
          </div>
        </div>

        {results && (
          <div className="card p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Success: {results.results.success}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Failed: {results.results.failed}</span>
                </div>
              </div>

              {results.results.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h4 className="font-medium text-gray-900">Import Errors</h4>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {results.results.errors.map((error, index) => (
                      <li key={index} className="text-red-700">
                        Row {error.row}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.results.success > 0 && (
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push('/products')}
                >
                  View Products
                </button>
              )}
            </div>
        </div>
      )}
    </div>
  );
}