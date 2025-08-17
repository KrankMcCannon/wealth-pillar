import React, { memo, useCallback, useEffect } from "react";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  error?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

/**
 * Componente base per tutte le modali
 */
export const BaseModal = memo<BaseModalProps>(
  ({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "lg",
    error,
    showCloseButton = true,
    closeOnBackdropClick = true,
  }) => {
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpen) {
          onClose();
        }
      },
      [isOpen, onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }, [isOpen, handleKeyDown]);

    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      },
      [onClose, closeOnBackdropClick]
    );

    const handleContentClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] transition-opacity p-2 sm:p-4"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-lg shadow-xl p-4 sm:p-6 w-full ${maxWidthClasses[maxWidth]} max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all`}
          onClick={handleContentClick}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white pr-4">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 -m-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Chiudi modale"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </div>
    );
  }
);

BaseModal.displayName = "BaseModal";
