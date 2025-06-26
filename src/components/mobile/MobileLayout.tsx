import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileHeader from './MobileHeader';
import MobileNavigation from './MobileNavigation';
import MobileBottomNav from './MobileBottomNav';

const MobileLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen flex-col bg-gray-50 md:hidden">
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Mobile Navigation Drawer */}
      <MobileNavigation 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
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