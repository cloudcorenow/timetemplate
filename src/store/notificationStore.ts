import { create } from 'zustand';
import { Notification } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      // For demo purposes, use localStorage since backend might not be available
      const savedNotifications = localStorage.getItem('timeoff_notifications');
      const notifications = savedNotifications ? JSON.parse(savedNotifications) : [
        {
          id: 'notif1',
          type: 'success',
          message: 'Welcome to TimeOff Manager! Your demo account is ready.',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];
      
      // Transform dates
      const transformedNotifications = notifications.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));
      
      set({ 
        notifications: transformedNotifications,
        unreadCount: transformedNotifications.filter((n: Notification) => !n.read).length,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const notifications = get().notifications;
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },
  
  addNotification: (notification) => {
    set((state) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        ...notification,
        read: false,
        createdAt: new Date()
      };
      
      const updatedNotifications = [newNotification, ...state.notifications];
      
      // Save to localStorage
      localStorage.setItem('timeoff_notifications', JSON.stringify(updatedNotifications));
      
      return {
        notifications: updatedNotifications,
        unreadCount: state.unreadCount + 1
      };
    });
  },
  
  markAsRead: async (id) => {
    try {
      set((state) => {
        const notifications = state.notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        
        // Save to localStorage
        localStorage.setItem('timeoff_notifications', JSON.stringify(notifications));
        
        return {
          notifications,
          unreadCount: notifications.filter(n => !n.read).length
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
  
  markAllAsRead: async () => {
    try {
      set((state) => {
        const notifications = state.notifications.map(n => ({ ...n, read: true }));
        
        // Save to localStorage
        localStorage.setItem('timeoff_notifications', JSON.stringify(notifications));
        
        return {
          notifications,
          unreadCount: 0
        };
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}));