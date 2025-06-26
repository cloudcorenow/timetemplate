import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Building2, User, FileText, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useRequestStore } from '../../store/requestStore';
import { TimeOffRequest } from '../../types/request';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ isOpen, onClose, requestId }) => {
  const [request, setRequest] = useState<TimeOffRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { requests } = useRequestStore();

  useEffect(() => {
    if (isOpen && requestId) {
      setIsLoading(true);
      // Find the request in the store
      const foundRequest = requests.find(r => r.id === requestId);
      if (foundRequest) {
        setRequest(foundRequest);
      }
      setIsLoading(false);
    }
  }, [isOpen, requestId, requests]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error" size="sm">Rejected</Badge>;
      default:
        return null;
    }
  };

  const isTimeEditRequest = request?.type === 'time edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : !request ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-gray-500">Request not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Request Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 overflow-hidden rounded-full mr-4">
                    <img 
                      src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"}
                      alt={request.employee.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{request.employee.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <Building2 size={14} className="mr-1" />
                      {request.employee.department}
                      <span className="mx-2">•</span>
                      <User size={14} className="mr-1" />
                      {request.employee.role}
                    </div>
                  </div>
                </div>
                <div>
                  {getStatusBadge(request.status)}
                </div>
              </div>

              {/* Request Type */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center mb-2">
                  <FileText size={18} className="mr-2 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Request Type</h4>
                </div>
                <p className="text-gray-700 capitalize">{request.type}</p>
              </div>

              {/* Date Information */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center mb-2">
                  <Calendar size={18} className="mr-2 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Date Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-700">
                      {format(new Date(request.startDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium text-gray-700">
                      {format(new Date(request.endDate), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium text-gray-700">
                      {format(new Date(request.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-700">
                      {format(new Date(request.updatedAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Edit Details (if applicable) */}
              {isTimeEditRequest && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center mb-2">
                    <Clock size={18} className="mr-2 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Time Edit Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Original Clock In</p>
                      <p className="font-medium text-gray-700 font-mono">
                        {request.originalClockIn || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Original Clock Out</p>
                      <p className="font-medium text-gray-700 font-mono">
                        {request.originalClockOut || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested Clock In</p>
                      <p className="font-medium text-gray-700 font-mono">
                        {request.requestedClockIn || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested Clock Out</p>
                      <p className="font-medium text-gray-700 font-mono">
                        {request.requestedClockOut || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center mb-2">
                  <FileText size={18} className="mr-2 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Reason</h4>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{request.reason}</p>
              </div>

              {/* Status Information */}
              {request.status === 'approved' && request.approvedBy && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-start">
                    <CheckCircle2 size={18} className="mr-2 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Approved</h4>
                      <p className="text-green-700">
                        This request was approved by {request.approvedBy.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {request.status === 'rejected' && request.rejectionReason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start">
                    <XCircle size={18} className="mr-2 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Rejected</h4>
                      <p className="text-red-700">
                        Reason: {request.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start">
                  <Mail size={18} className="mr-2 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Contact Information</h4>
                    <p className="text-blue-700">
                      For questions about this request, contact {request.employee.name} at{' '}
                      <a 
                        href={`mailto:${request.employee.email}`} 
                        className="underline hover:text-blue-800"
                      >
                        {request.employee.email}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;