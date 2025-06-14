import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  textColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon,
  color,
  textColor 
}) => {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow transition-all duration-300 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`mr-4 flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`text-2xl font-semibold ${textColor}`}>{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;