import React, { useEffect, useState } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { DayPicker, DateFormatter } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useRequestStore } from '../store/requestStore';
import { TimeOffRequest } from '../types/request';
import { useAuth } from '../context/AuthContext';

const CalendarPage: React.FC = () => {
  const { requests, fetchRequests, isLoading } = useRequestStore();
  const { user, isManager } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [dayRequests, setDayRequests] = useState<TimeOffRequest[]>([]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (selectedDay) {
      const requestsOnDay = requests.filter(request => {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const day = new Date(selectedDay);
        
        // Reset time part to compare dates only
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        day.setHours(0, 0, 0, 0);
        
        return day >= start && day <= end;
      });
      
      setDayRequests(requestsOnDay);
    } else {
      setDayRequests([]);
    }
  }, [selectedDay, requests]);

  // Function to get events for a day (used for styling)
  const getEventsForDay = (day: Date): { type: string, status: string }[] => {
    return requests.filter(request => {
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      
      // Reset time part to compare dates only
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      day.setHours(0, 0, 0, 0);
      
      return day >= start && day <= end;
    }).map(request => ({
      type: request.type,
      status: request.status
    }));
  };

  // Function to determine day cell CSS class based on events
  const getDayClassName = (day: Date) => {
    const events = getEventsForDay(day);
    if (events.length === 0) return '';
    
    // Priority: pending > approved > rejected
    if (events.some(e => e.status === 'pending')) {
      return 'day-with-pending';
    }
    if (events.some(e => e.status === 'approved')) {
      return 'day-with-approved';
    }
    if (events.some(e => e.status === 'rejected')) {
      return 'day-with-rejected';
    }
    
    return '';
  };

  const formatDayContent: DateFormatter = (date) => {
    const events = getEventsForDay(date);
    
    return (
      <div className="relative">
        {date.getDate()}
        
        {/* Small dots indicating events */}
        {events.length > 0 && (
          <div className="absolute -bottom-1 left-0 right-0 flex justify-center space-x-0.5">
            {events.length <= 3 ? (
              events.map((event, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-1 rounded-full ${
                    event.status === 'pending' 
                      ? 'bg-amber-500' 
                      : event.status === 'approved' 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}
                />
              ))
            ) : (
              <>
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <div className="h-1 w-1 rounded-full bg-blue-500" />
                <div className="h-1 w-1 rounded-full bg-blue-500" />
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Custom CSS for the calendar
  const customStyles = `
    .day-with-pending:not(.rdp-day_selected) { 
      background-color: rgba(245, 158, 11, 0.1);
    }
    .day-with-approved:not(.rdp-day_selected) {
      background-color: rgba(16, 185, 129, 0.1);
    }
    .day-with-rejected:not(.rdp-day_selected) {
      background-color: rgba(239, 68, 68, 0.1);
    }
    .rdp-day_selected {
      background-color: #2563eb !important;
      color: white !important;
    }
  `;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{customStyles}</style>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Time Off Calendar</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-md lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">Team Calendar</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-500">Pending</span>
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Approved</span>
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-500">Rejected</span>
              </div>
            </div>
          </div>
          
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            formatters={{ formatDay: formatDayContent }}
            modifiersClassNames={{
              selected: 'rdp-day_selected'
            }}
            modifiers={{
              ...Object.fromEntries(
                requests.map((request, idx) => {
                  const start = new Date(request.startDate);
                  const end = new Date(request.endDate);
                  return [
                    `event-${idx}`,
                    { 
                      from: start, 
                      to: end 
                    }
                  ];
                })
              )
            }}
            modifiersStyles={{
              ...Object.fromEntries(
                requests.map((_, idx) => [
                  `event-${idx}`,
                  { 
                    fontWeight: 'bold'
                  }
                ])
              )
            }}
            className="w-full"
          />
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">
            {selectedDay 
              ? `Requests for ${format(selectedDay, 'MMMM d, yyyy')}` 
              : 'Select a date to view requests'}
          </h2>
          
          {selectedDay && dayRequests.length === 0 && (
            <p className="text-gray-500">No time off requests for this date.</p>
          )}
          
          {dayRequests.length > 0 && (
            <div className="space-y-4">
              {dayRequests.map(request => (
                <div 
                  key={request.id}
                  className="rounded-md border border-gray-200 p-3 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 overflow-hidden rounded-full">
                        <img 
                          src={request.employee.avatar || "https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=300"} 
                          alt={request.employee.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-2">
                        <p className="font-medium text-gray-800">{request.employee.name}</p>
                        <p className="text-xs text-gray-500">{request.employee.department}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        request.type === 'vacation' ? 'bg-blue-100 text-blue-800' :
                        request.type === 'sick' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        request.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-600">{request.reason}</p>
                    
                    <p className="mt-2 text-xs text-gray-500">
                      {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;