import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed relative z-10';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300 shadow-sm hover:shadow-md mobile-button-visible',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:disabled:bg-gray-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300 shadow-sm hover:shadow-md',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400 dark:text-gray-300 dark:hover:bg-gray-800'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Ensure mobile visibility for primary buttons
  const mobileVisibilityClass = variant === 'primary' ? 'mobile-button-visible' : '';

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${mobileVisibilityClass} ${className}`}
      disabled={disabled || loading}
      style={{
        // Force visibility on mobile
        minHeight: size === 'lg' ? '48px' : size === 'md' ? '44px' : '36px',
        zIndex: 9999,
        position: 'relative'
      }}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color={variant === 'secondary' || variant === 'ghost' ? 'gray' : 'white'} className="mr-2" />
          {children}
        </>
      ) : (
        <>
          {icon && (
            <span className={`${iconSizes[size]} mr-2`}>
              {icon}
            </span>
          )}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;