import { create } from 'zustand';
import { Notification } from '../types/notification';
import { apiService } from '../services/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  lastFetch: number;
  cache: Map<string, { data: any; timestamp: number }>;
  
  // Core methods
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Cache methods
  invalidateCache: (keys?: string[]) => void;
  forceRefresh: () => Promise<void>;
  getCacheInfo: () => Record<string, { age: number; fresh: boolean }>;
}

const CACHE_DURATION = 30000; // 30 seconds
const UNREAD_COUNT_FETCH_INTERVAL = 30000; // 30 seconds
let unreadCountTimer: number | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  lastFetch: 0,
  cache: new Map(),

  fetchNotifications: async () => {
    const state = get();
    const now = Date.now();
    const cacheKey = 'notifications';

    // Check if we have fresh cached data
    const cachedEntry = state.cache.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached notifications data');
      set({ 
        notifications: cachedEntry.data.notifications,
        unreadCount: cachedEntry.data.unreadCount,
        isLoading: false 
      });
      return;
    }

    // Fetch fresh data
    set({ isLoading: true });
    try {
      console.log('🔄 Fetching fresh notifications data from API');
      const notifications = await apiService.getNotifications();
      
      // Transform API response to match frontend types
      const transformedNotifications = notifications.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));

      const unreadCount = transformedNotifications.filter((n: Notification) => !n.read).length;

      // Update cache and state
      const cacheData = { notifications: transformedNotifications, unreadCount };
      set(state => ({
        notifications: transformedNotifications,
        unreadCount,
        isLoading: false,
        lastFetch: now,
        cache: new Map(state.cache).set(cacheKey, {
          data: cacheData,
          timestamp: now
        })
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      // Try to use stale cached data if available
      if (cachedEntry) {
        console.log('⚠️ API failed, using stale cached notifications');
        set({ 
          notifications: cachedEntry.data.notifications,
          unreadCount: cachedEntry.data.unreadCount,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    }
  },

  fetchUnreadCount: async () => {
    const state = get();
    const now = Date.now();
    const cacheKey = 'unreadCount';

    // Check cache first
    const cachedEntry = state.cache.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached unread count');
      set({ unreadCount: cachedEntry.data });
      return;
    }

    try {
      console.log('🔄 Fetching fresh unread count from API');
      const response = await apiService.getUnreadCount();
      
      // Update cache and state
      set(state => ({
        unreadCount: response.count,
        cache: new Map(state.cache).set(cacheKey, {
          data: response.count,
          timestamp: now
        })
      }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      // Use cached data if available
      if (cachedEntry) {
        console.log('⚠️ API failed, using stale cached unread count');
        set({ unreadCount: cachedEntry.data });
      }
    }
  },
  
  addNotification: (notification) => {
    // This is for local notifications only - invalidate cache
    set((state) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        ...notification,
        read: false,
        createdAt: new Date()
      };
      
      // Invalidate cache since we're adding locally
      const newCache = new Map(state.cache);
      newCache.delete('notifications');
      newCache.delete('unreadCount');
      
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        cache: newCache
      };
    });
  },
  
  markAsRead: async (id) => {
    try {
      await apiService.markNotificationAsRead(id);
      
      // Update local state immediately (optimistic update)
      set((state) => {
        const notifications = state.notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        );
        
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Invalidate cache
        const newCache = new Map(state.cache);
        newCache.delete('notifications');
        newCache.delete('unreadCount');
        
        return {
          notifications,
          unreadCount,
          cache: newCache
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update by refetching
      get().forceRefresh();
    }
  },
  
  markAllAsRead: async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      
      // Update local state immediately (optimistic update)
      set((state) => {
        const notifications = state.notifications.map(n => ({ ...n, read: true }));
        
        // Invalidate cache
        const newCache = new Map(state.cache);
        newCache.delete('notifications');
        newCache.delete('unreadCount');
        
        return {
          notifications,
          unreadCount: 0,
          cache: newCache
        };
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update by refetching
      get().forceRefresh();
    }
  },

  invalidateCache: (keys?: string[]) => {
    set(state => {
      const newCache = new Map(state.cache);
      if (keys) {
        keys.forEach(key => newCache.delete(key));
        console.log('🗑️ Invalidated notification cache keys:', keys);
      } else {
        newCache.clear();
        console.log('🗑️ Cleared entire notification cache');
      }
      return { cache: newCache };
    });
  },

  forceRefresh: async () => {
    console.log('🔄 Force refreshing notifications');
    get().invalidateCache();
    await get().fetchNotifications();
  },

  getCacheInfo: () => {
    const state = get();
    const now = Date.now();
    const info: Record<string, { age: number; fresh: boolean }> = {};
    
    state.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      info[key] = {
        age: Math.round(age / 1000), // age in seconds
        fresh: age < CACHE_DURATION
      };
    });
    
    return info;
  }
}));

// Setup periodic unread count fetching
if (typeof window !== 'undefined') {
  // Clear any existing timer
  if (unreadCountTimer) {
    window.clearInterval(unreadCountTimer);
  }
  
  // Set up a new timer
  unreadCountTimer = window.setInterval(() => {
    const store = useNotificationStore.getState();
    store.fetchUnreadCount();
  }, UNREAD_COUNT_FETCH_INTERVAL);
}