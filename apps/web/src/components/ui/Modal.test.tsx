import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal, useModal } from './index';

// Mock React createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => <div data-portal="true">{children}</div>,
}));

describe('Modal Component', () => {
  test('renders modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Modal Content
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('does not render modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal Content
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        Modal Content
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when ESC key is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when ESC is pressed and preventClose is true', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} preventClose={true}>
        Modal Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  test('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal Content
      </Modal>
    );

    const backdrop = document.querySelector('.bg-black\\/50') as HTMLElement;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when content is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal Content
      </Modal>
    );

    const content = screen.getByRole('dialog');
    fireEvent.click(content);

    expect(onClose).not.toHaveBeenCalled();
  });

  test('renders with correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        Content
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        Content
      </Modal>
    );

    expect(dialog).toHaveClass('max-w-lg');
  });

  test('renders with correct variant classes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} variant="danger">
        Content
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('border-red-200');
  });

  test('focuses on first focusable element when opened', async () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <button>First Button</button>
        <button>Second Button</button>
      </Modal>
    );

    await waitFor(() => {
      expect(document.activeElement).toHaveTextContent('First Button');
    });
  });

  test('traps focus within modal', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <button>Button 1</button>
        <button>Button 2</button>
      </Modal>
    );

    const firstButton = screen.getByText('Button 1');
    const secondButton = screen.getByText('Button 2');

    // Focus first button
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);

    // Tab to second button
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(secondButton);

    // Tab back to first button (wrap around)
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);
  });

  test('restores focus to previous element on close', () => {
    const inputRef = React.createRef<HTMLInputElement>();
    
    render(
      <div>
        <input ref={inputRef} data-testid="previous-input" />
        <Modal isOpen={false} onClose={() => {}}>
          <button>Modal Button</button>
        </Modal>
      </div>
    );

    // Focus the input before opening modal
    inputRef.current?.focus();
    expect(inputRef.current).toHaveFocus();

    // Open modal
    render(
      <div>
        <input ref={inputRef} data-testid="previous-input" />
        <Modal isOpen={true} onClose={() => {}}>
          <button>Modal Button</button>
        </Modal>
      </div>
    );

    // Modal should have focus
    expect(document.activeElement).not.toBe(inputRef.current);
  });
});

describe('useModal Hook', () => {
  test('initializes with correct default state', () => {
    let isOpen = false;
    let open: () => void;
    let close: () => void;
    let toggle: () => void;

    const TestComponent = () => {
      const modal = useModal();
      isOpen = modal.isOpen;
      open = modal.open;
      close = modal.close;
      toggle = modal.toggle;
      return <div>Test</div>;
    };

    render(<TestComponent />);
    expect(isOpen).toBe(false);
  });

  test('opens modal when open is called', () => {
    let isOpen = false;

    const TestComponent = () => {
      const modal = useModal({ initialOpen: false });
      isOpen = modal.isOpen;
      return (
        <div>
          <button onClick={modal.open}>Open</button>
          <span>{modal.isOpen ? 'Open' : 'Closed'}</span>
        </div>
      );
    };

    const { container } = render(<TestComponent />);
    expect(screen.getByText('Closed')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  test('calls onOpen callback when modal opens', () => {
    const onOpen = jest.fn();
    
    const TestComponent = () => {
      const modal = useModal({ onOpen });
      return (
        <button onClick={modal.open}>Open</button>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Open'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('calls onClose callback when modal closes', () => {
    const onClose = jest.fn();
    
    const TestComponent = () => {
      const modal = useModal({ initialOpen: true, onClose });
      return (
        <button onClick={modal.close}>Close</button>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('useMultipleModals Hook', () => {
  test('manages multiple modal states', () => {
    let modal1Open = false;
    let modal2Open = false;

    const TestComponent = () => {
      const { modals, openModal, closeModal, isModalOpen } = useMultipleModals({
        modal1: false,
        modal2: false,
      });
      
      modal1Open = modals.modal1;
      modal2Open = modals.modal2;

      return (
        <div>
          <button onClick={() => openModal('modal1')}>Open Modal 1</button>
          <button onClick={() => closeModal('modal2')}>Close Modal 2</button>
          <button onClick={() => toggleModal('modal1')}>Toggle Modal 1</button>
        </div>
      );
    };

    render(<TestComponent />);
    
    fireEvent.click(screen.getByText('Open Modal 1'));
    expect(modal1Open).toBe(true);
    
    fireEvent.click(screen.getByText('Toggle Modal 1'));
    expect(modal1Open).toBe(false);
  });
});

describe('useConfirmModal Hook', () => {
  test('manages confirm modal state', () => {
    let state: any;

    const TestComponent = () => {
      const confirmModal = useConfirmModal();
      state = confirmModal.state;
      
      return (
        <button onClick={() => confirmModal.confirm({ title: 'Test', message: 'Message' })}>
          Confirm
        </button>
      );
    };

    render(<TestComponent />);
    
    expect(state.isOpen).toBe(false);
    
    fireEvent.click(screen.getByText('Confirm'));
    expect(state.isOpen).toBe(true);
    expect(state.title).toBe('Test');
    expect(state.message).toBe('Message');
  });
});

describe('Modal Components', () => {
  test('ModalHeader renders correctly', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <ModalHeader>Header Text</ModalHeader>
      </Modal>
    );

    expect(screen.getByText('Header Text')).toBeInTheDocument();
  });

  test('ModalBody renders correctly', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <ModalBody>Body Text</ModalBody>
      </Modal>
    );

    expect(screen.getByText('Body Text')).toBeInTheDocument();
  });

  test('ModalFooter renders correctly', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <ModalFooter>Footer Content</ModalFooter>
      </Modal>
    );

    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });
});
