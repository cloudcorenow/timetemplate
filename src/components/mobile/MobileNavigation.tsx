import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, LayoutDashboard, FileText, UserCircle, Users, X, Menu, Settings, LogOut, Bell, HelpCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileClick: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  isOpen, 
  onClose,
  onProfileClick
}) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/request', icon: FileText, label: 'New Request' },
    { to: '/team', icon: UserCircle, label: 'Team Overview' },
    ...(user?.role === 'admin' ? [{ to: '/employees', icon: Users, label: 'Manage Employees' }] : [])
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="text-lg font-semibold text-gray-900">TimeOff Manager</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="border-b border-gray-200 p-4">
          <button 
            className="flex w-full items-center rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200"
            onClick={onProfileClick}
          >
            <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-gray-200 shadow-sm">
              <img 
                src={user?.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt="User avatar" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="ml-3 text-left">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <div className="flex items-center">
                <Badge 
                  variant={user?.role === 'admin' ? 'warning' : user?.role === 'manager' ? 'info' : 'default'} 
                  size="sm"
                >
                  {user?.role}
                </Badge>
                <span className="ml-2 text-xs text-gray-500">{user?.department}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={20} className="mr-3" />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Settings
            </h3>
            <div className="mt-3 space-y-1">
              <button className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
                <Settings size={20} className="mr-3 text-gray-500" />
                Settings
              </button>
              <button className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
                <HelpCircle size={20} className="mr-3 text-gray-500" />
                Help & Support
              </button>
              <button className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
                <Moon size={20} className="mr-3 text-gray-500" />
                Dark Mode
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={logout}
            className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;