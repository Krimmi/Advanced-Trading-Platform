import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for data fetching with loading, error, and success states
 * @param fetchFn The async function to fetch data
 * @param initialData Initial data value
 * @param immediate Whether to fetch data immediately
 * @returns Object containing data, loading state, error state, success message, and fetch function
 */
export function useFetch<T>(
  fetchFn: (...args: any[]) => Promise<T>,
  initialData: T,
  immediate: boolean = true
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await fetchFn(...args);
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error in useFetch:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      throw err;
    }
  }, [fetchFn]);

  const setSuccessMessage = useCallback((message: string) => {
    setSuccess(message);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    success,
    execute,
    setData,
    setError,
    setSuccess: setSuccessMessage,
    clearError,
    clearSuccess
  };
}

export default useFetch;