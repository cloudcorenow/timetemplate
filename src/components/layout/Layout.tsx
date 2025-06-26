import React from 'react';
import { Outlet } from 'react-router-dom';
import EnhancedHeader from './EnhancedHeader';
import Sidebar from './Sidebar';
import CacheDebugPanel from '../debug/CacheDebugPanel';
import { useAuth } from '../../context/AuthContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-800 bg-opacity-50 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <EnhancedHeader openSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 px-4 py-8 md:px-6 lg:px-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Cache Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && <CacheDebugPanel />}
    </div>
  );
};

export default Layout;