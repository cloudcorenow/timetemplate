import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar, Info, Clock, ArrowLeft } from 'lucide-react';
import { useRequestStore } from '../store/requestStore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { RequestType } from '../types/request';
import { useNotificationStore } from '../store/notificationStore';
import TouchOptimizedCard from '../components/mobile/TouchOptimizedCard';
import Button from '../components/ui/Button';

const MobileRequestFormPage: React.FC = () => {
  const [range, setRange] = useState<DateRange | undefined>();
  const [type, setType] = useState<RequestType>('paid time off');
  const [reason, setReason] = useState('');
  const [originalClockIn, setOriginalClockIn] = useState('');
  const [originalClockOut, setOriginalClockOut] = useState('');
  const [requestedClockIn, setRequestedClockIn] = useState('');
  const [requestedClockOut, setRequestedClockOut] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const { addRequest } = useRequestStore();
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isTimeEditRequest = type === 'time edit';
  const totalSteps = isTimeEditRequest ? 4 : 3;

  // Configure disabled dates based on request type
  const getDisabledDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isTimeEditRequest) {
      return { after: today };
    } else {
      return { before: today };
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      addToast({
        type: 'error',
        title: 'Authentication Error',
        message: 'User not authenticated'
      });
      return;
    }
    
    if (!range?.from) {
      addToast({
        type: 'error',
        title: 'Missing Date',
        message: 'Please select a date'
      });
      return;
    }

    if (isTimeEditRequest) {
      if (!originalClockIn || !originalClockOut || !requestedClockIn || !requestedClockOut) {
        addToast({
          type: 'error',
          title: 'Missing Time Information',
          message: 'Please fill in all time fields'
        });
        return;
      }
    } else {
      if (!range?.to) {
        addToast({
          type: 'error',
          title: 'Missing End Date',
          message: 'Please select a date range'
        });
        return;
      }
    }
    
    if (!reason.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Reason',
        message: 'Please provide a reason for your request'
      });
      return;
    }
    
    setIsSubmitting(true);
    
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

      addToast({
        type: 'success',
        title: 'Request Submitted',
        message: 'Your request has been submitted for approval'
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting request:', error);
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return type !== '';
      case 2:
        return range?.from && (!isTimeEditRequest || range?.to);
      case 3:
        if (isTimeEditRequest) {
          return originalClockIn && originalClockOut && requestedClockIn && requestedClockOut;
        }
        return reason.trim() !== '';
      case 4:
        return reason.trim() !== '';
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Request Type</h2>
            <p className="text-gray-600">What type of request would you like to submit?</p>
            
            <div className="space-y-3">
              {[
                { value: 'paid time off', label: 'Paid Time Off', desc: 'Vacation, personal days' },
                { value: 'sick leave', label: 'Sick Leave', desc: 'Medical appointments, illness' },
                { value: 'time edit', label: 'Time Edit Request', desc: 'Correct clock in/out times' },
                { value: 'other', label: 'Other', desc: 'Other time off requests' }
              ].map((option) => (
                <TouchOptimizedCard
                  key={option.value}
                  className={`p-4 border-2 transition-colors ${
                    type === option.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setType(option.value as RequestType)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      type === option.value 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {type === option.value && (
                        <div className="h-full w-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </TouchOptimizedCard>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isTimeEditRequest ? 'Select Date' : 'Select Dates'}
            </h2>
            <p className="text-gray-600">
              {isTimeEditRequest 
                ? 'Choose the date you need to edit'
                : 'Choose your time off dates'
              }
            </p>
            
            <TouchOptimizedCard className="p-4">
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
            </TouchOptimizedCard>
            
            {range?.from && (
              <TouchOptimizedCard className="p-3 bg-blue-50 border border-blue-200">
                <div className="flex items-center text-blue-700">
                  <Calendar size={16} className="mr-2" />
                  <span className="text-sm font-medium">
                    {isTimeEditRequest 
                      ? format(range.from, 'PPP')
                      : range?.to 
                      ? `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
                      : format(range.from, 'PPP')
                    }
                  </span>
                </div>
              </TouchOptimizedCard>
            )}
          </div>
        );

      case 3:
        if (isTimeEditRequest) {
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Time Details</h2>
              <p className="text-gray-600">Enter the original and correct times</p>
              
              <div className="space-y-4">
                <TouchOptimizedCard className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Original Times</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clock In
                      </label>
                      <input
                        type="time"
                        value={originalClockIn}
                        onChange={(e) => setOriginalClockIn(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clock Out
                      </label>
                      <input
                        type="time"
                        value={originalClockOut}
                        onChange={(e) => setOriginalClockOut(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </TouchOptimizedCard>

                <TouchOptimizedCard className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Correct Times</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clock In
                      </label>
                      <input
                        type="time"
                        value={requestedClockIn}
                        onChange={(e) => setRequestedClockIn(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clock Out
                      </label>
                      <input
                        type="time"
                        value={requestedClockOut}
                        onChange={(e) => setRequestedClockOut(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </TouchOptimizedCard>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Reason</h2>
              <p className="text-gray-600">Please provide details about your request</p>
              
              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={
                    isTimeEditRequest 
                      ? "Please explain why you need to edit your time records..."
                      : "Please provide details about your time off request..."
                  }
                />
              </div>

              {type === 'sick leave' && (
                <TouchOptimizedCard className="p-3 bg-amber-50 border border-amber-200">
                  <div className="flex items-start">
                    <Info size={16} className="mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      For sick leave longer than 3 days, a doctor's note may be required upon return.
                    </p>
                  </div>
                </TouchOptimizedCard>
              )}
            </div>
          );
        }

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Reason</h2>
            <p className="text-gray-600">Please explain why you need to edit your time records</p>
            
            <div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Please explain why you need to edit your time records (e.g., forgot to clock in/out, system error, etc.)..."
              />
            </div>

            <TouchOptimizedCard className="p-3 bg-blue-50 border border-blue-200">
              <div className="flex items-start">
                <Clock size={16} className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Time edit requests require manager approval. Please provide accurate times and a clear explanation.
                </p>
              </div>
            </TouchOptimizedCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  navigate('/');
                }
              }}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-900">
              {isTimeEditRequest ? 'Time Edit Request' : 'Time Off Request'}
            </h1>
          </div>
          
          <div className="text-sm text-gray-500">
            {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderStep()}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm p-4">
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canProceedToNextStep()}
              className="flex-1"
            >
              Submit Request
            </Button>
          )}
        </div>
      </div>

      {/* Bottom padding to account for fixed button */}
      <div className="h-20" />
    </div>
  );
};

export default MobileRequestFormPage;