import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonBaseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<ButtonBaseProps> = ({
  children,
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
    md: 'px-4 py-2 text-xs font-semibold rounded-xl min-h-[44px]',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-2xl min-h-[48px]',
  }[size];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 bg-[#A995D8] hover:bg-[#9680C9] active:bg-[#8770BA] text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap shrink-0 ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export const SecondaryButton: React.FC<ButtonBaseProps> = ({
  children,
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
    md: 'px-4 py-2 text-xs font-semibold rounded-xl min-h-[44px]',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-2xl min-h-[48px]',
  }[size];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 bg-[#F4F1FA] hover:bg-[#EBE5F7] dark:bg-[#2C253B] dark:hover:bg-[#372E49] text-[#A995D8] dark:text-[#C5B4EC] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap shrink-0 ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-[#A995D8]/30 border-t-[#A995D8] rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export const OutlinedButton: React.FC<ButtonBaseProps> = ({
  children,
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
    md: 'px-4 py-2 text-xs font-semibold rounded-xl min-h-[44px]',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-2xl min-h-[48px]',
  }[size];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 bg-transparent hover:bg-[#FAF9FC] dark:hover:bg-[#201D27] text-[#34313D] dark:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838] transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap shrink-0 ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-[#898493]/30 border-t-[#898493] rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'ghost' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2.5 min-w-[40px] min-h-[40px]',
    lg: 'w-11 h-11 p-3 min-w-[44px] min-h-[44px]',
  }[size];

  const variantClasses = {
    ghost:
      'text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] hover:bg-[#FAF9FC] dark:hover:bg-[#252230]',
    filled:
      'bg-[#F4F1FA] dark:bg-[#2C253B] text-[#A995D8] hover:bg-[#EBE5F7] dark:hover:bg-[#372E49]',
    outlined:
      'border border-[#EEEAF2] dark:border-[#2D2838] text-[#898493] hover:text-[#34313D] dark:hover:text-[#F4F2F7] bg-white dark:bg-[#201D27] hover:bg-[#FAF9FC]',
  }[variant];

  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-xl transition-all cursor-pointer select-none active:scale-95 shrink-0 ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon: Icon,
  label,
  className = '',
  ...props
}) => {
  return (
    <button
      aria-label={label}
      title={label}
      className={`fixed z-40 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-[#A995D8] hover:bg-[#9680C9] active:scale-90 text-white shadow-[0_8px_24px_rgba(169,149,216,0.35)] flex items-center justify-center transition-all cursor-pointer ${className}`}
      {...props}
    >
      <Icon className="w-6 h-6 stroke-[2.2]" />
    </button>
  );
};
