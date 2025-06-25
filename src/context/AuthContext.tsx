import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types/user';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isManager: boolean;
  isAdmin: boolean;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => Promise.resolve(false),
  logout: () => {},
  isAuthenticated: false,
  isManager: false,
  isAdmin: false,
  updateAvatar: () => Promise.resolve()
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        apiService.setToken(token);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, we'll use mock authentication since the backend might not be running
      const mockUsers = [
        {
          id: '1',
          name: 'Juan Carranza',
          email: 'employee@example.com',
          role: 'employee' as const,
          department: 'Engineering',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '2',
          name: 'Ana Ramirez',
          email: 'manager@example.com',
          role: 'manager' as const,
          department: 'Engineering',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '5',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin' as const,
          department: 'IT',
          avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        }
      ];

      // Find user in mock data
      const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        console.log('User not found for email:', email);
        return false;
      }

      // For demo purposes, accept 'password' as the password for all users
      if (password !== 'password') {
        console.log('Invalid password. Use "password" for demo accounts.');
        return false;
      }

      // Create a mock token for demo purposes
      const mockToken = `demo-token-${foundUser.id}-${Date.now()}`;
      
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      localStorage.setItem('token', mockToken);
      apiService.setToken(mockToken);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    apiService.logout();
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Try to update via API, but don't fail if backend is not available
      try {
        await apiService.updateAvatar(avatarUrl);
      } catch (error) {
        console.log('Backend not available, avatar updated locally only');
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isManager: user?.role === 'manager',
    isAdmin: user?.role === 'admin',
    updateAvatar
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};