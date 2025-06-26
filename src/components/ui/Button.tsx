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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300 shadow-sm hover:shadow-md dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800 dark:disabled:opacity-50 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 dark:focus:ring-offset-gray-900',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300 shadow-sm hover:shadow-md dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-green-800 dark:disabled:opacity-50 dark:focus:ring-green-400 dark:focus:ring-offset-gray-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300 shadow-sm hover:shadow-md dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-red-800 dark:disabled:opacity-50 dark:focus:ring-red-400 dark:focus:ring-offset-gray-900',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-gray-400 dark:disabled:text-gray-600 dark:focus:ring-offset-gray-900'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
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