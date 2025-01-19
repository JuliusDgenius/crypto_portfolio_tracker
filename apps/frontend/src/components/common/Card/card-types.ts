interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
    padding?: 'none' | 'small' | 'normal' | 'large';
  }
  
  interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
  }
  
  interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
  }
  
  interface CardContentProps {
    children: React.ReactNode;
    className?: string;
  }
  
  interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
  }
  
  // Define the compound component type
  interface CardComponent extends React.FC<CardProps> {
    Header: React.FC<CardHeaderProps>;
    Title: React.FC<CardTitleProps>;
    Content: React.FC<CardContentProps>;
    Footer: React.FC<CardFooterProps>;
  }