import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, LayoutDashboard, FileText, UserCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/request', icon: FileText, label: 'Request' },
    { to: '/team', icon: UserCircle, label: 'Team' },
    ...(user?.role === 'admin' ? [{ to: '/employees', icon: Users, label: 'Manage' }] : [])
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center py-2 px-1 text-xs transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  className={`mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} 
                />
                <span className={`truncate ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
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