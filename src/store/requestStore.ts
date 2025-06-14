import { create } from 'zustand';
import { TimeOffRequest, RequestStatus } from '../types/request';
import { User } from '../types/user';
import { useNotificationStore } from './notificationStore';

const STORAGE_KEY = 'timeoff_requests';

const getStoredRequests = (): TimeOffRequest[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const requests = JSON.parse(stored);
    // Convert string dates back to Date objects
    return requests.map((request: any) => ({
      ...request,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      createdAt: new Date(request.createdAt),
      updatedAt: new Date(request.updatedAt)
    }));
  }
  return [];
};

const saveRequests = (requests: TimeOffRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

interface RequestState {
  requests: TimeOffRequest[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  addRequest: (request: Omit<TimeOffRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<TimeOffRequest>;
  updateRequestStatus: (requestId: string, status: RequestStatus, manager?: User, rejectionReason?: string) => Promise<TimeOffRequest>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: getStoredRequests(),
  isLoading: false,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const storedRequests = getStoredRequests();
      set({ requests: storedRequests, isLoading: false });
    } catch (error) {
      console.error('Error fetching requests:', error);
      set({ error: 'Failed to fetch requests', isLoading: false });
    }
  },

  addRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      const newRequest: TimeOffRequest = {
        ...requestData,
        id: Math.random().toString(36).substring(2, 9),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const currentRequests = get().requests;
      const updatedRequests = [...currentRequests, newRequest];
      
      // Save to localStorage
      saveRequests(updatedRequests);

      set({
        requests: updatedRequests,
        isLoading: false
      });

      useNotificationStore.getState().addNotification({
        type: 'success',
        message: 'Time off request submitted successfully'
      });

      return newRequest;
    } catch (error) {
      console.error('Error adding request:', error);
      set({ error: 'Failed to add request', isLoading: false });
      throw error;
    }
  },

  updateRequestStatus: async (requestId, status, manager, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      let updatedRequest: TimeOffRequest | undefined;
      const currentRequests = get().requests;

      const updatedRequests = currentRequests.map(request => {
        if (request.id === requestId) {
          updatedRequest = {
            ...request,
            status,
            updatedAt: new Date(),
            ...(status === 'approved' && { approvedBy: manager }),
            ...(status === 'rejected' && { 
              approvedBy: manager,
              rejectionReason: rejectionReason || 'No reason provided'
            })
          };
          return updatedRequest;
        }
        return request;
      });

      if (!updatedRequest) {
        throw new Error('Request not found');
      }

      // Save to localStorage
      saveRequests(updatedRequests);

      set({
        requests: updatedRequests,
        isLoading: false
      });

      useNotificationStore.getState().addNotification({
        type: status === 'approved' ? 'success' : 'warning',
        message: `Time off request has been ${status}`
      });

      return updatedRequest;
    } catch (error) {
      console.error('Error updating request status:', error);
      set({ error: 'Failed to update request status', isLoading: false });
      throw error;
    }
  }
}));