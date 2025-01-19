import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  size = 'md',
  leftAddon,
  rightAddon,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  id,
  ...props
}, ref) => {
  // Generate unique ID for input-label association if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // Define size-specific styles
  const sizeStyles = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  // Base input styles
  const inputBaseStyles = `
    block rounded-md border bg-white px-3 py-2
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${fullWidth ? 'w-full' : 'w-auto'}
    ${sizeStyles[size]}
  `;

  // Wrapper styles for addons/icons
  const wrapperStyles = `
    relative flex items-center
    ${fullWidth ? 'w-full' : 'w-auto'}
  `;

  const renderInput = () => (
    <div className={wrapperStyles}>
      {leftAddon && (
        <div className="inset-y-0 left-0 flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
          {leftAddon}
        </div>
      )}
      {leftIcon && (
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
        className={`
          ${inputBaseStyles}
          ${leftIcon ? 'pl-10' : ''}
          ${rightIcon ? 'pr-10' : ''}
          ${leftAddon ? 'rounded-l-none' : ''}
          ${rightAddon ? 'rounded-r-none' : ''}
          ${className}
        `.trim()}
        {...props}
      />
      {rightIcon && (
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          {rightIcon}
        </div>
      )}
      {rightAddon && (
        <div className="inset-y-0 right-0 flex items-center px-3 border border-l-0 border-gray-300 rounded-r-md bg-gray-50">
          {rightAddon}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : 'w-auto'}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="mb-1.5 text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      {renderInput()}
      {helpText && !error && (
        <p 
          id={`${inputId}-help`}
          className="mt-1.5 text-sm text-gray-500"
        >
          {helpText}
        </p>
      )}
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;