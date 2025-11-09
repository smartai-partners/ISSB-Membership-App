import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    title: 'text-green-900',
    message: 'text-green-800',
    action: 'text-green-700 hover:text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    title: 'text-red-900',
    message: 'text-red-800',
    action: 'text-red-700 hover:text-red-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-900',
    message: 'text-yellow-800',
    action: 'text-yellow-700 hover:text-yellow-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-900',
    message: 'text-blue-800',
    action: 'text-blue-700 hover:text-blue-800',
  },
};

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  persistent = false,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border border-gray-200 transform transition-all duration-300 ease-out',
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={cn('text-sm font-medium', colors.title)}>
                {title}
              </p>
            )}
            <p className={cn('text-sm', title ? 'mt-1' : '', colors.message)}>
              {message}
            </p>
            {action && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    'text-sm font-medium rounded-md px-3 py-2 transition-colors',
                    colors.action
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast Container
export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  onClose: (id: string) => void;
}

const positionClasses = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2',
};

export function ToastContainer({
  toasts,
  position = 'top-right',
  maxToasts = 5,
  onClose,
}: ToastContainerProps) {
  const visibleToasts = toasts.slice(0, maxToasts);

  return (
    <div
      className={cn(
        'fixed z-50 p-4 space-y-4 pointer-events-none',
        positionClasses[position]
      )}
    >
      <div className="space-y-4 pointer-events-auto">
        {visibleToasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // Convenience methods
  const success = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ type: 'success', message, ...options });
  };

  const error = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ type: 'error', message, persistent: true, ...options });
  };

  const warning = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ type: 'warning', message, ...options });
  };

  const info = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ type: 'info', message, ...options });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}

// Toast Provider Component
export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastContainerProps['position'];
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  position = 'top-right', 
  maxToasts = 5 
}: ToastProviderProps) {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        toasts={toast.toasts}
        position={position}
        maxToasts={maxToasts}
        onClose={toast.removeToast}
      />
    </ToastContext.Provider>
  );
}

// Context for toasts
const ToastContext = React.createContext<ReturnType<typeof useToast> | null>(null);

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}

// Global toast instance for convenience
let globalToast: ReturnType<typeof useToast> | null = null;

export const setGlobalToast = (toast: ReturnType<typeof useToast>) => {
  globalToast = toast;
};

export const toast = {
  success: (message: string, options?: Partial<ToastProps>) => {
    if (globalToast) return globalToast.success(message, options);
  },
  error: (message: string, options?: Partial<ToastProps>) => {
    if (globalToast) return globalToast.error(message, options);
  },
  warning: (message: string, options?: Partial<ToastProps>) => {
    if (globalToast) return globalToast.warning(message, options);
  },
  info: (message: string, options?: Partial<ToastProps>) => {
    if (globalToast) return globalToast.info(message, options);
  },
};
