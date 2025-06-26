import React, { useState } from 'react';
import { X, Calendar, Clock, Check, Info } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';
import Button from '../ui/Button';
import { useCapacitor } from '../../hooks/useCapacitor';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: string;
    name: string;
    email: string;
    department: string;
    avatar?: string;
  };
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, employee }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [meetingType, setMeetingType] = useState<string>('one-on-one');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isNative } = useCapacitor();
  
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768 || isNative;

  const handleSubmit = async () => {
    if (!selectedDate) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would send data to the server
      console.log('Scheduling meeting:', {
        employeeId: employee.id,
        employeeName: employee.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        meetingType,
        startTime,
        endTime,
        notes
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success!
      alert(`Meeting scheduled with ${employee.name} on ${format(selectedDate, 'MMMM d, yyyy')} at ${startTime}`);
      onClose();
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Meeting type options
  const meetingTypes = [
    { value: 'one-on-one', label: 'One-on-One Meeting' },
    { value: 'performance-review', label: 'Performance Review' },
    { value: 'time-off-discussion', label: 'Time Off Discussion' },
    { value: 'project-planning', label: 'Project Planning' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div 
        className={`relative w-full rounded-lg bg-white shadow-xl ${isMobile ? 'max-h-[90vh] overflow-y-auto' : 'max-w-md'}`}
        style={{ maxHeight: isMobile ? '90vh' : 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Schedule with {employee.name}</h2>
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
          <div className="space-y-5">
            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {meetingTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <div className="rounded-lg border border-gray-200 p-2 bg-gray-50">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  disabled={{ before: new Date() }}
                  className="mx-auto"
                  modifiersClassNames={{
                    selected: 'bg-blue-600 text-white rounded-full',
                    today: 'font-bold border border-blue-500'
                  }}
                />
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    // Automatically set end time 30 minutes later
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const endDate = new Date();
                    endDate.setHours(hours, minutes + 30);
                    setEndTime(
                      `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
                    );
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add any additional details about the meeting..."
              />
            </div>

            {/* Selected Date Summary */}
            {selectedDate && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center text-blue-700">
                  <Calendar size={16} className="mr-2 flex-shrink-0" />
                  <span className="font-medium">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                {startTime && endTime && (
                  <div className="mt-2 flex items-center text-blue-700">
                    <Clock size={16} className="mr-2 flex-shrink-0" />
                    <span>
                      {startTime} - {endTime}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Info Message */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-start">
                <Info size={16} className="mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  This will send a calendar invitation to {employee.name} and add the meeting to your calendar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || isSubmitting}
              loading={isSubmitting}
              icon={<Check size={16} />}
            >
              Schedule Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;