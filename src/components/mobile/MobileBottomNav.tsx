import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, LayoutDashboard, FileText, UserCircle, Users, Plus, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/request', icon: Plus, label: 'Request', highlight: true },
    { to: '/team', icon: UserCircle, label: 'Team' },
    ...(user?.role === 'admin' ? [
      { to: '/employees', icon: Users, label: 'Manage' },
      { to: '/logs', icon: Database, label: 'Logs' }
    ] : [])
  ];

  // For admin users, we need to limit to 5 items max for mobile
  const displayItems = user?.role === 'admin' 
    ? navItems.slice(0, 5) // Only show first 5 items for admins
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg md:hidden">
      <div className="flex ios-safe-bottom">
        {displayItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center py-2 px-1 transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.highlight ? (
                  <div className="relative -mt-8 mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg">
                    <item.icon size={24} />
                  </div>
                ) : (
                  <item.icon 
                    size={20} 
                    className={`mb-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} 
                  />
                )}
                <span className={`text-xs ${isActive ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;