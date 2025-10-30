import React, { useRef } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, useModal, useConfirmModal } from './index';

// Example 1: Basic Modal Usage
export const BasicModalExample: React.FC = () => {
  const { isOpen, open, close } = useModal();

  return (
    <div>
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Basic Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Basic Modal"
      >
        <p>This is a basic modal with default settings.</p>
      </Modal>
    </div>
  );
};

// Example 2: Modal with Different Sizes
export const SizeModalExample: React.FC = () => {
  const smallModal = useModal();
  const mediumModal = useModal();
  const largeModal = useModal();
  const fullModal = useModal();

  return (
    <div className="space-y-4">
      <button onClick={smallModal.open} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
        Small Modal
      </button>
      <button onClick={mediumModal.open} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
        Medium Modal
      </button>
      <button onClick={largeModal.open} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
        Large Modal
      </button>
      <button onClick={fullModal.open} className="px-4 py-2 bg-blue-500 text-white rounded">
        Full Width Modal
      </button>

      <Modal isOpen={smallModal.isOpen} onClose={smallModal.close} size="sm" title="Small Modal">
        <p>This modal has a small size.</p>
      </Modal>

      <Modal isOpen={mediumModal.isOpen} onClose={mediumModal.close} size="md" title="Medium Modal">
        <p>This modal has a medium size.</p>
      </Modal>

      <Modal isOpen={largeModal.isOpen} onClose={largeModal.close} size="lg" title="Large Modal">
        <p>This modal has a large size.</p>
      </Modal>

      <Modal isOpen={fullModal.isOpen} onClose={fullModal.close} size="full" title="Full Modal">
        <p>This modal takes the full width with margins.</p>
      </Modal>
    </div>
  );
};

// Example 3: Modal with Variants
export const VariantModalExample: React.FC = () => {
  const infoModal = useModal();
  const successModal = useModal();
  const warningModal = useModal();
  const dangerModal = useModal();

  return (
    <div className="space-y-4">
      <button onClick={infoModal.open} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
        Info Modal
      </button>
      <button onClick={successModal.open} className="px-4 py-2 bg-green-500 text-white rounded mr-2">
        Success Modal
      </button>
      <button onClick={warningModal.open} className="px-4 py-2 bg-yellow-500 text-white rounded mr-2">
        Warning Modal
      </button>
      <button onClick={dangerModal.open} className="px-4 py-2 bg-red-500 text-white rounded">
        Danger Modal
      </button>

      <Modal isOpen={infoModal.isOpen} onClose={infoModal.close} variant="info" title="Information">
        <p>This is an informational modal.</p>
      </Modal>

      <Modal isOpen={successModal.isOpen} onClose={successModal.close} variant="success" title="Success!">
        <p>Your action was completed successfully!</p>
      </Modal>

      <Modal isOpen={warningModal.isOpen} onClose={warningModal.close} variant="warning" title="Warning">
        <p>Please be careful with this action.</p>
      </Modal>

      <Modal isOpen={dangerModal.isOpen} onClose={dangerModal.close} variant="danger" title="Danger Zone">
        <p>This action cannot be undone!</p>
      </Modal>
    </div>
  );
};

// Example 4: Modal with Header, Body, Footer
export const StructuredModalExample: React.FC = () => {
  const { isOpen, close } = useModal();

  return (
    <div>
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Structured Modal
      </button>

      <Modal isOpen={isOpen} onClose={close} title="User Profile">
        <ModalHeader>User Profile Information</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                placeholder="Enter email"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={close}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={close}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// Example 5: Focus Management
export const FocusModalExample: React.FC = () => {
  const { isOpen, open, close } = useModal();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Modal with Focus
      </button>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Focus Management"
        initialFocusRef={inputRef}
      >
        <p>This modal will focus the input field when opened.</p>
        <input
          ref={inputRef}
          type="text"
          className="mt-4 w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="This will be focused first"
        />
        <p className="mt-4 text-sm text-gray-500">
          Try pressing Tab to cycle through elements, or Esc to close.
        </p>
      </Modal>
    </div>
  );
};

// Example 6: Prevent Close Modal
export const PreventCloseModalExample: React.FC = () => {
  const { isOpen, open, close } = useModal();

  return (
    <div>
      <button
        onClick={open}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Open Modal (Can't Close)
      </button>

      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Persistent Modal"
        preventClose={true}
        footer={
          <>
            <button
              onClick={close}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </>
        }
      >
        <p>This modal cannot be closed by clicking outside or pressing Esc.</p>
        <p className="text-sm text-gray-500 mt-2">
          Only the button in the footer can close it.
        </p>
      </Modal>
    </div>
  );
};

// Example 7: Confirm Modal Hook
export const ConfirmModalExample: React.FC = () => {
  const { state, confirm, cancel } = useConfirmModal();

  const handleDelete = () => {
    confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        console.log('Item deleted!');
      },
      onCancel: () => {
        console.log('Delete cancelled');
      },
    });
  };

  return (
    <div>
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Delete Item
      </button>

      <Modal
        isOpen={state.isOpen}
        onClose={cancel}
        variant={state.variant}
        title={state.title}
      >
        <p>{state.message}</p>
        <ModalFooter>
          <button
            onClick={cancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            {state.cancelText}
          </button>
          <button
            onClick={() => {
              state.onConfirm?.();
              cancel();
            }}
            className={`px-4 py-2 text-white rounded ${
              state.variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {state.confirmText}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// Example 8: Multiple Modals
export const MultipleModalsExample: React.FC = () => {
  const {
    modals,
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    closeAll,
  } = useMultipleModals({
    modal1: false,
    modal2: false,
    modal3: false,
  });

  return (
    <div className="space-x-2">
      <button
        onClick={() => openModal('modal1')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open Modal 1
      </button>
      <button
        onClick={() => openModal('modal2')}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Open Modal 2
      </button>
      <button
        onClick={() => toggleModal('modal3')}
        className="px-4 py-2 bg-yellow-500 text-white rounded"
      >
        Toggle Modal 3
      </button>
      <button
        onClick={closeAll}
        className="px-4 py-2 bg-gray-500 text-white rounded"
      >
        Close All
      </button>

      <Modal
        isOpen={isModalOpen('modal1')}
        onClose={() => closeModal('modal1')}
        title="Modal 1"
      >
        <p>This is the first modal.</p>
      </Modal>

      <Modal
        isOpen={isModalOpen('modal2')}
        onClose={() => closeModal('modal2')}
        title="Modal 2"
      >
        <p>This is the second modal.</p>
      </Modal>

      <Modal
        isOpen={isModalOpen('modal3')}
        onClose={() => closeModal('modal3')}
        title="Modal 3"
      >
        <p>This is the third modal. You can toggle it.</p>
      </Modal>
    </div>
  );
};

// Main Example Component
export const ModalExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-12">
      <h1 className="text-3xl font-bold">Modal Component Examples</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Basic Usage</h2>
        <BasicModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Different Sizes</h2>
        <SizeModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Modal Variants</h2>
        <VariantModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Structured Modal</h2>
        <StructuredModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Focus Management</h2>
        <FocusModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Prevent Close</h2>
        <PreventCloseModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Confirm Modal</h2>
        <ConfirmModalExample />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Multiple Modals</h2>
        <MultipleModalsExample />
      </section>
    </div>
  );
};

export default ModalExamples;
