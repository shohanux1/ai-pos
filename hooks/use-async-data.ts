import { useState, useEffect, useCallback } from 'react'

interface UseAsyncDataOptions {
  onError?: (error: string) => void
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options?: UseAsyncDataOptions
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      options?.onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, options])

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return { data, loading, error, refetch }
}