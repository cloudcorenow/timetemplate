import React, { useState } from 'react';
import { X, Mail, LogOut, Moon, Sun, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useDarkMode } from '../../hooks/useDarkMode';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ImageUpload from '../ui/ImageUpload';
import EmailPreferences from '../settings/EmailPreferences';
import MobileHelpSupport from './MobileHelpSupport';

interface MobileUserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileUserMenu: React.FC<MobileUserMenuProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;

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

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 dark:bg-opacity-70 md:hidden"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm transform bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Profile</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Profile Section */}
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <ImageUpload
                currentImage={user?.avatar}
                onImageChange={handleAvatarUpdate}
                size="lg"
                disabled={isUpdatingAvatar}
              />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            
            <div className="mt-2 flex items-center space-x-2">
              <Badge 
                variant={user?.role === 'admin' ? 'warning' : user?.role === 'manager' ? 'info' : 'default'} 
                size="sm"
              >
                {user?.role}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">{user?.department}</span>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="space-y-2">
            <button
              onClick={() => setShowEmailSettings(true)}
              className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Mail size={20} className="mr-3 text-gray-500 dark:text-gray-400" />
              Email Preferences
            </button>
            
            <button
              onClick={() => setShowHelpSupport(true)}
              className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HelpCircle size={20} className="mr-3 text-gray-500 dark:text-gray-400" />
              Help & Support
            </button>
            
            {/* Only show dark mode toggle on mobile */}
            {isMobile && (
              <button
                onClick={toggleDarkMode}
                className="flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {darkMode ? (
                  <Sun size={20} className="mr-3 text-amber-500" />
                ) : (
                  <Moon size={20} className="mr-3 text-blue-500" />
                )}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            )}
          </div>
        </div>
        
        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4 ios-safe-bottom">
          <Button
            variant="danger"
            onClick={handleLogout}
            icon={<LogOut size={16} />}
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
      
      {/* Email Settings Modal */}
      {showEmailSettings && (
        <EmailPreferences 
          isOpen={showEmailSettings}
          onClose={() => setShowEmailSettings(false)}
        />
      )}

      {/* Help & Support Modal */}
      {showHelpSupport && (
        <MobileHelpSupport
          isOpen={showHelpSupport}
          onClose={() => setShowHelpSupport(false)}
        />
      )}
    </>
  );
};

export default MobileUserMenu;