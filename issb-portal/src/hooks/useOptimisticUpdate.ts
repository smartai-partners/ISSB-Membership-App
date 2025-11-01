/**
 * Optimistic Update Hook
 * Implements optimistic UI updates with automatic rollback on error
 */

import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  onUpdate: (optimisticData: T) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollbackData: T) => void;
}

export function useOptimisticUpdate<T>(initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (optimisticData: T, options: OptimisticUpdateOptions<T>) => {
      const previousData = data;
      
      // Immediately update UI with optimistic data
      setData(optimisticData);
      setIsLoading(true);
      setError(null);

      try {
        // Perform actual update
        const result = await options.onUpdate(optimisticData);
        
        // Update with server response
        setData(result);
        setIsLoading(false);
        
        // Call success callback
        options.onSuccess?.(result);
        
        return { success: true, data: result };
      } catch (err) {
        // Rollback to previous data on error
        setData(previousData);
        setIsLoading(false);
        
        const error = err instanceof Error ? err : new Error('Update failed');
        setError(error);
        
        // Call error callback
        options.onError?.(error, previousData);
        
        return { success: false, error };
      }
    },
    [data]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    update,
    reset,
    setData, // Allow manual data updates
  };
}
