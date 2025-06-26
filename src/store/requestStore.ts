import { create } from 'zustand';
import { TimeOffRequest, RequestStatus } from '../types/request';
import { User } from '../types/user';
import { apiService } from '../services/api';

interface RequestState {
  requests: TimeOffRequest[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
  cache: Map<string, { data: any; timestamp: number }>;
  
  // Core methods
  fetchRequests: () => Promise<void>;
  addRequest: (request: any) => Promise<void>;
  updateRequestStatus: (id: string, status: RequestStatus, manager?: User, rejectionReason?: string) => Promise<void>;
  
  // Cache methods
  invalidateCache: (keys?: string[]) => void;
  forceRefresh: () => Promise<void>;
  getCacheInfo: () => Record<string, { age: number; fresh: boolean }>;
}

const CACHE_DURATION = 30000; // 30 seconds

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  lastFetch: 0,
  cache: new Map(),

  fetchRequests: async () => {
    const state = get();
    const now = Date.now();
    const cacheKey = 'requests';

    // Check if we have fresh cached data
    const cachedEntry = state.cache.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_DURATION) {
      console.log('📦 Using cached requests data');
      set({ 
        requests: cachedEntry.data,
        lastFetch: cachedEntry.timestamp,
        isLoading: false,
        error: null 
      });
      return;
    }

    // Fetch fresh data
    set({ isLoading: true, error: null });
    try {
      console.log('🔄 Fetching fresh requests data from API');
      const requests = await apiService.getRequests();
      
      // Transform API response to match frontend types
      const transformedRequests = requests.map((request: any) => ({
        ...request,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt)
      }));

      // Update cache and state
      set(state => ({
        requests: transformedRequests,
        isLoading: false,
        lastFetch: now,
        cache: new Map(state.cache).set(cacheKey, {
          data: transformedRequests,
          timestamp: now
        })
      }));
    } catch (error) {
      console.error('Error fetching requests:', error);
      
      // Try to use stale cached data if available
      if (cachedEntry) {
        console.log('⚠️ API failed, using stale cached data');
        set({ 
          requests: cachedEntry.data,
          isLoading: false,
          error: 'Using cached data - connection issues'
        });
      } else {
        set({ 
          error: 'Failed to fetch requests', 
          isLoading: false 
        });
      }
    }
  },

  addRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.createRequest({
        startDate: requestData.startDate.toISOString().split('T')[0],
        endDate: requestData.endDate.toISOString().split('T')[0],
        type: requestData.type,
        reason: requestData.reason,
        originalClockIn: requestData.originalClockIn,
        originalClockOut: requestData.originalClockOut,
        requestedClockIn: requestData.requestedClockIn,
        requestedClockOut: requestData.requestedClockOut
      });
      
      // Invalidate cache and refresh data
      console.log('✅ Request created, invalidating cache');
      get().invalidateCache(['requests']);
      await get().fetchRequests();
    } catch (error) {
      console.error('Error adding request:', error);
      set({ error: 'Failed to create request', isLoading: false });
      throw error;
    }
  },

  updateRequestStatus: async (id, status, manager, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.updateRequestStatus(id, status, rejectionReason);
      
      // Invalidate cache and refresh data
      console.log('✅ Request status updated, invalidating cache');
      get().invalidateCache(['requests', 'notifications']);
      await get().fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      set({ error: 'Failed to update request status', isLoading: false });
      throw error;
    }
  },

  invalidateCache: (keys?: string[]) => {
    set(state => {
      const newCache = new Map(state.cache);
      if (keys) {
        keys.forEach(key => newCache.delete(key));
        console.log('🗑️ Invalidated cache keys:', keys);
      } else {
        newCache.clear();
        console.log('🗑️ Cleared entire cache');
      }
      return { cache: newCache };
    });
  },

  forceRefresh: async () => {
    console.log('🔄 Force refreshing requests');
    get().invalidateCache(['requests']);
    await get().fetchRequests();
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