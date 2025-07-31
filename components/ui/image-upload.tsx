'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  value: string | null
  onChange: (file: File | null) => void
  onRemove: () => void
  maxSize?: number
  allowedTypes?: string[]
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove,
  maxSize = 5 * 1024 * 1024,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size too large. Maximum size is ${maxSize / 1024 / 1024}MB.`)
      return
    }

    onChange(file)
  }

  return (
    <div>
      <div className="mt-2">
        {value ? (
          <div className="relative inline-block">
            <img
              src={value}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={onRemove}
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
              accept={allowedTypes.join(',')}
              onChange={handleImageChange}
            />
          </label>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        JPEG, PNG, WebP (max {maxSize / 1024 / 1024}MB)
      </p>
    </div>
  )
}