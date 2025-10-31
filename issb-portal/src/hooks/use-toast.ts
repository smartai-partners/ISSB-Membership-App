/**
 * Toast Hook
 * Simple toast notification hook for user feedback
 */

import { useState, useCallback } from 'react';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: ToastProps) => {
    const newToast = { title, description, variant };
    setToasts((prev) => [...prev, newToast]);

    // Simple console log for now - can be replaced with actual toast UI
    console.log(`[${variant.toUpperCase()}] ${title}${description ? `: ${description}` : ''}`);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== newToast));
    }, 3000);
  }, []);

  return { toast, toasts };
}
