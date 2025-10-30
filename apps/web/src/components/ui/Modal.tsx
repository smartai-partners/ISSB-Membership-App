import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  preventClose?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  footer?: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  restoreFocusTo?: HTMLElement | null;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

const variantClasses: Record<ModalVariant, string> = {
  default: 'border-gray-200',
  danger: 'border-red-200',
  warning: 'border-yellow-200',
  success: 'border-green-200',
  info: 'border-blue-200',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventClose = false,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  footer,
  ariaLabel,
  ariaDescribedBy,
  initialFocusRef,
  restoreFocusTo,
}) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Get or create portal element
  useEffect(() => {
    const element = document.getElementById('modal-root') || document.body;
    setPortalElement(element);
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus the modal or initial focus element
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 0);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus
      if (restoreFocusTo) {
        restoreFocusTo.focus();
      } else if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialFocusRef, restoreFocusTo]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape || preventClose) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, preventClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleClose = () => {
    if (preventClose) return;
    
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150); // Animation duration
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (!closeOnBackdropClick || preventClose) return;
    
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !portalElement) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] ${isClosing ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150 ease-out`}
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-150 ${overlayClassName}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={ariaDescribedBy}
            aria-label={!title ? ariaLabel : undefined}
            className={`
              relative w-full ${sizeClasses[size]} 
              bg-white rounded-lg shadow-xl 
              border-2 ${variantClasses[variant]}
              transform transition-all duration-200 ease-out
              ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
              ${className}
            `}
            tabIndex={-1}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
                {showCloseButton && !preventClose && (
                  <button
                    onClick={handleClose}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={`p-4 ${contentClassName}`}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    portalElement
  );
};

// Modal Header Component
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => {
  return <div className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</div>;
};

// Modal Body Component
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return <div className={`py-2 ${className}`}>{children}</div>;
};

// Modal Footer Component
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

// Compound component pattern for convenience
interface CompoundModalProps extends Omit<ModalProps, 'children'> {
  children: React.ReactNode;
}

export const ModalCompound: React.FC<CompoundModalProps> = ({
  title,
  children,
  footer,
  ...props
}) => {
  return (
    <Modal {...props}>
      {children}
      {footer && <ModalFooter>{footer}</ModalFooter>}
    </Modal>
  );
};

export default Modal;
