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

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    type: 'success',
    message: 'Your time off request for Feb 15-17 has been approved',
    read: false,
    createdAt: new Date('2025-01-10T10:00:00')
  },
  {
    id: 'notif2',
    type: 'info',
    message: 'Your sick leave request is pending manager approval',
    read: false,
    createdAt: new Date('2025-01-12T14:35:00')
  },
  {
    id: 'notif3',
    type: 'info',
    message: 'Your time off request for March 1-5 is pending approval',
    read: false,
    createdAt: new Date('2025-01-13T11:20:00')
  },
  {
    id: 'notif4',
    type: 'success',
    message: 'Your time edit request has been approved',
    read: true,
    createdAt: new Date('2025-01-09T09:00:00')
  },
  {
    id: 'notif5',
    type: 'error',
    message: 'Your time off request has been rejected',
    read: false,
    createdAt: new Date('2025-01-11T17:00:00')
  },
  {
    id: 'notif6',
    type: 'info',
    message: 'You have 2 pending requests to review',
    read: false,
    createdAt: new Date('2025-01-13T12:00:00')
  }
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set({ 
        notifications: [...mockNotifications],
        unreadCount: mockNotifications.filter(n => !n.read).length,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = mockNotifications.filter(n => !n.read).length;
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
      
      // Add to mock data
      mockNotifications.unshift(newNotification);
      
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },
  
  markAsRead: async (id) => {
    try {
      // Update in mock data
      const notificationIndex = mockNotifications.findIndex(n => n.id === id);
      if (notificationIndex !== -1) {
        mockNotifications[notificationIndex].read = true;
      }
      
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
      // Update in mock data
      mockNotifications.forEach(n => n.read = true);
      
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }
}));