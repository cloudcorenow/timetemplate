import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import { useRequestStore } from '../../store/requestStore';
import { TimeOffRequest, RequestType } from '../../types/request';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({
  isOpen,
  onClose,
  requestId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [request, setRequest] = useState<TimeOffRequest | null>(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: '' as RequestType,
    originalClockIn: '',
    originalClockOut: '',
    requestedClockIn: '',
    requestedClockOut: ''
  });
  
  const { addToast } = useToast();
  const { requests, updateRequest } = useRequestStore();

  useEffect(() => {
    if (isOpen && requestId) {
      setIsLoading(true);
      // Find the request in the store
      const foundRequest = requests.find(r => r.id === requestId);
      if (foundRequest) {
        setRequest(foundRequest);
        
        // Format dates for input fields
        const startDate = new Date(foundRequest.startDate);
        const endDate = new Date(foundRequest.endDate);
        
        setFormData({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          reason: foundRequest.reason,
          type: foundRequest.type,
          originalClockIn: foundRequest.originalClockIn || '',
          originalClockOut: foundRequest.originalClockOut || '',
          requestedClockIn: foundRequest.requestedClockIn || '',
          requestedClockOut: foundRequest.requestedClockOut || ''
        });
      }
      setIsLoading(false);
    }
  }, [isOpen, requestId, requests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    
    setIsSaving(true);

    try {
      // Validate dates
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Start date and end date are required');
      }

      // For time edit requests, validate time fields
      if (isTimeEditRequest) {
        if (!formData.requestedClockIn || !formData.requestedClockOut) {
          throw new Error('Requested clock in and clock out times are required for time edit requests');
        }
      }

      // Create updated request object
      const updatedRequest: TimeOffRequest = {
        ...request,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        reason: formData.reason,
        type: formData.type,
        originalClockIn: formData.originalClockIn || undefined,
        originalClockOut: formData.originalClockOut || undefined,
        requestedClockIn: formData.requestedClockIn || undefined,
        requestedClockOut: formData.requestedClockOut || undefined,
        updatedAt: new Date()
      };

      await updateRequest(updatedRequest);
      
      addToast({
        type: 'success',
        title: 'Request Updated',
        message: `Request updated successfully. New dates: ${format(new Date(formData.startDate), 'MMM d')} - ${format(new Date(formData.endDate), 'MMM d, yyyy')}`
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to update request:', error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update the request. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isTimeEditRequest = formData.type === 'time edit';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Time-Off Request</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading request details...</span>
              </div>
            ) : !request ? (
              <div className="flex items-center justify-center py-8">
                <AlertTriangle size={24} className="text-amber-500 mr-2" />
                <span className="text-gray-600">Request not found</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Request Type (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Type
                  </label>
                  <div className="flex items-center">
                    <FileText size={16} className="mr-2 text-gray-500" />
                    <span className="text-gray-700 capitalize">{formData.type}</span>
                    <Badge variant="info" size="sm" className="ml-2">
                      {request.status}
                    </Badge>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Time Edit Fields */}
                {isTimeEditRequest && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <h4 className="font-medium text-amber-800 mb-3">Original Times (Optional)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clock In
                          </label>
                          <input
                            type="time"
                            value={formData.originalClockIn}
                            onChange={(e) => handleInputChange('originalClockIn', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clock Out
                          </label>
                          <input
                            type="time"
                            value={formData.originalClockOut}
                            onChange={(e) => handleInputChange('originalClockOut', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                      <h4 className="font-medium text-green-800 mb-3">Correct Times (Required)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clock In
                          </label>
                          <input
                            type="time"
                            value={formData.requestedClockIn}
                            onChange={(e) => handleInputChange('requestedClockIn', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Clock Out
                          </label>
                          <input
                            type="time"
                            value={formData.requestedClockOut}
                            onChange={(e) => handleInputChange('requestedClockOut', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide a reason for your time-off request..."
                    required
                  />
                </div>

                {/* Employee Info (Read-only) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-2" />
                    Request Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Employee:</span>
                      <span className="ml-2 font-medium">{request.employee.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <span className="ml-2 font-medium">{request.employee.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 font-medium">{format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <Badge 
                        variant={
                          request.status === 'pending' ? 'warning' :
                          request.status === 'approved' ? 'success' : 'error'
                        } 
                        size="sm"
                        className="ml-2"
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 px-6 py-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || isLoading || !request}
              loading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequestModal;
