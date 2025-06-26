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
        
        // Verify token is still valid by fetching current user
        apiService.getCurrentUser()
          .then(response => {
            if (response && response.user) {
              setUser(response.user);
              localStorage.setItem('currentUser', JSON.stringify(response.user));
            } else {
              // Invalid response, clear storage
              localStorage.removeItem('currentUser');
              localStorage.removeItem('token');
              setUser(null);
              apiService.logout();
            }
          })
          .catch(() => {
            // Token is invalid, clear storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            setUser(null);
            apiService.logout();
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      if (response && response.user) {
        setUser(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        return true;
      }
      return false;
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
      try {
        await apiService.updateAvatar(avatarUrl);
        const updatedUser = { ...user, avatar: avatarUrl };
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update avatar:', error);
        throw error;
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