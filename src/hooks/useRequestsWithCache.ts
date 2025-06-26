import { useState, useCallback, useRef } from 'react';
import { TimeOffRequest } from '../types/request';
import { apiService } from '../services/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const useRequestsWithCache = () => {
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to avoid stale closure issues
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const fetchRequests = useCallback(async (): Promise<TimeOffRequest[]> => {
    const now = Date.now();
    const cacheKey = 'requests';
    const CACHE_DURATION = 30000; // 30 seconds

    // Check if we have cached data that's still fresh
    const cachedEntry = cacheRef.current.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached requests data');
      return cachedEntry.data;
    }

    // Fetch fresh data from API
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching fresh requests data from API');
      const freshData = await apiService.getRequests();
      
      // Transform API response to match frontend types
      const transformedRequests = freshData.map((request: any) => ({
        ...request,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt)
      }));

      // Update cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          data: transformedRequests,
          timestamp: now
        });
        return newCache;
      });

      setIsLoading(false);
      return transformedRequests;
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch requests');
      setIsLoading(false);
      
      // Return cached data if available, even if stale
      if (cachedEntry) {
        console.log('⚠️ API failed, returning stale cached data');
        return cachedEntry.data;
      }
      
      throw err;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const now = Date.now();
    const cacheKey = 'notifications';
    const CACHE_DURATION = 30000; // 30 seconds

    // Check cache first
    const cachedEntry = cacheRef.current.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached notifications data');
      return cachedEntry.data;
    }

    try {
      console.log('🔄 Fetching fresh notifications data from API');
      const freshData = await apiService.getNotifications();
      
      // Transform API response
      const transformedNotifications = freshData.map((notification: any) => ({
        ...notification,
        createdAt: new Date(notification.createdAt)
      }));

      // Update cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, {
          data: transformedNotifications,
          timestamp: now
        });
        return newCache;
      });

      return transformedNotifications;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      
      // Return cached data if available
      if (cachedEntry) {
        console.log('⚠️ API failed, returning stale cached notifications');
        return cachedEntry.data;
      }
      
      throw err;
    }
  }, []);

  const invalidateCache = useCallback((keys?: string[]) => {
    if (keys) {
      // Invalidate specific keys
      setCache(prev => {
        const newCache = new Map(prev);
        keys.forEach(key => newCache.delete(key));
        return newCache;
      });
      console.log('🗑️ Invalidated cache keys:', keys);
    } else {
      // Clear entire cache
      setCache(new Map());
      console.log('🗑️ Cleared entire cache');
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing all data');
    invalidateCache();
    return fetchRequests();
  }, [fetchRequests, invalidateCache]);

  const getCacheInfo = useCallback(() => {
    const now = Date.now();
    const info: Record<string, { age: number; fresh: boolean }> = {};
    
    cacheRef.current.forEach((entry, key) => {
      const age = now - entry.timestamp;
      info[key] = {
        age: Math.round(age / 1000), // age in seconds
        fresh: age < 30000 // fresh if less than 30 seconds
      };
    });
    
    return info;
  }, []);

  return {
    fetchRequests,
    fetchNotifications,
    invalidateCache,
    forceRefresh,
    getCacheInfo,
    isLoading,
    error,
    cacheSize: cache.size
  };
};