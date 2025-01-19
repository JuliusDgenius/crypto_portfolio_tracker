import React from 'react';

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'primary',
  fullPage = false,
  text,
  className = ''
}) => {
  // Size configurations for the spinner
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Color configurations for different variants
  const variantStyles = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  // Combine classes for the wrapper
  const wrapperStyles = `
    flex flex-col items-center justify-center
    ${fullPage ? 'fixed inset-0 bg-white bg-opacity-90 z-50' : ''}
    ${className}
  `;

  return (
    <div className={wrapperStyles} role="status">
      <svg
        className={`
          animate-spin
          ${sizeStyles[size]}
          ${variantStyles[variant]}
        `.trim()}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && (
        <p className={`
          mt-4 text-center font-medium
          ${variant === 'white' ? 'text-white' : 'text-gray-900'}
        `}>
          {text}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Create a specialized full-page loading component for convenience
export const FullPageLoading: React.FC<Omit<LoadingProps, 'fullPage'>> = (props) => (
  <Loading {...props} fullPage />
);

export default Loading;