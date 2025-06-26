import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useRequestStore } from '../../store/requestStore';
import { TimeOffRequest, RequestType } from '../../types/request';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ isOpen, onClose, requestId }) => {
  const [request, setRequest] = useState<TimeOffRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [type, setType] = useState<RequestType>('paid time off');
  const [reason, setReason] = useState('');
  const [originalClockIn, setOriginalClockIn] = useState('');
  const [originalClockOut, setOriginalClockOut] = useState('');
  const [requestedClockIn, setRequestedClockIn] = useState('');
  const [requestedClockOut, setRequestedClockOut] = useState('');
  const [error, setError] = useState('');
  
  const { requests, updateRequest } = useRequestStore();
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && requestId) {
      setIsLoading(true);
      // Find the request in the store
      const foundRequest = requests.find(r => r.id === requestId);
      if (foundRequest) {
        setRequest(foundRequest);
        
        // Initialize form values
        setType(foundRequest.type);
        setReason(foundRequest.reason);
        setRange({
          from: new Date(foundRequest.startDate),
          to: new Date(foundRequest.endDate)
        });
        
        // Set time edit fields if applicable
        if (foundRequest.type === 'time edit') {
          setOriginalClockIn(foundRequest.originalClockIn || '');
          setOriginalClockOut(foundRequest.originalClockOut || '');
          setRequestedClockIn(foundRequest.requestedClockIn || '');
          setRequestedClockOut(foundRequest.requestedClockOut || '');
        }
      }
      setIsLoading(false);
    }
  }, [isOpen, requestId, requests]);

  const handleSave = async () => {
    if (!request) return;
    
    if (!range?.from) {
      setError('Please select a date');
      return;
    }

    if (type === 'time edit') {
      if (!originalClockIn || !originalClockOut || !requestedClockIn || !requestedClockOut) {
        setError('Please fill in all time fields for time edit requests');
        return;
      }
    } else {
      if (!range?.to) {
        setError('Please select a date range');
        return;
      }
    }
    
    if (!reason.trim()) {
      setError('Please provide a reason for your request');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      // In a real app, this would call the API to update the request
      // For now, we'll just update the local store
      await updateRequest({
        ...request,
        startDate: range.from,
        endDate: range.to || range.from,
        type,
        reason,
        ...(type === 'time edit' && {
          originalClockIn,
          originalClockOut,
          requestedClockIn,
          requestedClockOut
        })
      });
      
      addToast({
        type: 'success',
        title: 'Request Updated',
        message: 'Your request has been updated successfully'
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating request:', error);
      setError('Failed to update request. Please try again.');
      
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update request. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Configure disabled dates based on request type
  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'time edit') {
      return { after: today };
    } else {
      return { before: today };
    }
  };

  const isTimeEditRequest = type === 'time edit';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Edit Request</h2>
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
              {/* Request Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as RequestType)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={request.status !== 'pending'}
                >
                  <option value="paid time off">Paid Time Off</option>
                  <option value="sick leave">Sick Leave</option>
                  <option value="time edit">Time Edit</option>
                  <option value="other">Other</option>
                </select>
                {request.status !== 'pending' && (
                  <p className="mt-1 text-xs text-amber-600">
                    Request type cannot be changed for non-pending requests
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isTimeEditRequest ? 'Date' : 'Date Range'}
                </label>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <DayPicker
                    mode={isTimeEditRequest ? "single" : "range"}
                    selected={range}
                    onSelect={(selected) => {
                      if (isTimeEditRequest && selected) {
                        // For time edit, set both from and to to the same date
                        const singleDate = selected as Date;
                        setRange({ from: singleDate, to: singleDate });
                      } else {
                        setRange(selected as DateRange);
                      }
                    }}
                    disabled={request.status !== 'pending' ? true : getDisabledDates()}
                    className="mx-auto"
                  />
                </div>
                {request.status !== 'pending' && (
                  <p className="mt-1 text-xs text-amber-600">
                    Dates cannot be changed for non-pending requests
                  </p>
                )}
              </div>

              {/* Time Edit Fields */}
              {isTimeEditRequest && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Original Times</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Clock In
                        </label>
                        <input
                          type="time"
                          value={originalClockIn}
                          onChange={(e) => setOriginalClockIn(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={request.status !== 'pending'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Clock Out
                        </label>
                        <input
                          type="time"
                          value={originalClockOut}
                          onChange={(e) => setOriginalClockOut(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={request.status !== 'pending'}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Requested Times</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Clock In
                        </label>
                        <input
                          type="time"
                          value={requestedClockIn}
                          onChange={(e) => setRequestedClockIn(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={request.status !== 'pending'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Clock Out
                        </label>
                        <input
                          type="time"
                          value={requestedClockOut}
                          onChange={(e) => setRequestedClockOut(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={request.status !== 'pending'}
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
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Please provide details about your request..."
                  disabled={request.status !== 'pending'}
                />
                {request.status !== 'pending' && (
                  <p className="mt-1 text-xs text-amber-600">
                    Reason cannot be changed for non-pending requests
                  </p>
                )}
              </div>

              {/* Status Information */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center mb-2">
                  <Clock size={18} className="mr-2 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Status Information</h4>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2">Current Status:</span>
                  <Badge 
                    variant={
                      request.status === 'pending' ? 'warning' :
                      request.status === 'approved' ? 'success' : 'error'
                    }
                    size="sm"
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                {request.status !== 'pending' && (
                  <p className="mt-2 text-sm text-amber-600">
                    <AlertTriangle size={14} className="inline mr-1" />
                    This request has already been {request.status}. Only pending requests can be fully edited.
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-start">
                    <AlertTriangle size={18} className="mr-2 text-red-600 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || request?.status !== 'pending'}
              loading={isSaving}
              icon={<Save size={16} />}
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