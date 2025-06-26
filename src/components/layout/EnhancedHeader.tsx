import React, { useState, useEffect } from 'react';
import { Menu, Bell, LogOut, Upload, Settings, Mail, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import { useToast } from '../../hooks/useToast';
import NotificationDropdown from '../notifications/NotificationDropdown';
import EmailPreferences from '../settings/EmailPreferences';
import ImageUpload from '../ui/ImageUpload';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface EnhancedHeaderProps {
  openSidebar: () => void;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({ openSidebar }) => {
  const { user, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  // Fetch unread count on component mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    addToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been successfully logged out.'
    });
  };

  const handleAvatarUpdate = async (imageData: string | null) => {
    if (!imageData) return;
    
    setIsUpdatingAvatar(true);
    try {
      await updateAvatar(imageData);
      setShowAvatarModal(false);
      setShowDropdown(false);
      addToast({
        type: 'success',
        title: 'Avatar Updated',
        message: 'Your profile picture has been updated successfully.'
      });
    } catch (error) {
      console.error('Failed to update avatar:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update your avatar. Please try again.'
      });
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      addToast({
        type: 'info',
        title: 'Search',
        message: `Searching for "${searchQuery}"...`
      });
    }
  };

  return (
    <header className="z-20 border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <button 
            onClick={openSidebar}
            className="mr-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center">
            <h1 className="text-xl font-bold gradient-text">TimeOff Manager</h1>
            <Badge variant="info" size="sm" className="ml-3 hidden sm:inline-flex">
              v2.0
            </Badge>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests, employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </form>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown 
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 rounded-lg p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-gray-200 shadow-sm">
                <img 
                  src={user?.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                  alt="User avatar" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </button>
            
            {showDropdown && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-lg bg-white py-2 shadow-lg ring-1 ring-black ring-opacity-5 animate-scale-in"
                onBlur={() => setShowDropdown(false)}
              >
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <Badge variant="info" size="sm" className="mt-1">
                    {user?.department}
                  </Badge>
                </div>
                
                <button
                  onClick={() => {
                    setShowAvatarModal(true);
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Upload size={16} className="mr-3 text-gray-400" />
                  Change Avatar
                </button>
                
                <button
                  onClick={() => {
                    setShowEmailSettings(true);
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Mail size={16} className="mr-3 text-gray-400" />
                  Email Settings
                </button>
                
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Update Modal - Better positioning */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in p-4">
          <div 
            className="w-full max-w-md rounded-xl bg-white shadow-xl animate-scale-in"
            style={{
              maxHeight: 'calc(100vh - 8rem)', // Leave space from top and bottom
              marginTop: '2rem',
              marginBottom: '2rem'
            }}
          >
            <div className="p-6">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">Update Profile Picture</h2>
              
              <div className="flex flex-col items-center space-y-6">
                <ImageUpload
                  currentImage={user?.avatar}
                  onImageChange={handleAvatarUpdate}
                  size="lg"
                  disabled={isUpdatingAvatar}
                />
                
                {isUpdatingAvatar && (
                  <p className="text-sm text-blue-600">Updating your profile picture...</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={isUpdatingAvatar}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings Modal */}
      {showEmailSettings && (
        <EmailPreferences 
          isOpen={showEmailSettings}
          onClose={() => setShowEmailSettings(false)}
        />
      )}
    </header>
  );
};

export default EnhancedHeader;