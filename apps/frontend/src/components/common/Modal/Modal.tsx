import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const Modal: React.FC<ModalProps> & {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
} = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  initialFocus,
  className = ''
}) => {
  // Handle ESC key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEsc) {
      onClose();
    }
  }, [closeOnEsc, onClose]);

  // Handle click outside modal
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // Set up event listeners and handle body scroll
  useEffect(() => {
    if (isOpen) {
      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal or specified element
      if (initialFocus?.current) {
        initialFocus.current.focus();
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, handleKeyDown, initialFocus]);

  // Size styles for the modal
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className={`
          relative z-50 w-full
          ${sizeStyles[size]}
          ${className}
        `.trim()}
      >
        <div className="relative rounded-lg bg-white shadow-xl">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Modal sub-components
interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className = '',
  onClose
}) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`.trim()}>
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">
        {children}
      </h3>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

const ModalBody: React.FC<ModalBodyProps> = ({
  children,
  className = ''
}) => (
  <div className={`px-6 py-4 ${className}`.trim()}>
    {children}
  </div>
);

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = ''
}) => (
  <div className={`
    px-6 py-4 border-t border-gray-200
    flex items-center justify-end space-x-3
    ${className}
  `.trim()}>
    {children}
  </div>
);

// Assign sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;