import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Calendar, Info, Clock, ArrowLeft, CheckCircle, AlertTriangle, MapPin, User, FileText, Plus } from 'lucide-react';
import { useRequestStore } from '../store/requestStore';
import { useAuth } from '../context/AuthContext';
import { RequestType } from '../types/request';
import { useNotificationStore } from '../store/notificationStore';
import { useToast } from '../hooks/useToast';
import GradientBackground from '../components/ui/GradientBackground';
import AnimatedCard from '../components/ui/AnimatedCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';

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
  const [currentStep, setCurrentStep] = useState(1);
  
  const { addRequest } = useRequestStore();
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const isTimeEditRequest = type === 'time edit';
  const totalSteps = 3;

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

  const requestTypes = [
    {
      value: 'paid time off' as RequestType,
      label: 'Paid Time Off',
      description: 'Vacation days, personal time, holidays',
      icon: <MapPin size={20} className="text-blue-500" />,
      color: 'border-blue-200 bg-blue-50 hover:bg-blue-100'
    },
    {
      value: 'sick leave' as RequestType,
      label: 'Sick Leave',
      description: 'Medical appointments, illness recovery',
      icon: <User size={20} className="text-orange-500" />,
      color: 'border-orange-200 bg-orange-50 hover:bg-orange-100'
    },
    {
      value: 'time edit' as RequestType,
      label: 'Time Edit Request',
      description: 'Correct clock in/out times, missed punches',
      icon: <Clock size={20} className="text-purple-500" />,
      color: 'border-purple-200 bg-purple-50 hover:bg-purple-100'
    },
    {
      value: 'other' as RequestType,
      label: 'Other',
      description: 'Bereavement, jury duty, other requests',
      icon: <FileText size={20} className="text-gray-500" />,
      color: 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    }
  ];

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return type !== '';
      case 2:
        if (isTimeEditRequest) {
          return range?.from !== undefined;
        }
        return range?.from !== undefined && range?.to !== undefined;
      case 3:
        if (isTimeEditRequest) {
          // Only require the requested times for time edit requests
          return requestedClockIn && requestedClockOut && reason.trim() !== '';
        }
        return reason.trim() !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    if (!range?.from) {
      setError('Please select a date');
      return;
    }

    if (isTimeEditRequest) {
      // Only require the requested times for time edit requests
      if (!requestedClockIn || !requestedClockOut) {
        setError('Please fill in the correct clock in/out times');
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
        startDate: new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate()),
        endDate: new Date((range.to || range.from).getFullYear(), (range.to || range.from).getMonth(), (range.to || range.from).getDate()),
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
        message: 'Your request has been submitted for approval and will be reviewed by your manager.'
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Failed to submit request. Please try again.');
      
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <AnimatedCard className="p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Request Type</h2>
              <p className="text-gray-600">Choose the type of time off request you'd like to submit</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {requestTypes.map((requestType) => (
                <button
                  key={requestType.value}
                  onClick={() => {
                    setType(requestType.value);
                    // Reset date selection when changing type
                    setRange(undefined);
                  }}
                  className={`
                    relative rounded-xl border-2 p-6 text-left transition-all duration-200 hover:shadow-md
                    ${type === requestType.value 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : requestType.color
                    }
                  `}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {requestType.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {requestType.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {requestType.description}
                      </p>
                    </div>
                    {type === requestType.value && (
                      <CheckCircle className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {type && (
              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start">
                  <Info size={16} className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    {type === 'paid time off' && (
                      <p>Paid time off requests should be submitted at least 2 weeks in advance when possible.</p>
                    )}
                    {type === 'sick leave' && (
                      <p>For sick leave longer than 3 consecutive days, a doctor's note may be required upon return.</p>
                    )}
                    {type === 'time edit' && (
                      <p>Time edit requests should be submitted within 7 days of the original date for accurate payroll processing.</p>
                    )}
                    {type === 'other' && (
                      <p>Please provide detailed information about your request in the reason field.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </AnimatedCard>
        );

      case 2:
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <AnimatedCard className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isTimeEditRequest ? 'Select Date' : 'Select Date Range'}
                </h2>
                <p className="text-gray-600">
                  {isTimeEditRequest 
                    ? 'Choose the date you need to edit'
                    : 'Choose your time off dates'
                  }
                </p>
              </div>
              
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
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
                <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center text-green-700">
                    <Calendar size={16} className="mr-2" />
                    <span className="font-medium">
                      {isTimeEditRequest 
                        ? format(range.from, 'PPP')
                        : range?.to 
                        ? `${format(range.from, 'PPP')} - ${format(range.to, 'PPP')}`
                        : format(range.from, 'PPP')
                      }
                    </span>
                  </div>
                </div>
              )}
            </AnimatedCard>

            {isTimeEditRequest && range?.from && (
              <AnimatedCard className="p-8" delay={100}>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Time Details</h3>
                  <p className="text-gray-600">Enter the original and correct times</p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <h4 className="font-medium text-amber-800 mb-3">Original Times (Optional)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clock In
                        </label>
                        <input
                          type="time"
                          value={originalClockIn}
                          onChange={(e) => setOriginalClockIn(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clock Out
                        </label>
                        <input
                          type="time"
                          value={originalClockOut}
                          onChange={(e) => setOriginalClockOut(e.target.value)}
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
                          value={requestedClockIn}
                          onChange={(e) => setRequestedClockIn(e.target.value)}
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
                          value={requestedClockOut}
                          onChange={(e) => setRequestedClockOut(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            )}
          </div>
        );

      case 3:
        return (
          <AnimatedCard className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Details</h2>
              <p className="text-gray-600">
                {isTimeEditRequest 
                  ? 'Please explain why you need to edit your time records'
                  : 'Provide details about your time off request'
                }
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Request
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder={
                    isTimeEditRequest 
                      ? "Please explain why you need to edit your time records (e.g., forgot to clock in/out, system error, etc.)..."
                      : "Please provide details about your time off request..."
                  }
                />
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>Be specific and provide relevant details</span>
                  <span>{reason.length}/500</span>
                </div>
              </div>

              {/* Request Summary */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Request Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <Badge variant="info" size="sm">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date(s):</span>
                    <span className="font-medium">
                      {range?.from && (
                        isTimeEditRequest 
                          ? format(range.from, 'MMM d, yyyy')
                          : range?.to 
                          ? `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
                          : format(range.from, 'MMM d, yyyy')
                      )}
                    </span>
                  </div>
                  {isTimeEditRequest && (
                    <>
                      {(originalClockIn || originalClockOut) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Original Times:</span>
                          <span className="font-medium font-mono">
                            {originalClockIn || 'N/A'} - {originalClockOut || 'N/A'}
                          </span>
                        </div>
                      )}
                      {(requestedClockIn || requestedClockOut) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Requested Times:</span>
                          <span className="font-medium font-mono">
                            {requestedClockIn || 'N/A'} - {requestedClockOut || 'N/A'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee:</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                </div>
              </div>

              {type === 'sick leave' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-start">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      For sick leave longer than 3 days, a doctor's note may be required upon return.
                    </p>
                  </div>
                </div>
              )}

              {isTimeEditRequest && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-start">
                    <Clock size={16} className="mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Time edit requests require manager approval. Please provide accurate times and a clear explanation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AnimatedCard>
        );

      default:
        return null;
    }
  };

  return (
    <GradientBackground className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              icon={<ArrowLeft size={16} />}
              className="mr-4"
            >
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isTimeEditRequest ? 'Request Time Edit' : 'Request Time Off'}
            </h1>
            <p className="text-gray-600">
              {isTimeEditRequest 
                ? 'Submit a request to correct your time records'
                : 'Submit a new time off request for approval'
              }
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-200
                  ${currentStep >= step 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : 'border-gray-300 bg-white text-gray-500'
                  }
                `}>
                  {currentStep > step ? (
                    <CheckCircle size={20} />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`
                    h-1 w-16 transition-all duration-200
                    ${currentStep > step ? 'bg-blue-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <AlertTriangle size={16} className="mr-2 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={isSubmitting}
                icon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!validateCurrentStep() || isSubmitting}
                icon={<Plus size={16} />}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateCurrentStep() || isSubmitting}
                loading={isSubmitting}
                icon={<CheckCircle size={16} />}
              >
                Submit Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </GradientBackground>
  );
};

export default RequestFormPage;
