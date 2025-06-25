import { create } from 'zustand';
import { TimeOffRequest, RequestStatus } from '../types/request';
import { User } from '../types/user';
import { mockRequests } from '../data/mockData';

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ requests: [...mockRequests], isLoading: false });
    } catch (error) {
      console.error('Error fetching requests:', error);
      set({ error: 'Failed to fetch requests', isLoading: false });
    }
  },

  addRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newRequest: TimeOffRequest = {
        id: Math.random().toString(36).substring(2, 9),
        employee: requestData.employee,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        type: requestData.type,
        reason: requestData.reason,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(requestData.originalClockIn && {
          originalClockIn: requestData.originalClockIn,
          originalClockOut: requestData.originalClockOut,
          requestedClockIn: requestData.requestedClockIn,
          requestedClockOut: requestData.requestedClockOut
        })
      };
      
      // Add to mock data
      mockRequests.push(newRequest);
      
      // Update store
      set(state => ({
        requests: [...state.requests, newRequest],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding request:', error);
      set({ error: 'Failed to create request', isLoading: false });
      throw error;
    }
  },

  updateRequestStatus: async (id, status, manager, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update in mock data
      const requestIndex = mockRequests.findIndex(r => r.id === id);
      if (requestIndex !== -1) {
        mockRequests[requestIndex] = {
          ...mockRequests[requestIndex],
          status,
          approvedBy: manager,
          rejectionReason,
          updatedAt: new Date()
        };
      }
      
      // Update store
      set(state => ({
        requests: state.requests.map(request =>
          request.id === id
            ? {
                ...request,
                status,
                approvedBy: manager,
                rejectionReason,
                updatedAt: new Date()
              }
            : request
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating request status:', error);
      set({ error: 'Failed to update request status', isLoading: false });
      throw error;
    }
  }
}));