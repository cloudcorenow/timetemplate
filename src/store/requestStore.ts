import { create } from 'zustand';
import { TimeOffRequest, RequestStatus } from '../types/request';
import { User } from '../types/user';
import { apiService } from '../services/api';

interface RequestState {
  requests: TimeOffRequest[];
  isLoading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  addRequest: (request: any) => Promise<void>;
  updateRequestStatus: (id: string, status: RequestStatus, manager?: User, rejectionReason?: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const requests = await apiService.getRequests();
      
      // Transform API response to match frontend types
      const transformedRequests = requests.map((request: any) => ({
        ...request,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt)
      }));
      
      set({ requests: transformedRequests, isLoading: false });
    } catch (error) {
      console.error('Error fetching requests:', error);
      set({ error: 'Failed to fetch requests', isLoading: false });
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
      
      // Refresh the requests list
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
      
      // Refresh the requests list
      await get().fetchRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      set({ error: 'Failed to update request status', isLoading: false });
      throw error;
    }
  }
}));