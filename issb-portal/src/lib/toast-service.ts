import { toast } from 'sonner';

// Base functions for simple usage
export function toastInfo(message: string) {
  return toast.info(message);
}

export function toastWarning(message: string) {
  return toast.warning(message);
}

// Type definitions for extended toast functions
type ToastSuccessFunc = {
  (message: string): string | number;
  userCreated: (resource?: string) => string | number;
  userUpdated: (resource?: string) => string | number;
  userDeleted: (resource?: string) => string | number;
  statusUpdated: () => string | number;
};

type ToastErrorFunc = {
  (message: string): string | number;
  createFailed: (msg: string) => string | number;
  updateFailed: (msg: string) => string | number;
  deleteFailed: (msg: string) => string | number;
  permissionDenied: () => string | number;
  validationFailed: () => string | number;
};

type ToastLoadingFunc = {
  (message: string): string | number;
  saving: () => string | number;
  creating: () => string | number;
  deleting: () => string | number;
  updating: () => string | number;
};

// Extended toast success with message functions
export const toastSuccess: ToastSuccessFunc = Object.assign(
  (message: string) => toast.success(message),
  {
    userCreated: (resource?: string) => toast.success(`${resource || 'User'} created successfully`),
    userUpdated: (resource?: string) => toast.success(`${resource || 'User'} updated successfully`),
    userDeleted: (resource?: string) => toast.success(`${resource || 'User'} deleted successfully`),
    statusUpdated: () => toast.success('Status updated successfully'),
  }
);

// Extended toast error with message helpers
export const toastError: ToastErrorFunc = Object.assign(
  (message: string) => toast.error(message),
  {
    createFailed: (msg: string) => toast.error(`Failed to create: ${msg}`),
    updateFailed: (msg: string) => toast.error(`Failed to update: ${msg}`),
    deleteFailed: (msg: string) => toast.error(`Failed to delete: ${msg}`),
    permissionDenied: () => toast.error('Permission denied'),
    validationFailed: () => toast.error('Validation failed'),
  }
);

// Extended toast loading with message functions
export const toastLoading: ToastLoadingFunc = Object.assign(
  (message: string) => toast.loading(message),
  {
    saving: () => toast.loading('Saving...'),
    creating: () => toast.loading('Creating...'),
    deleting: () => toast.loading('Deleting...'),
    updating: () => toast.loading('Updating...'),
  }
);

export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

export function dismissAllToasts() {
  toast.dismiss();
}
