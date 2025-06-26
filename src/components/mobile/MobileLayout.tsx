import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileHeader from './MobileHeader';
import MobileNavigation from './MobileNavigation';
import MobileBottomNav from './MobileBottomNav';
import MobileUserMenu from './MobileUserMenu';

const MobileLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Determine if we should show back button based on route
  const showBackButton = location.pathname !== '/' && 
                        location.pathname !== '/calendar' && 
                        location.pathname !== '/team';

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:hidden">
      {/* Mobile Header */}
      <MobileHeader 
        onMenuClick={() => setSidebarOpen(true)} 
        showBackButton={showBackButton}
      />

      {/* Mobile Navigation Drawer */}
      <MobileNavigation 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onProfileClick={() => {
          setSidebarOpen(false);
          setUserMenuOpen(true);
        }}
      />

      {/* User Profile Menu */}
      <MobileUserMenu
        isOpen={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 px-4 py-4">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileLayout;