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
      // For demo purposes, use mock data since backend might not be available
      const savedRequests = localStorage.getItem('timeoff_requests');
      const requests = savedRequests ? JSON.parse(savedRequests) : mockRequests;
      
      set({ requests, isLoading: false });
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Fallback to mock data
      set({ requests: mockRequests, isLoading: false });
    }
  },

  addRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
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

      const currentRequests = get().requests;
      const updatedRequests = [newRequest, ...currentRequests];
      
      // Save to localStorage
      localStorage.setItem('timeoff_requests', JSON.stringify(updatedRequests));
      
      set({ requests: updatedRequests, isLoading: false });
    } catch (error) {
      console.error('Error adding request:', error);
      set({ error: 'Failed to create request', isLoading: false });
      throw error;
    }
  },

  updateRequestStatus: async (id, status, manager, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      const currentRequests = get().requests;
      const updatedRequests = currentRequests.map(request => {
        if (request.id === id) {
          return {
            ...request,
            status,
            approvedBy: manager,
            rejectionReason,
            updatedAt: new Date()
          };
        }
        return request;
      });

      // Save to localStorage
      localStorage.setItem('timeoff_requests', JSON.stringify(updatedRequests));
      
      set({ requests: updatedRequests, isLoading: false });
    } catch (error) {
      console.error('Error updating request status:', error);
      set({ error: 'Failed to update request status', isLoading: false });
      throw error;
    }
  }
}));