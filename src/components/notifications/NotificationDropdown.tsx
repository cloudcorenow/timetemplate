import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationType } from '../../types/notification';
import { useCapacitor } from '../../hooks/useCapacitor';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isNative } = useCapacitor();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={16} />;
      case 'error':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Info className="text-blue-500" size={16} />;
    }
  };

  if (!isOpen) return null;

  // Mobile-optimized dropdown for native apps or small screens
  if (isNative || window.innerWidth < 768) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
        <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-xl bg-white shadow-xl animate-slide-in-up">
          <div className="border-b border-gray-100 px-4 py-3 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell size={18} className="mr-2 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              </div>
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                Mark all as read
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 56px)' }}>
            {isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-t-blue-600 mb-2"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Bell size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`cursor-pointer px-4 py-4 transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-100 p-4 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-gray-100 py-3 text-center text-sm font-medium text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop dropdown
  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div className="border-b border-gray-100 px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
            disabled={isLoading}
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No notifications
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;