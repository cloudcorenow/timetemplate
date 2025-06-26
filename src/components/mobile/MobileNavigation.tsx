import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, LayoutDashboard, FileText, UserCircle, Users, X, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

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
        fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <img 
                src={user?.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                alt="User avatar" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-4">
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
        </nav>
      </div>
    </>
  );
};

export default MobileNavigation;