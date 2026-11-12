import React from 'react';
import { Search, Calendar, Clock, ChevronDown } from 'lucide-react';

interface CustomTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const CustomTextField: React.FC<CustomTextFieldProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF9FC] dark:bg-[#17151D] text-[#34313D] dark:text-[#F4F2F7] border rounded-xl focus:outline-none transition-colors min-h-[44px] ${
          error
            ? 'border-[#E07A5F] focus:border-[#E07A5F]'
            : 'border-[#EEEAF2] dark:border-[#2D2838] focus:border-[#A995D8] dark:focus:border-[#A995D8]'
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-[11px] text-[#E07A5F] mt-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#898493] dark:text-[#9E99A8] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#898493] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-[#201D27] text-[#34313D] dark:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors min-h-[40px]"
        {...props}
      />
    </div>
  );
};

interface DatePickerFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="date"
          className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF9FC] dark:bg-[#17151D] text-[#34313D] dark:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors min-h-[44px] ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

interface TimePickerFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TimePickerField: React.FC<TimePickerFieldProps> = ({
  label,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="time"
        className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF9FC] dark:bg-[#17151D] text-[#34313D] dark:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors min-h-[44px] ${className}`}
        {...props}
      />
    </div>
  );
};

interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface DropdownFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: DropdownOption[];
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  options,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#898493] dark:text-[#9E99A8] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full px-3.5 py-2.5 pr-8 text-xs sm:text-sm bg-[#FAF9FC] dark:bg-[#17151D] text-[#34313D] dark:text-[#F4F2F7] border border-[#EEEAF2] dark:border-[#2D2838] rounded-xl focus:outline-none focus:border-[#A995D8] transition-colors min-h-[44px] appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-[#898493] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
};
