import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, XCircle, Building2, User, MoreVertical } from 'lucide-react';
import { TimeOffRequest } from '../../types/request';
import { useAuth } from '../../context/AuthContext';
import { useRequestStore } from '../../store/requestStore';
import { useToast } from '../../hooks/useToast';
import AnimatedCard from '../ui/AnimatedCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import RequestActionsMenu from './RequestActionsMenu';

interface EnhancedRequestCardProps {
  request: TimeOffRequest;
  isManager: boolean;
  delay?: number;
}

const EnhancedRequestCard: React.FC<EnhancedRequestCardProps> = ({ request, isManager, delay = 0 }) => {
  const { user } = useAuth();
  const { updateRequestStatus } = useRequestStore();
  const { addToast } = useToast();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleApprove = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateRequestStatus(request.id, 'approved', user);
      addToast({
        type: 'success',
        title: 'Request Approved',
        message: `${request.employee.name}'s ${request.type} request has been approved.`
      });
    } catch (error) {
      console.error('Failed to approve request:', error);
      addToast({
        type: 'error',
        title: 'Approval Failed',
        message: 'Failed to approve the request. Please try again.'
      });
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
      addToast({
        type: 'info',
        title: 'Request Rejected',
        message: `${request.employee.name}'s ${request.type} request has been rejected.`
      });
      setShowRejectionInput(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject request:', error);
      addToast({
        type: 'error',
        title: 'Rejection Failed',
        message: 'Failed to reject the request. Please try again.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelReject = () => {
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  const getStatusBadge = () => {
    const variants = {
      pending: 'warning' as const,
      approved: 'success' as const,
      rejected: 'error' as const
    };

    const icons = {
      pending: <Clock size={12} className="mr-1" />,
      approved: <CheckCircle2 size={12} className="mr-1" />,
      rejected: <XCircle size={12} className="mr-1" />
    };

    return (
      <Badge variant={variants[request.status]} size="sm">
        {icons[request.status]}
        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'paid time off':
        return 'info';
      case 'sick leave':
        return 'warning';
      case 'time edit':
        return 'default';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  };

  const isTimeEditRequest = request.type === 'time edit';
  const isOwnRequest = user?.id === request.employee.id;

  return (
    <AnimatedCard delay={delay} className="overflow-hidden">
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 p-4">
          <div className="flex items-center">
            <div className="relative">
              <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                <img 
                  src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                  alt={request.employee.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {request.employee.role === 'manager' && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-purple-100 p-1">
                  <User size={10} className="text-purple-600" />
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">{request.employee.name}</p>
              <div className="flex items-center text-sm text-gray-500">
                <Building2 size={12} className="mr-1" />
                {request.employee.department}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <RequestActionsMenu 
              requestId={request.id} 
              employeeName={request.employee.name}
              status={request.status}
              employeeId={request.employee.id}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant={getTypeColor(request.type)} size="sm">
              {request.type === 'time edit' ? 'Time Edit' : 
               request.type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Badge>
            <div className="text-xs text-gray-500">
              <Clock size={12} className="mr-1 inline" />
              {format(new Date(request.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
          
          {/* Date/Time Information */}
          {isTimeEditRequest ? (
            <div className="mb-4 space-y-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Calendar size={16} className="mr-2 text-blue-500" />
                <span>{format(new Date(request.startDate), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Original Times</p>
                    <p className="text-gray-600 font-mono">
                      {request.originalClockIn || 'N/A'} - {request.originalClockOut || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Requested Times</p>
                    <p className="text-gray-600 font-mono">
                      {request.requestedClockIn || 'N/A'} - {request.requestedClockOut || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center text-sm font-medium text-gray-700">
              <Calendar size={16} className="mr-2 text-blue-500" />
              <span>
                {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {/* Reason */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 leading-relaxed">{request.reason}</p>
          </div>
          
          {/* Status Messages */}
          {request.status === 'rejected' && request.rejectionReason && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800 mb-1">Reason for rejection:</p>
              <p className="text-xs text-red-700">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === 'approved' && request.approvedBy && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs font-medium text-green-800 mb-1">Approved by:</p>
              <p className="text-xs text-green-700">{request.approvedBy.name}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          {isManager && request.status === 'pending' && !isOwnRequest && (
            <div className="mt-4">
              {showRejectionInput ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-gray-700">
                    Reason for rejection
                  </label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={cancelReject}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={handleReject}
                      loading={isUpdating}
                      disabled={!rejectionReason.trim()}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={handleReject}
                    disabled={isUpdating}
                    icon={<XCircle size={16} />}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="success"
                    size="sm"
                    onClick={handleApprove}
                    loading={isUpdating}
                    icon={<CheckCircle2 size={16} />}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Info for managers viewing their own requests */}
          {isManager && isOwnRequest && request.status === 'pending' && (
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> This is your own request. Another manager or admin will need to approve it.
              </p>
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
};

export default EnhancedRequestCard;