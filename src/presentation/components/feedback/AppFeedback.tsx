import React from 'react';
import { LucideIcon, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../buttons/AppButtons';

export const LoadingIndicator: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading...',
  size = 'md',
}) => {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 text-center">
      <div
        className={`${sizeClass} border-[#A995D8]/20 border-t-[#A995D8] rounded-full animate-spin`}
      />
      {message && <p className="text-xs font-medium text-[#898493] dark:text-[#9E99A8]">{message}</p>}
    </div>
  );
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = '#A995D8',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-sm mx-auto">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 shadow-xs"
        style={{ backgroundColor: `${iconColor}18` }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-[#34313D] dark:text-[#F4F2F7]">
        {title}
      </h3>
      <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <PrimaryButton onClick={onAction} size="sm">
            {actionLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[#FCF3F0] dark:bg-[#322020] border border-[#E07A5F]/20 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6">
      <AlertCircle className="w-8 h-8 text-[#E07A5F] mb-2" />
      <h4 className="text-sm font-bold text-[#E07A5F]">{title}</h4>
      <p className="text-xs text-[#34313D] dark:text-[#F4F2F7] mt-1 mb-3">{message}</p>
      {onRetry && (
        <PrimaryButton onClick={onRetry} size="sm" className="bg-[#E07A5F] hover:bg-[#D06B50]">
          Try Again
        </PrimaryButton>
      )}
    </div>
  );
};

export const SuccessFeedback: React.FC<{ message: string; onDismiss?: () => void }> = ({
  message,
  onDismiss,
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F2F8F5] dark:bg-[#1C3127] border border-[#B5DCCB]/40 text-xs text-[#34313D] dark:text-[#F4F2F7] shadow-xs">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-[#B5DCCB] shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-[#898493] hover:text-[#34313D] dark:hover:text-white rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34313D]/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white dark:bg-[#201D27] rounded-2xl border border-[#EEEAF2] dark:border-[#2D2838] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-base font-bold text-[#34313D] dark:text-[#F4F2F7]">{title}</h3>
        <p className="text-xs text-[#898493] dark:text-[#9E99A8] mt-2 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 mt-6">
          <SecondaryButton onClick={onCancel} size="sm">
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            onClick={onConfirm}
            size="sm"
            className={isDestructive ? 'bg-[#E07A5F] hover:bg-[#D06B50]' : ''}
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export interface ToastItem {
  id: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export const SnackbarContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: CheckCircle2,
          info: Info,
          warning: AlertCircle,
          error: AlertCircle,
        }[toast.type || 'info'];

        const colorClasses = {
          success: 'bg-[#F2F8F5] dark:bg-[#1C3127] border-[#B5DCCB] text-[#34313D] dark:text-[#F4F2F7]',
          info: 'bg-[#F4F1FA] dark:bg-[#2C253B] border-[#A995D8] text-[#34313D] dark:text-[#F4F2F7]',
          warning: 'bg-[#FDF8EC] dark:bg-[#342C1D] border-[#E9C46A] text-[#34313D] dark:text-[#F4F2F7]',
          error: 'bg-[#FCF3F0] dark:bg-[#342020] border-[#E07A5F] text-[#34313D] dark:text-[#F4F2F7]',
        }[toast.type || 'info'];

        const IconComponent = iconMap;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3 rounded-xl border shadow-lg text-xs transition-all animate-in slide-in-from-bottom-2 ${colorClasses}`}
          >
            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:opacity-75 transition-opacity ml-2 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
