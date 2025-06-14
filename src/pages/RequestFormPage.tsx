import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar, Info, Clock } from 'lucide-react';
import { useRequestStore } from '../store/requestStore';
import { useAuth } from '../context/AuthContext';
import { RequestType } from '../types/request';
import { useNotificationStore } from '../store/notificationStore';

const RequestFormPage: React.FC = () => {
  const [range, setRange] = useState<DateRange | undefined>();
  const [type, setType] = useState<RequestType>('paid time off');
  const [reason, setReason] = useState('');
  const [originalClockIn, setOriginalClockIn] = useState('');
  const [originalClockOut, setOriginalClockOut] = useState('');
  const [requestedClockIn, setRequestedClockIn] = useState('');
  const [requestedClockOut, setRequestedClockOut] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRequest } = useRequestStore();
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const isTimeEditRequest = type === 'time edit';

  // Configure disabled dates based on request type
  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isTimeEditRequest) {
      // For time edit requests, only allow past dates (not future dates)
      return { after: today };
    } else {
      // For time off requests, only allow future dates (not past dates)
      return { before: today };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    if (!range?.from) {
      setError('Please select a date');
      return;
    }

    if (isTimeEditRequest) {
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
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await addRequest({
        employee: user,
        startDate: range.from,
        endDate: range.to || range.from,
        type,
        reason,
        ...(isTimeEditRequest && {
          originalClockIn,
          originalClockOut,
          requestedClockIn,
          requestedClockOut
        })
      });

      addNotification({
        type: 'success',
        message: `${isTimeEditRequest ? 'Time edit' : 'Time off'} request submitted successfully`
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Failed to submit request. Please try again.');
      
      addNotification({
        type: 'error',
        message: 'Failed to submit request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isTimeEditRequest ? 'Request Time Edit' : 'Request Time Off'}
        </h1>
        <p className="mt-1 text-gray-600">
          {isTimeEditRequest 
            ? 'Submit a request to correct your time records'
            : 'Submit a new time off request for approval'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            {isTimeEditRequest ? 'Select Date' : 'Select Dates'}
          </h2>
          
          <div className="rounded-lg border border-gray-200 p-4">
            <DayPicker
              mode={isTimeEditRequest ? "single" : "range"}
              selected={isTimeEditRequest ? range?.from : range}
              onSelect={(selected) => {
                if (isTimeEditRequest) {
                  setRange(selected ? { from: selected, to: selected } : undefined);
                } else {
                  setRange(selected as DateRange);
                }
              }}
              numberOfMonths={1}
              defaultMonth={new Date()}
              className="mx-auto"
              disabled={getDisabledDates()}
            />
          </div>
          
          {range?.from && (
            <div className="mt-4 rounded-md bg-blue-50 p-3 text-center text-sm text-blue-700">
              <Calendar size={16} className="mr-1 inline-block" />
              {isTimeEditRequest 
                ? format(range.from, 'PPP')
                : range?.to 
                ? `${format(range.from, 'PPP')} - ${format(range.to, 'PPP')}`
                : format(range.from, 'PPP')
              }
            </div>
          )}

          {isTimeEditRequest && range?.from && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Original Clock In
                  </label>
                  <input
                    type="time"
                    value={originalClockIn}
                    onChange={(e) => setOriginalClockIn(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Original Clock Out
                  </label>
                  <input
                    type="time"
                    value={originalClockOut}
                    onChange={(e) => setOriginalClockOut(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Clock In
                  </label>
                  <input
                    type="time"
                    value={requestedClockIn}
                    onChange={(e) => setRequestedClockIn(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Correct Clock Out
                  </label>
                  <input
                    type="time"
                    value={requestedClockOut}
                    onChange={(e) => setRequestedClockOut(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Request Details</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Request Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as RequestType);
                  // Clear the date selection when changing request type
                  setRange(undefined);
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="paid time off">Paid Time Off</option>
                <option value="sick leave">Sick Leave</option>
                <option value="time edit">Time Edit Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder={
                  isTimeEditRequest 
                    ? "Please explain why you need to edit your time records (e.g., forgot to clock in/out, system error, etc.)..."
                    : "Please provide details about your time off request..."
                }
              />
            </div>
            
            {type === 'sick leave' && (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                <Info size={16} className="mr-1 inline-block" />
                For sick leave longer than 3 days, a doctor's note may be required upon return.
              </div>
            )}

            {isTimeEditRequest && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <Clock size={16} className="mr-1 inline-block" />
                Time edit requests require manager approval. Please provide accurate times and a clear explanation.
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !range?.from || 
                  !reason.trim() || 
                  (isTimeEditRequest && (!originalClockIn || !originalClockOut || !requestedClockIn || !requestedClockOut)) ||
                  (!isTimeEditRequest && !range?.to)
                }
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestFormPage;