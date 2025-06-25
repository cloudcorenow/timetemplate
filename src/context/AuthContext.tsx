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
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
      // Verify token with backend
      apiService.getCurrentUser()
        .then(response => {
          setUser(response.user);
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          apiService.logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    apiService.logout();
  };

  const updateAvatar = async (avatarUrl: string) => {
    try {
      await apiService.updateAvatar(avatarUrl);
      if (user) {
        setUser({ ...user, avatar: avatarUrl });
      }
    } catch (error) {
      console.error('Avatar update error:', error);
      throw error;
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