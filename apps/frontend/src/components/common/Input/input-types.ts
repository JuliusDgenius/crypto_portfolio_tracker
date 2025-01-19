interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    helpText?: string;
    size?: 'sm' | 'md' | 'lg';
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
  }