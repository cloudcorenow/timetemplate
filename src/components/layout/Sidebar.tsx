import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, LayoutDashboard, FileText, X, UserCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const { user, isManager, isAdmin } = useAuth();

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-blue-700 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-blue-800 px-6">
        <h2 className="text-xl font-bold text-white">TimeOff App</h2>
        <button 
          onClick={closeSidebar}
          className="rounded-md p-1 text-blue-200 hover:bg-blue-800 md:hidden"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="my-6 flex items-center gap-4 px-6">
        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-blue-400">
          <img 
            src={user?.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
            alt="User avatar" 
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium text-white">{user?.name}</p>
          <p className="text-sm text-blue-200">{user?.role}</p>
        </div>
      </div>
      
      <nav className="mt-6 space-y-1 px-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center rounded-md px-4 py-2 text-base font-medium transition-colors duration-150 ${
              isActive 
                ? 'bg-blue-800 text-white' 
                : 'text-blue-100 hover:bg-blue-600'
            }`
          }
          onClick={() => closeSidebar()}
        >
          <LayoutDashboard size={20} className="mr-3" />
          Dashboard
        </NavLink>
        
        <NavLink 
          to="/calendar" 
          className={({ isActive }) => 
            `flex items-center rounded-md px-4 py-2 text-base font-medium transition-colors duration-150 ${
              isActive 
                ? 'bg-blue-800 text-white' 
                : 'text-blue-100 hover:bg-blue-600'
            }`
          }
          onClick={() => closeSidebar()}
        >
          <Calendar size={20} className="mr-3" />
          Calendar
        </NavLink>
        
        <NavLink 
          to="/request" 
          className={({ isActive }) => 
            `flex items-center rounded-md px-4 py-2 text-base font-medium transition-colors duration-150 ${
              isActive 
                ? 'bg-blue-800 text-white' 
                : 'text-blue-100 hover:bg-blue-600'
            }`
          }
          onClick={() => closeSidebar()}
        >
          <FileText size={20} className="mr-3" />
          New Request
        </NavLink>

        {(isManager || isAdmin) && (
          <div className="pt-5">
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Manager Controls
            </p>
            <NavLink 
              to="/team" 
              className={({ isActive }) => 
                `flex items-center rounded-md px-4 py-2 text-base font-medium transition-colors duration-150 ${
                  isActive 
                    ? 'bg-blue-800 text-white' 
                    : 'text-blue-100 hover:bg-blue-600'
                }`
              }
              onClick={() => closeSidebar()}
            >
              <UserCircle size={20} className="mr-3" />
              Team Overview
            </NavLink>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="pt-5">
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-blue-300">
              Admin Controls
            </p>
            <NavLink 
              to="/employees" 
              className={({ isActive }) => 
                `flex items-center rounded-md px-4 py-2 text-base font-medium transition-colors duration-150 ${
                  isActive 
                    ? 'bg-blue-800 text-white' 
                    : 'text-blue-100 hover:bg-blue-600'
                }`
              }
              onClick={() => closeSidebar()}
            >
              <Users size={20} className="mr-3" />
              Manage Employees
            </NavLink>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;