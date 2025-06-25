import { create } from 'zustand';
import { Notification } from '../types/notification';
import { apiService } from '../services/api';

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
      const notifications = await apiService.getNotifications();
      
      // Transform API response to match frontend types
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
      const response = await apiService.getUnreadCount();
      set({ unreadCount: response.count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },
  
  addNotification: (notification) => {
    // This is for local notifications only
    set((state) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        ...notification,
        read: false,
        createdAt: new Date()
      };
      
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },
  
  markAsRead: async (id) => {
    try {
      await apiService.markNotificationAsRead(id);
      
      set((state) => {
        const notifications = state.notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        
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
      await apiService.markAllNotificationsAsRead();
      
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}));