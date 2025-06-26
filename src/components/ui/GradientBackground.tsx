import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'blue' | 'purple' | 'green' | 'orange';
  className?: string;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  variant = 'blue',
  className = '' 
}) => {
  const gradients = {
    blue: 'bg-gradient-to-br from-blue-50 via-white to-blue-100',
    purple: 'bg-gradient-to-br from-purple-50 via-white to-purple-100',
    green: 'bg-gradient-to-br from-green-50 via-white to-green-100',
    orange: 'bg-gradient-to-br from-orange-50 via-white to-orange-100'
  };

  return (
    <div className={`${gradients[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default GradientBackground;