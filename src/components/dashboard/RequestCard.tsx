import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { TimeOffRequest } from '../../types/request';
import { useAuth } from '../../context/AuthContext';
import { useRequestStore } from '../../store/requestStore';
import RequestStatusBadge from './RequestStatusBadge';

interface RequestCardProps {
  request: TimeOffRequest;
  isManager: boolean;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, isManager }) => {
  const { user } = useAuth();
  const { updateRequestStatus } = useRequestStore();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApprove = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateRequestStatus(request.id, 'approved', user);
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!user) return;
    if (!showRejectionInput) {
      setShowRejectionInput(true);
      return;
    }
    
    setIsUpdating(true);
    try {
      await updateRequestStatus(request.id, 'rejected', user, rejectionReason);
      setShowRejectionInput(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelReject = () => {
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'paid time off':
        return 'bg-blue-100 text-blue-800';
      case 'sick leave':
        return 'bg-orange-100 text-orange-800';
      case 'time edit':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isTimeEditRequest = request.type === 'time edit';

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between border-b border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 overflow-hidden rounded-full">
            <img 
              src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
              alt={request.employee.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{request.employee.name}</p>
            <p className="text-xs text-gray-500">{request.employee.department}</p>
          </div>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(request.type)}`}>
            {request.type === 'time edit' ? 'Time Edit' : 
             request.type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
          <div className="text-xs text-gray-500">
            <Clock size={14} className="mr-1 inline" />
            {format(new Date(request.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
        
        <div className="mt-4">
          {isTimeEditRequest ? (
            <div className="mb-3 space-y-3">
              <div className="flex items-center text-sm">
                <Calendar size={16} className="mr-2 text-blue-500" />
                <span>{format(new Date(request.startDate), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="rounded-md bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Original Times</p>
                    <p className="text-gray-600">
                      {request.originalClockIn || 'N/A'} - {request.originalClockOut || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Requested Times</p>
                    <p className="text-gray-600">
                      {request.requestedClockIn || 'N/A'} - {request.requestedClockOut || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-center text-sm">
              <Calendar size={16} className="mr-2 text-blue-500" />
              <span>
                {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          <p className="mb-3 text-sm text-gray-600">{request.reason}</p>
          
          {request.status === 'rejected' && request.rejectionReason && (
            <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
              <strong>Reason for rejection:</strong> {request.rejectionReason}
            </div>
          )}
          
          {isManager && request.status === 'pending' && (
            <div className="mt-4">
              {showRejectionInput ? (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Reason for rejection
                  </label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    rows={2}
                  ></textarea>
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={cancelReject}
                      className="rounded-md px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleReject}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-300"
                      disabled={isUpdating || !rejectionReason.trim()}
                    >
                      {isUpdating ? 'Rejecting...' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={handleReject}
                    className="flex items-center rounded-md border border-red-600 px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isUpdating}
                  >
                    <XCircle size={16} className="mr-1" />
                    Reject
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="flex items-center rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                    disabled={isUpdating}
                  >
                    <CheckCircle2 size={16} className="mr-1" />
                    {isUpdating ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestCard;