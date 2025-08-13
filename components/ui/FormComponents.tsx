import React, { memo } from 'react';

export interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField = memo<FormFieldProps>(({
  label,
  id,
  error,
  required = false,
  className = '',
  children,
}) => (
  <div className={`space-y-1 ${className}`}>
    <label 
      htmlFor={id} 
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
));

FormField.displayName = 'FormField';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = memo<InputProps>(({ error, className = '', ...props }) => (
  <input
    className={`mt-1 block w-full p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
      error 
        ? 'border-red-300 dark:border-red-600' 
        : 'border-gray-300 dark:border-gray-600'
    } ${className}`}
    {...props}
  />
));

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = memo<SelectProps>(({ 
  error, 
  className = '', 
  options, 
  placeholder,
  children,
  ...props 
}) => (
  <select
    className={`mt-1 block w-full p-2 border rounded-md shadow-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
      error 
        ? 'border-red-300 dark:border-red-600' 
        : 'border-gray-300 dark:border-gray-600'
    } ${className}`}
    {...props}
  >
    {placeholder && (
      <option value="">{placeholder}</option>
    )}
    {options.map(option => (
      <option 
        key={option.value} 
        value={option.value}
        disabled={option.disabled}
      >
        {option.label}
      </option>
    ))}
    {children}
  </select>
));

Select.displayName = 'Select';

export interface CheckboxGroupProps {
  options: Array<{ id: string; label: string; checked: boolean }>;
  onChange: (id: string, checked: boolean) => void;
  columns?: 1 | 2 | 3;
  maxHeight?: string;
}

export const CheckboxGroup = memo<CheckboxGroupProps>(({
  options,
  onChange,
  columns = 2,
  maxHeight = '16rem',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div 
      className={`grid ${gridCols[columns]} gap-2 border border-gray-200 dark:border-gray-600 rounded-md p-3 overflow-y-auto`}
      style={{ maxHeight }}
    >
      {options.map(option => (
        <label key={option.id} className="flex items-center">
          <input
            type="checkbox"
            checked={option.checked}
            onChange={(e) => onChange(option.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-blue-600 dark:checked:border-blue-600"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
});

CheckboxGroup.displayName = 'CheckboxGroup';

export interface ModalActionsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  submitButtonStyle?: React.CSSProperties;
}

export const ModalActions = memo<ModalActionsProps>(({
  onCancel,
  onSubmit,
  submitText = 'Salva',
  cancelText = 'Annulla',
  isSubmitting = false,
  submitDisabled = false,
  submitButtonStyle,
}) => (
  <div className="flex justify-end pt-6 space-x-3 border-t border-gray-200 dark:border-gray-600 mt-6">
    <button
      type="button"
      onClick={onCancel}
      className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
      disabled={isSubmitting}
    >
      {cancelText}
    </button>
    {onSubmit && (
      <button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting || submitDisabled}
        className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
        style={submitButtonStyle}
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Caricamento...
          </>
        ) : (
          submitText
        )}
      </button>
    )}
  </div>
));

ModalActions.displayName = 'ModalActions';
