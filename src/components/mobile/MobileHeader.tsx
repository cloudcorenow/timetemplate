import React, { useState } from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotificationStore } from '../../store/notificationStore';
import NotificationDropdown from '../notifications/NotificationDropdown';
import MobileSearch from './MobileSearch';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            >
              <Menu size={20} />
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-900 truncate">
              TimeOff Manager
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSearch(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            >
              <Search size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
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

            <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-200">
              <img 
                src={user?.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt="User avatar" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      <MobileSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default MobileHeader;