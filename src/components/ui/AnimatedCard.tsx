import React from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = '', 
  delay = 0,
  hover = true 
}) => {
  return (
    <div
      className={`
        animate-fade-in rounded-lg bg-white shadow-sm transition-all duration-300
        ${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''}
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;