import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Universal, accessible Portal Modal component.
 * - Renders directly to document.body via createPortal to eliminate parent transform/filter containing block issues.
 * - Ensures perfect viewport centering on desktop without clipping top headers on tall forms.
 * - Renders as a smooth bottom-sheet on mobile devices.
 * - Locks body scroll when open and handles outside clicks and Escape key.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = ''
}) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar bg-slate-950/80 backdrop-blur-sm modal-overlay flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full flex items-end sm:items-center justify-center p-0 sm:py-6 my-auto">
        <div
          className={`w-full ${maxWidth} rounded-t-3xl sm:rounded-2xl glass-modal p-5 sm:p-6 shadow-2xl relative modal-sheet max-h-[92vh] sm:max-h-[88vh] overflow-y-auto custom-scrollbar border border-slate-800 flex flex-col text-left ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
