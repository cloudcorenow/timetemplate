import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCapacitor } from '../../hooks/useCapacitor';

// Desktop Layout
import Layout from './Layout';

// Mobile Layout
import MobileLayout from '../mobile/MobileLayout';

const ResponsiveLayout: React.FC = () => {
  const { user } = useAuth();
  const { isNative } = useCapacitor();

  if (!user) return null;

  // Use mobile layout for small screens or native apps
  const isMobile = window.innerWidth < 768 || isNative;

  return (
    <div className="h-screen overflow-hidden">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <MobileLayout />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <Layout />
      </div>
    </div>
  );
};

export default ResponsiveLayout;