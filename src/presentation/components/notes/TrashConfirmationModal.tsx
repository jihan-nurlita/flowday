import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { SecondaryButton } from '../buttons/AppButtons';

interface TrashConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const TrashConfirmationModal: React.FC<TrashConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete Permanently',
  isDanger = true,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#201D27] rounded-3xl border border-[#EEEAF2] dark:border-[#2D2838] shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FCF3F0] dark:bg-[#381E19] flex items-center justify-center text-[#E07A5F] shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">
              {title}
            </h3>
            <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#898493] hover:text-[#34313D] p-1 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEEAF2] dark:border-[#2D2838]">
          <SecondaryButton size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </SecondaryButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 ${
              isDanger
                ? 'bg-[#E07A5F] hover:bg-[#D0694E]'
                : 'bg-[#A995D8] hover:bg-[#9680C9]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
