import { toast } from 'sonner';

export function toastSuccess(message: string) {
  return toast.success(message);
}

export function toastError(message: string) {
  return toast.error(message);
}

export function toastInfo(message: string) {
  return toast.info(message);
}

export function toastWarning(message: string) {
  return toast.warning(message);
}

// Base toast loading function
function baseToastLoading(message: string) {
  return toast.loading(message);
}

// Extended toast loading with message constants
export const toastLoading: typeof baseToastLoading & {
  saving: string;
  creating: string;
  deleting: string;
} = Object.assign(baseToastLoading, {
  saving: 'Saving...',
  creating: 'Creating...',
  deleting: 'Deleting...',
});

// Extended toast success with message constants
const baseToastSuccessFunc = toastSuccess;
export {baseToastSuccessFunc as _toastSuccess};
Object.assign(toastSuccess, {
  userCreated: 'User created successfully',
  userUpdated: 'User updated successfully',
  userDeleted: 'User deleted successfully',
  statusUpdated: 'Status updated successfully',
});

// Extended toast error with message helpers
const baseToastErrorFunc = toastError;
export {baseToastErrorFunc as _toastError};
Object.assign(toastError, {
  createFailed: (msg: string) => `Failed to create: ${msg}`,
  updateFailed: (msg: string) => `Failed to update: ${msg}`,
  deleteFailed: (msg: string) => `Failed to delete: ${msg}`,
  permissionDenied: 'Permission denied',
  validationFailed: 'Validation failed',
  message: '', // placeholder for error.message access
});

export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

export function dismissAllToasts() {
  toast.dismiss();
}
