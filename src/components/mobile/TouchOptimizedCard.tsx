import React from 'react';

interface TouchOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  disabled = false
}) => {
  return (
    <div
      className={`
        rounded-xl bg-white shadow-sm transition-all duration-200 
        ${onClick && !disabled ? 'active:scale-98 active:shadow-md cursor-pointer' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={!disabled ? onClick : undefined}
      style={{ 
        minHeight: '44px', // iOS recommended touch target
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {children}
    </div>
  );
};

export default TouchOptimizedCard;