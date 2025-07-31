import { useState, useCallback } from 'react'

interface UseApiCallOptions {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  successMessage?: string
}

export function useApiCall<T>() {
  const [loading, setLoading] = useState(false)
  
  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options?: UseApiCallOptions
  ): Promise<T | undefined> => {
    try {
      setLoading(true)
      const result = await apiCall()
      if (options?.onSuccess) {
        options.onSuccess(options.successMessage || 'Success!')
      }
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      if (options?.onError) {
        options.onError(message)
      } else {
        // Default to alert if no error handler provided
        alert(message)
      }
      throw error
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { execute, loading }
}