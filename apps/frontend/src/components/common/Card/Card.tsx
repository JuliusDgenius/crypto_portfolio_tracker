import React from 'react';

// Create the main Card component
const Card: CardComponent = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'normal'
}) => {
  const baseStyles = 'bg-white rounded-lg border border-gray-200 shadow-sm';
  const hoverStyles = hoverable ? 'transition-shadow hover:shadow-md cursor-pointer' : '';
  const paddingStyles = {
    none: '',
    small: 'p-3',
    normal: 'p-4',
    large: 'p-6'
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${hoverStyles}
        ${paddingStyles[padding]}
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Define sub-components
const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`.trim()}>
    {children}
  </div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`.trim()}>
    {children}
  </h3>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`mt-4 ${className}`.trim()}>
    {children}
  </div>
);

// Assign sub-components to the main component
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;