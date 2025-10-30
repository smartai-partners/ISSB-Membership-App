import { useState, useCallback } from 'react';

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setIsOpen: (open: boolean) => void;
}

export interface UseModalOptions {
  initialOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Custom hook for managing modal state
 * @param options - Configuration options for the modal
 * @returns Modal state and control functions
 */
export const useModal = (options: UseModalOptions = {}): UseModalReturn => {
  const {
    initialOpen = false,
    onOpen,
    onClose,
    closeOnOverlayClick = true,
    closeOnEscape = true,
  } = options;

  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (newState) {
        onOpen?.();
      } else {
        onClose?.();
      }
      return newState;
    });
  }, [onOpen, onClose]);

  const setIsOpenDirect = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [onOpen, onClose]);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen: setIsOpenDirect,
  };
};

/**
 * Hook for managing multiple modals
 */
export interface UseMultipleModalsReturn {
  modals: Record<string, boolean>;
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  toggleModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  closeAll: () => void;
  openAll: () => void;
}

export const useMultipleModals = (
  initialState: Record<string, boolean> = {}
): UseMultipleModalsReturn => {
  const [modals, setModals] = useState<Record<string, boolean>>(initialState);

  const openModal = useCallback((id: string) => {
    setModals(prev => ({ ...prev, [id]: true }));
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => ({ ...prev, [id]: false }));
  }, []);

  const toggleModal = useCallback((id: string) => {
    setModals(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals[id] || false;
  }, [modals]);

  const closeAll = useCallback(() => {
    setModals(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  const openAll = useCallback(() => {
    setModals(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = true;
      });
      return newState;
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    closeAll,
    openAll,
  };
};

/**
 * Hook for managing confirm modals
 */
export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'default';
}

export interface UseConfirmModalReturn {
  state: ConfirmModalState;
  confirm: (config: Omit<ConfirmModalState, 'isOpen'>) => void;
  cancel: () => void;
  close: () => void;
}

export const useConfirmModal = (): UseConfirmModalReturn => {
  const [state, setState] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  });

  const confirm = useCallback((config: Omit<ConfirmModalState, 'isOpen'>) => {
    setState({
      ...config,
      isOpen: true,
    });
  }, []);

  const cancel = useCallback(() => {
    state.onCancel?.();
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.onCancel]);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    state,
    confirm,
    cancel,
    close,
  };
};

export default useModal;
