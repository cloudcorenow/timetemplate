import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, XCircle, Building2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { TimeOffRequest } from '../../types/request';
import { useAuth } from '../../context/AuthContext';
import { useRequestStore } from '../../store/requestStore';
import { useToast } from '../../hooks/useToast';
import TouchOptimizedCard from './TouchOptimizedCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface MobileRequestCardProps {
  request: TimeOffRequest;
  isManager: boolean;
}

const MobileRequestCard: React.FC<MobileRequestCardProps> = ({ request, isManager }) => {
  const { user } = useAuth();
  const { updateRequestStatus } = useRequestStore();
  const { addToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApprove = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await updateRequestStatus(request.id, 'approved', user);
      addToast({
        type: 'success',
        title: 'Request Approved',
        message: `${request.employee.name}'s request has been approved.`
      });
    } catch (error) {
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
        message: `${request.employee.name}'s request has been rejected.`
      });
      setShowRejectionInput(false);
      setRejectionReason('');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Rejection Failed',
        message: 'Failed to reject the request. Please try again.'
      });
    } finally {
      setIsUpdating(false);
    }
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

  const isTimeEditRequest = request.type === 'time edit';
  const isOwnRequest = user?.id === request.employee.id;

  return (
    <TouchOptimizedCard className="overflow-hidden">
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="h-10 w-10 overflow-hidden rounded-full flex-shrink-0">
            <img 
              src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
              alt={request.employee.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{request.employee.name}</p>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 truncate">
                {request.type} • {format(new Date(request.startDate), 'MMM d')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {getStatusBadge()}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Department */}
          <div className="flex items-center text-sm text-gray-600">
            <Building2 size={14} className="mr-2" />
            {request.employee.department}
            {request.employee.role === 'manager' && (
              <Badge variant="info" size="sm" className="ml-2">
                <User size={10} className="mr-1" />
                Manager
              </Badge>
            )}
          </div>

          {/* Date/Time Information */}
          {isTimeEditRequest ? (
            <div className="space-y-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Calendar size={14} className="mr-2 text-blue-500" />
                <span>{format(new Date(request.startDate), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Original Times</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {request.originalClockIn || 'N/A'} - {request.originalClockOut || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Requested Times</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {request.requestedClockIn || 'N/A'} - {request.requestedClockOut || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Calendar size={14} className="mr-2 text-blue-500" />
              <span>
                {format(new Date(request.startDate), 'EEEE, MMMM d')} - {format(new Date(request.endDate), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">{request.reason}</p>
          </div>

          {/* Status Messages */}
          {request.status === 'rejected' && request.rejectionReason && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800 mb-1">Reason for rejection:</p>
              <p className="text-xs text-red-700">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === 'approved' && request.approvedBy && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs font-medium text-green-800 mb-1">Approved by:</p>
              <p className="text-xs text-green-700">{request.approvedBy.name}</p>
            </div>
          )}

          {/* Action Buttons for Mobile */}
          {isManager && request.status === 'pending' && !isOwnRequest && (
            <div className="space-y-3">
              {showRejectionInput ? (
                <div className="space-y-3">
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                    placeholder="Reason for rejection..."
                  />
                  <div className="flex space-x-2">
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowRejectionInput(false);
                        setRejectionReason('');
                      }}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={handleReject}
                      loading={isUpdating}
                      disabled={!rejectionReason.trim()}
                      className="flex-1"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="secondary"
                    size="md"
                    onClick={handleReject}
                    disabled={isUpdating}
                    icon={<XCircle size={16} />}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="success"
                    size="md"
                    onClick={handleApprove}
                    loading={isUpdating}
                    icon={<CheckCircle2 size={16} />}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Info for managers viewing their own requests */}
          {isManager && isOwnRequest && request.status === 'pending' && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> This is your own request. Another manager or admin will need to approve it.
              </p>
            </div>
          )}

          {/* Created date */}
          <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
            <Clock size={12} className="mr-1" />
            Created {format(new Date(request.createdAt), 'MMMM d, yyyy')}
          </div>
        </div>
      )}
    </TouchOptimizedCard>
  );
};

export default MobileRequestCard;