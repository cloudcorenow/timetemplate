import { User } from './user';

export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type RequestType = 'paid time off' | 'sick leave' | 'time edit' | 'other';

export interface TimeOffRequest {
  id: string;
  employee: User;
  startDate: Date;
  endDate: Date;
  type: RequestType;
  reason: string;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: User;
  rejectionReason?: string;
  // Time edit specific fields
  originalClockIn?: string;
  originalClockOut?: string;
  requestedClockIn?: string;
  requestedClockOut?: string;
}