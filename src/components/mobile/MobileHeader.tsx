import React, { useState } from 'react';
import { Menu, Bell, Search, User, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationDropdown from '../notifications/NotificationDropdown';
import MobileSearch from './MobileSearch';
import Badge from '../ui/Badge';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  onMenuClick, 
  title, 
  showBackButton = false,
  onBackClick
}) => {
  const { user } = useAuth();
  const { unreadCount } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine title based on current route if not provided
  const getTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/calendar') return 'Calendar';
    if (path === '/request') return 'New Request';
    if (path === '/team') return 'Team Overview';
    if (path === '/employees') return 'Manage Employees';
    
    return 'TimeOff Manager';
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left side */}
          <div className="flex items-center">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
              >
                <ChevronLeft size={20} />
              </button>
            ) : (
              <button
                onClick={onMenuClick}
                className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
              >
                <Menu size={20} />
              </button>
            )}
            <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white truncate">
              {getTitle()}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSearch(true)}
              className="rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
            >
              <Search size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>

            <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
              <img 
                src={user?.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt="User avatar" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* Optional subtitle or badge */}
        {location.pathname === '/' && (
          <div className="px-4 pb-2 -mt-1 flex items-center">
            <Badge variant="info" size="sm">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Employee'}
            </Badge>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{user?.department}</span>
          </div>
        )}
      </header>

      {/* Mobile Search Modal */}
      <MobileSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default MobileHeader;