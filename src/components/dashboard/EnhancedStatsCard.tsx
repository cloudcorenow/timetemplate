import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedCard from '../ui/AnimatedCard';

interface EnhancedStatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  delay?: number;
}

const EnhancedStatsCard: React.FC<EnhancedStatsCardProps> = ({ 
  title, 
  value, 
  icon,
  color,
  textColor,
  trend,
  delay = 0
}) => {
  return (
    <AnimatedCard delay={delay} className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`mr-4 flex h-14 w-14 items-center justify-center rounded-xl ${color} shadow-sm`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline">
              <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
              {trend && (
                <div className={`ml-2 flex items-center text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp size={16} className="mr-1" />
                  ) : (
                    <TrendingDown size={16} className="mr-1" />
                  )}
                  <span className="font-medium">{trend.value}%</span>
                </div>
              )}
            </div>
            {trend && (
              <p className="text-xs text-gray-500 mt-1">{trend.label}</p>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default EnhancedStatsCard;